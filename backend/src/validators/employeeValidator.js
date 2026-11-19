import { z } from "zod";

export const createEmployeeSchema = z.object({
    fullName: z.string().trim().min(3, "Informe o nome completo").max(150),

    employeeCode: z.string().trim().min(1, "Informe a matrícula").max(30),

    cpf: z.string().optional().transform((value) => {
        if (!value) return undefined;
        const digits = value.replace(/\D/g, "");
        return digits || undefined;
    }).refine(
        (value) => !value || /^\d{11}$/.test(value),
        "CPF deve conter 11 dígitos"
    ),

    phone: z.string().trim().max(20).optional(),

    position: z.string().trim().max(100).optional(),

    admissionDate: z.string().date("Data de admissão inválida").optional(),

    email: z.string().trim().email("Informe um e-mail válido")
        .max(180).transform((value) => value.toLowerCase()),

    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
        .max(72, "A senha deve ter no máximo 72 caracteres"),

    scheduleId: z.coerce.number().int().positive().optional(),

    scheduleStartDate: z.string().date("Data inicial da jornada inválida").optional(),
}).superRefine((data, ctx) => {
    if (data.scheduleId && !data.scheduleStartDate) {
        ctx.addIssue({
            code: "custom",
            path: ["scheduleStartDate"],
            message: "Informe a data inicial da jornada",
        });
    }
});

export const updateEmployeeSchema = z.object({
    fullName: z.string().trim().min(3).max(150).optional(),

    employeeCode: z.string().trim().min(1).max(30).optional(),

    cpf: z.string().optional().transform((value) => {
        if (value === undefined) return undefined;

        const digits = value.replace(/\D/g, "");
        return digits || null;
    }).refine(
        (value) => value === undefined || value === null || /^\d{11}$/.test(value),
        "CPF deve conter 11 dígitos"
    ),

    phone: z.string().trim().max(20).nullable().optional(),

    position: z.string().trim().max(100).nullable().optional(),

    admissionDate: z.string().date("Data de admissão inválida").nullable().optional(),

    email: z.string().trim().email("Informe um e-mail válido")
        .max(180)
        .transform((value) => value.toLowerCase())
        .optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar."
);

export const employeeStatusSchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
});
