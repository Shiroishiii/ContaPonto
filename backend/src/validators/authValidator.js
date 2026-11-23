import { z } from "zod";

export const registerSchema = z.object({
    companyName: z.string().trim().min(2, "Informe o nome da empresa").max(150),
    cnpj: z.preprocess((value) => {
        if (value === undefined || value === null || value === "") return undefined;
        return typeof value === "string" ? value.replace(/\D/g, "") : value;
    }, z.string().regex(/^\d{14}$/, "Informe um CNPJ vÃ¡lido").optional()),
    adminName: z.string().trim().min(2, "Informe o nome do administrador").max(150),
    email: z.string().trim().email("Informe um email vÃ¡lido").max(180).transform((value) => value.toLowerCase()),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72, "A senha deve ter no mÃ¡ximo 72 caracteres"),
});

export const loginSchema = z.object({
    email: z.string().trim().email("Informe um e-mail vÃ¡lido").transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Informe sua senha").max(72, "Senha invÃ¡lida"),
});
