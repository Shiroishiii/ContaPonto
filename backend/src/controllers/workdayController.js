import { calculateEmployeeWorkday } from '../services/workdayCalculationService.js';
import prisma from '../config/database.js';

export async function showWorkday(req, res, next) {
  try {
    const employeeId = Number(req.params.employeeId);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(req.params.date) && !Number.isNaN(Date.parse(`${req.params.date}T12:00:00Z`)) && new Date(`${req.params.date}T12:00:00Z`).toISOString().slice(0, 10) === req.params.date;
    if (!Number.isInteger(employeeId) || employeeId < 1 || !validDate) {
      return res.status(400).json({ success: false, message: 'Funcionário ou data inválidos. Use YYYY-MM-DD.' });
    }
    let targetId = employeeId;
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findFirst({ where: { userId: req.user.id, companyId: req.user.companyId }, select: { id: true } });
      if (!employee || employee.id !== employeeId) return res.status(403).json({ success: false, message: 'Você só pode consultar seu próprio histórico.' });
      targetId = employee.id;
    }
    const result = await calculateEmployeeWorkday(targetId, req.user.companyId, req.params.date);
    return res.json({ success: true, data: result });
  } catch (error) { next(error); }
}
