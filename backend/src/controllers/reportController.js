import prisma from '../config/database.js';
import { calculateEmployeeWorkday } from '../services/workdayCalculationService.js';
const valid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
export async function index(req, res, next) {
  try {
    const endDate = String(req.query.endDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()));
    const startDate = String(req.query.startDate || endDate);
    if (!valid(startDate) || !valid(endDate) || startDate > endDate) return res.status(400).json({ success: false, message: 'Informe um período válido em YYYY-MM-DD.' });
    if (req.query.employeeId !== undefined && (!/^\d+$/.test(String(req.query.employeeId)) || Number(req.query.employeeId) < 1)) return res.status(400).json({ success: false, message: 'ID de funcionário inválido.' });
    const span = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000 + 1;
    if (span > 93) return res.status(400).json({ success: false, message: 'O período máximo é de 93 dias.' });
    const employees = await prisma.employee.findMany({ where: { companyId: req.user.companyId, status: 'ACTIVE', ...(req.query.employeeId ? { id: Number(req.query.employeeId) } : {}) }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, employeeCode: true } });
    const dayBuckets = new Map(employees.map((employee) => [employee.id, new Array(span)]));
    const jobs = employees.flatMap((employee) => Array.from({ length: span }, (_, offset) => ({ employeeId: employee.id, offset, date: new Date(Date.parse(`${startDate}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10) })));
    let cursor = 0;
    const worker = async () => { while (true) { const index = cursor++; if (index >= jobs.length) return; const job = jobs[index]; dayBuckets.get(job.employeeId)[job.offset] = await calculateEmployeeWorkday(job.employeeId, req.user.companyId, job.date); } };
    await Promise.all(Array.from({ length: Math.min(8, jobs.length) }, worker));
    const summaries = employees.map((employee) => {
      const days = dayBuckets.get(employee.id);
      const sum = (key) => days.reduce((total, d) => total + (d.summary[key] || 0), 0);
      return { employee, expectedMinutes: sum('expectedMinutes'), workedMinutes: sum('workedMinutes'), overtimeMinutes: sum('overtimeMinutes'), lateMinutes: sum('lateMinutes'), incompleteDays: days.filter((d) => ['IN_PROGRESS', 'NOT_STARTED', 'NO_SCHEDULE'].includes(d.status) && d.records.length > 0).length, days };
    });
    const total = (key) => summaries.reduce((n, s) => n + s[key], 0);
    res.json({ success: true, data: { startDate, endDate, timezone: (await prisma.company.findUnique({ where: { id: req.user.companyId }, select: { timezone: true } }))?.timezone || 'America/Sao_Paulo', summaries, totals: { expectedMinutes: total('expectedMinutes'), workedMinutes: total('workedMinutes'), overtimeMinutes: total('overtimeMinutes'), lateMinutes: total('lateMinutes'), incompleteDays: total('incompleteDays') } } });
  } catch (error) { next(error); }
}
