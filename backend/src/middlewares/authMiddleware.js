
import jwt from "jsonwebtoken";
import  prisma  from "../config/database.js";

export async function authenticate(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Autenticação necessária.",
            });
        }

        const token = authorization.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: {
                id: Number(decoded.sub),
            },
            select: {
                id: true,
                companyId: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Usuário não encontrado ou inativo.",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token inválido ou expirado.",
        });
    }
}

// Controle de acesso por perfil
export function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Você não tem permissão para acessar este recurso.",
            });
        }

        next();
    };
}
