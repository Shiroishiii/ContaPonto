
export function errorMiddleware(error, req, res, next) {
    console.error(error);

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