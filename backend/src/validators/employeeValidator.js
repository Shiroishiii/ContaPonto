import { z } from "zod";

function normalizeCpf(value, emptyValue = undefined) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return emptyValue;
    if (typeof value !== "string") return value;
    const digits = value.replace(/\D/g, "");
    return digits || emptyValue;
}

function isValidCpf(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^([0-9])\1{10}$/.test(cpf)) return false;
    const digits = [...cpf].map(Number);
    for (let length = 9; length <= 10; length++) {
        const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
        const check = (sum * 10) % 11 % 10;
        if (digits[length] !== check) return false;
    }
    return true;
}

const cpfSchema = (emptyValue) => z.preprocess(
    (value) => normalizeCpf(value, emptyValue),
    z.union([z.string().refine(isValidCpf, "CPF invÃ¡lido"), z.null(), z.undefined()]),
);
const phoneSchema = z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().trim().regex(/^\+?\d[\d\s().-]{7,18}\d$/, "Telefone invÃ¡lido").max(20).optional(),
);

export const createEmployeeSchema = z.object({
    fullName: z.string().trim().min(3, "Informe o nome completo").max(150),
    employeeCode: z.string().trim().min(1, "Informe a matrÃ­cula").max(30),
    cpf: cpfSchema(undefined),
    phone: phoneSchema,
    position: z.string().trim().max(100).optional(),
    admissionDate: z.string().date("Data de admissÃ£o invÃ¡lida").optional(),
    email: z.string().trim().email("Informe um e-mail vÃ¡lido").max(180).transform((value) => value.toLowerCase()),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72, "A senha deve ter no mÃ¡ximo 72 caracteres"),
    scheduleId: z.coerce.number().int().positive().optional(),
    scheduleStartDate: z.string().date("Data inicial da jornada invÃ¡lida").optional(),
}).superRefine((data, ctx) => {
    if (data.scheduleId && !data.scheduleStartDate) {
        ctx.addIssue({ code: "custom", path: ["scheduleStartDate"], message: "Informe a data inicial da jornada" });
    }
});

export const updateEmployeeSchema = z.object({
    fullName: z.string().trim().min(3).max(150).optional(),
    employeeCode: z.string().trim().min(1).max(30).optional(),
    cpf: cpfSchema(null),
    phone: z.union([
        z.string().trim().regex(/^\+?\d[\d\s().-]{7,18}\d$/, "Telefone invÃ¡lido").max(20),
        z.null(),
    ]).optional(),
    position: z.string().trim().max(100).nullable().optional(),
    admissionDate: z.string().date("Data de admissÃ£o invÃ¡lida").nullable().optional(),
    email: z.string().trim().email("Informe um e-mail vÃ¡lido").max(180).transform((value) => value.toLowerCase()).optional(),
}).refine((data) => Object.keys(data).length > 0, "Informe pelo menos um campo para atualizar.");

export const employeeStatusSchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]),
});
