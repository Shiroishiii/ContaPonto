
import {
    registerCompany,
    loginUser,
} from "../services/authService.js";

import {
    registerSchema,
    loginSchema,
} from "../validators/authValidator.js";

export async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const result = await registerCompany(data);

        return res.status(201).json({
            success: true,
            message: "Empresa e administrador cadastrados com sucesso.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const result = await loginUser(data);

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function me(req, res) {
    return res.status(200).json({
        success: true,
        data: {
            user: req.user,
        },
    });
}
