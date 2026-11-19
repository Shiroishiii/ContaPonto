import { z } from "zod"

export const registerSchema = z.object({
    companyName: z
        .string()
        .trim()
        .min(2, "Informe o nome da empresa")
        .max(150),

    cnpj: z.preprocess
        ((value) => {
            if (typeof value === "string") return value;

            const digits = value.replace(/\D/g, "");
            return digits.length ? digits : undefined;
        },
            z.string().regex(/^\d{14}$/, "Informe um CNPJ válido").optional()
        ),

    adminName: z
        .string()
        .trim()
        .min(2, "Informe o nome do administrador")
        .max(150),

    email: z
        .string()
        .trim()
        .email("Informe um email válido")
        .max(180)
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "A senha deve ter pelo menos 8 caracteres")
        .max(72, "A senha deve ter no máximo 72 caracteres")
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Informe um e-mail válido")
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(1, "Informe sua senha")
        .max(72, "Senha inválida"),
});