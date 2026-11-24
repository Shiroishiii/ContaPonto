import prisma from '../config/database.js';
export async function index(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const rawLimit = req.query.limit === undefined ? 30 : Number(req.query.limit);
    if (!Number.isInteger(page) || !Number.isInteger(rawLimit) || rawLimit < 1) return res.status(400).json({ success: false, message: 'Paginação inválida.' });
    const limit = Math.min(100, rawLimit);
    const categoryEntities = { Funcionários: ['Employee'], Jornadas: ['WorkSchedule', 'EmployeeSchedule'], Solicitações: ['CorrectionRequest'] };
    const category = categoryEntities[req.query.category];
    const where = { companyId: req.user.companyId, ...(category ? { entity: { in: category } } : req.query.entity ? { entity: String(req.query.entity).slice(0, 100) } : {}), ...(req.query.action ? { action: String(req.query.action).slice(0, 100) } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, data: { items, page, limit, total } });
  } catch (error) { next(error); }
}
