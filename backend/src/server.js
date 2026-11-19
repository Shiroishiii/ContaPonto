import app from "./app.js";
import prisma from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
    try {
        await prisma.$connect();

        console.log("MySQL conectado com sucesso.");

        app.listen(env.port, () => {
            console.log(`Conta Ponto API rodando na porta ${env.port}`);
            console.log(`http://localhost:${env.port}/api`);
        });
    } catch (error) {
        console.error("Erro ao iniciar servidor:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();