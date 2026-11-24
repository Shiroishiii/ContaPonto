import prisma from '../config/database.js';
import { getRecordSequence } from '../utils/workdayRules.js';

const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function parts(date, timezone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((item) => [item.type, item.value]));
}
function localDate(date, timezone) { const value = parts(date, timezone); return `${value.year}-${value.month}-${value.day}`; }
function localMidnight(dateString, timezone) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  let candidate = new Date(target);
  for (let i = 0; i < 4; i++) {
    const p = parts(candidate, timezone);
    const localUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const next = new Date(target - (localUTC - candidate.getTime()));
    if (next.getTime() === candidate.getTime()) break;
    candidate = next;
  }
  return candidate;
}
async function validateTimeline(tx, correction, requestedAt, timezone) {
  const date = localDate(requestedAt, timezone);
  const start = localMidnight(date, timezone);
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const end = localMidnight(nextDate, timezone);
  const assignmentDate = new Date(`${date}T12:00:00.000Z`);
  const assignment = await tx.employeeSchedule.findFirst({
    where: { employeeId: correction.employeeId, startDate: { lte: assignmentDate }, OR: [{ endDate: null }, { endDate: { gte: assignmentDate } }], schedule: { companyId: correction.companyId } },
    include: { schedule: { include: { days: true } } }, orderBy: { startDate: 'desc' },
  });
  const scheduleDay = assignment?.schedule.days.find((item) => item.weekday === assignmentDate.getUTCDay());
  const expected = getRecordSequence(scheduleDay);
  const records = await tx.timeRecord.findMany({ where: { employeeId: correction.employeeId, companyId: correction.companyId, recordedAt: { gte: start, lt: end } }, orderBy: { recordedAt: 'asc' } });
  const projected = records.map((record) => record.id === correction.recordId && correction.action === 'ADJUST_TIME' ? { ...record, recordedAt: requestedAt } : record);
  if (correction.action === 'ADD_RECORD') projected.push({ id: null, type: correction.requestedType, recordedAt: requestedAt });
  projected.sort((a, b) => a.recordedAt - b.recordedAt);
  if (projected.length > expected.length || projected.some((record, index) => record.type !== expected[index] || (index > 0 && record.recordedAt <= projected[index - 1].recordedAt))) {
    throw fail('A alteração aprovada deixaria os registros fora da sequência ou com horários inconsistentes.', 409);
  }
}

export async function createCorrection(userId, companyId, data) {
  const employee = await prisma.employee.findFirst({ where: { userId, companyId, status: 'ACTIVE' }, select: { id: true } });
  if (!employee) throw fail('Funcionário ativo não encontrado.', 404);
  if (data.requestedAt && new Date(data.requestedAt) > new Date()) throw fail('O horário solicitado não pode estar no futuro.');
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { timezone: true } });
  const localDate = (date) => date ? new Intl.DateTimeFormat('en-CA', { timeZone: company?.timezone || 'America/Sao_Paulo' }).format(date) : null;
  if (data.recordId) {
    const record = await prisma.timeRecord.findFirst({ where: { id: data.recordId, companyId, employeeId: employee.id } });
    if (!record) throw fail('Registro não encontrado.', 404);
    if (data.action === 'ADJUST_TIME' && data.requestedType && data.requestedType !== record.type) throw fail('O tipo solicitado não corresponde ao registro original.');
    if (data.action === 'ADJUST_TIME' && localDate(record.recordedAt) !== localDate(new Date(data.requestedAt))) throw fail('O novo horário deve permanecer no mesmo dia do registro original.');
  }
  return prisma.$transaction(async tx => {
    if (data.requestedType && data.requestedAt) {
      const pending = await tx.correctionRequest.findMany({ where: { employeeId: employee.id, companyId, requestedType: data.requestedType, status: 'PENDING' }, select: { requestedAt: true } });
      if (pending.some((request) => localDate(request.requestedAt) === localDate(new Date(data.requestedAt)))) throw fail('Já existe uma solicitação pendente para esse tipo de registro e data.', 409);
    }
    const correction = await tx.correctionRequest.create({ data: { companyId, employeeId: employee.id, ...data, requestedAt: data.requestedAt ? new Date(data.requestedAt) : null } });
    await tx.auditLog.create({ data: { companyId, userId, action: 'CORRECTION_REQUESTED', entity: 'CorrectionRequest', entityId: String(correction.id), details: { action: data.action, recordId: data.recordId ?? null } } });
    return correction;
  });
}

export async function listCorrections(user, filters = {}) {
  if (filters.status && !['PENDING', 'APPROVED', 'REJECTED'].includes(filters.status)) throw fail('Status de solicitação inválido.');
  const employee = user.role === 'EMPLOYEE' ? await prisma.employee.findFirst({ where: { userId: user.id, companyId: user.companyId }, select: { id: true } }) : null;
  if (user.role === 'EMPLOYEE' && !employee) return [];
  return prisma.correctionRequest.findMany({
    where: { companyId: user.companyId, ...(employee ? { employeeId: employee.id } : {}), ...(filters.status ? { status: filters.status } : {}) },
    include: { employee: { select: { id: true, fullName: true, employeeCode: true } }, record: true, reviewedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }, take: Math.min(Number(filters.limit) || 100, 200),
  });
}

export async function reviewCorrection(id, companyId, reviewerId, decision, reviewerNote) {
  return prisma.$transaction(async tx => {
    const request = await tx.correctionRequest.findFirst({ where: { id, companyId }, include: { employee: true, record: true } });
    if (!request) throw fail('Solicitação não encontrada.', 404);
    if (request.status !== 'PENDING') throw fail('Esta solicitação já foi decidida.', 409);

    let changedRecord = null;
    if (decision === 'APPROVED') {
      if (request.action === 'ADD_RECORD' || request.action === 'ADJUST_TIME') {
        const company = await tx.company.findUnique({ where: { id: companyId }, select: { timezone: true } });
        await validateTimeline(tx, request, request.requestedAt, company?.timezone || 'America/Sao_Paulo');
      }
      if (request.action === 'ADD_RECORD') {
        changedRecord = await tx.timeRecord.create({ data: { companyId, employeeId: request.employeeId, type: request.requestedType, recordedAt: request.requestedAt, source: 'WEB' } });
      } else {
        if (!request.record || request.record.employeeId !== request.employeeId) throw fail('O registro original não está mais disponível.', 409);
        const snapshot = { id: request.record.id, type: request.record.type, recordedAt: request.record.recordedAt.toISOString() };
        if (request.action === 'ADJUST_TIME') changedRecord = await tx.timeRecord.update({ where: { id: request.record.id }, data: { recordedAt: request.requestedAt } });
        if (request.action === 'REMOVE_RECORD') await tx.timeRecord.delete({ where: { id: request.record.id } });
        await tx.auditLog.create({ data: { companyId, userId: reviewerId, action: 'CORRECTION_RECORD_SNAPSHOT', entity: 'TimeRecord', entityId: String(request.record.id), details: { correctionId: id, operation: request.action, before: snapshot, after: changedRecord ? { type: changedRecord.type, recordedAt: changedRecord.recordedAt.toISOString() } : null } } });
      }
    }

    const updated = await tx.correctionRequest.update({ where: { id }, data: { status: decision, reviewedById: reviewerId, reviewedAt: new Date(), reviewerNote: reviewerNote || null } });
    await tx.auditLog.create({ data: { companyId, userId: reviewerId, action: decision === 'APPROVED' ? 'CORRECTION_APPROVED' : 'CORRECTION_REJECTED', entity: 'CorrectionRequest', entityId: String(id), details: { action: request.action, recordId: request.recordId, createdRecordId: changedRecord?.id ?? null, reviewerNote: reviewerNote || null } } });
    return updated;
  }, { isolationLevel: 'Serializable' });
}
