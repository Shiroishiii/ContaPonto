import { z } from 'zod';
export const createCorrectionSchema = z.object({
  action: z.enum(['ADD_RECORD', 'ADJUST_TIME', 'REMOVE_RECORD']),
  recordId: z.number().int().positive().nullable().optional(),
  requestedType: z.enum(['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT']).nullable().optional(),
  requestedAt: z.string().datetime({ offset: true }).nullable().optional(),
  reason: z.string().trim().min(10).max(2000),
}).superRefine((v, ctx) => {
  if (v.action === 'ADD_RECORD' && (!v.requestedType || !v.requestedAt)) ctx.addIssue({ code: 'custom', message: 'Tipo e horário solicitados são obrigatórios para adicionar um registro.' });
  if (v.action === 'ADJUST_TIME' && (!v.recordId || !v.requestedAt)) ctx.addIssue({ code: 'custom', message: 'Registro original e novo horário são obrigatórios para ajustar.' });
  if (v.action === 'REMOVE_RECORD' && !v.recordId) ctx.addIssue({ code: 'custom', message: 'Informe o registro a remover.' });
});
export const reviewCorrectionSchema = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reviewerNote: z.string().trim().max(2000).nullable().optional() });
