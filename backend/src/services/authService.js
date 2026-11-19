import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../config/database.js"

export async function registerCompany(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: data.companyName,
                    cnpj: data.cnpj ?? null
                }
            });

            const admin = await tx.user.create({
                data: {
                    companyId: company.id,
                    name: data.adminName,
                    email: data.email,
                    passwordHash: passwordHash,
                    role: "ADMIN",
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });

            return {
                company: {
                    id: company.id,
                    name: company.name,
                    cnpj: company.cnpj ?? null
                },
                admin,
            };
        });

        return result;
    } catch (error) {
        if (error.code === "P2002") {
            const target = error.meta?.target;
            const fields = Array.isArray(target) ? target : [target];

            if (fields.includes("email")) {
                const conflict = new Error("Email já cadastrado");
                conflict.status = 409;
                throw conflict;
            }

            if (fields.includes("cnpj")) {
                const conflict = new Error("CNPJ já cadastrado");
                conflict.status = 409;
                throw conflict;
            }

            const conflict = new Error("Erro ao cadastrar empresa");
            conflict.status = 500;
            throw conflict;
        }
        throw error;
    }
}

export async function loginUser(data) {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
        select: {
            id: true,
            companyId: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
        },
    });

    if (!user || !user.isActive) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    const passwordMatches = await bcrypt.compare(
        data.password,
        user.passwordHash
    );

    if (!passwordMatches) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET não configurado.");
    }

    const token = jwt.sign(
        {
            sub: String(user.id),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            lastLoginAt: new Date(),
        },
    });

    return {
        token,
        user: {
            id: user.id,
            companyId: user.companyId,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}