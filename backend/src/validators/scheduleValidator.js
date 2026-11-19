
import { z } from "zod";

const timeSchema = z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Horário inválido. Utilize HH:mm."
);

const scheduleDaySchema = z.object({
    weekday: z.number().int().min(0).max(6),

    startTime: timeSchema,
    breakStartTime: timeSchema.nullable().optional(),
    breakEndTime: timeSchema.nullable().optional(),
    endTime: timeSchema,
}).superRefine((day, ctx) => {
    const breakStart = day.breakStartTime || null;
    const breakEnd = day.breakEndTime || null;

    if (Boolean(breakStart) !== Boolean(breakEnd)) {
        ctx.addIssue({
            code: "custom",
            message: "Informe o início e o fim do intervalo.",
            path: ["breakStartTime"],
        });
    }

    if (day.endTime <= day.startTime) {
        ctx.addIssue({
            code: "custom",
            message: "A saída deve ser posterior à entrada.",
            path: ["endTime"],
        });
    }

    if (breakStart && breakEnd) {
        if (
            breakStart <= day.startTime ||
            breakEnd <= breakStart ||
            breakEnd >= day.endTime
        ) {
            ctx.addIssue({
                code: "custom",
                message: "Os horários do intervalo devem estar dentro da jornada.",
                path: ["breakStartTime"],
            });
        }
    }
});

const daysSchema = z.array(scheduleDaySchema)
    .min(1, "Cadastre pelo menos um dia de trabalho.")
    .max(7, "Uma jornada pode ter no máximo sete dias.")
    .refine(
        (days) => new Set(days.map((day) => day.weekday)).size === days.length,
        "Não é permitido repetir dias da semana."
    );

export const createScheduleSchema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).nullable().optional(),
    days: daysSchema,
});

export const updateScheduleSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    days: daysSchema.optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar."
);

export const scheduleStatusSchema = z.object({
    isActive: z.boolean(),
});

export const assignScheduleSchema = z.object({
    employeeId: z.number().int().positive(),
    startDate: z.string().date("Data inicial inválida."),
});
