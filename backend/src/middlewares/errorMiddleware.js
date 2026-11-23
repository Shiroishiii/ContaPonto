
export function errorMiddleware(error, req, res, next) {
    if (process.env.NODE_ENV !== "production") console.error(error);

    if (error.name === "ZodError") {
        return res.status(400).json({
            success: false,
            message: "Dados inválidos.",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    if (error.code === "P2002" || error.code === "P2003" || error.code === "P2034") {
        const message = error.code === "P2002" ? "Registro duplicado." :
            error.code === "P2003" ? "ReferÃªncia a registro inexistente." : "Conflito ao atualizar os dados. Tente novamente.";
        return res.status(409).json({ success: false, message });
    }
    if (error.code === "P2025") {
        return res.status(404).json({ success: false, message: "Registro nÃ£o encontrado." });
    }

    const status = error.status || 500;

    return res.status(status).json({
        success: false,
        message:
            status === 500
                ? "Erro interno do servidor."
                : error.message,
    });
}

export default errorMiddleware;
