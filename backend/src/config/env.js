import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
    "DATABASE_URL",
    "JWT_SECRET"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`Variável ${variable} não configurada.`);
    }
}

export const env = {
    port: Number(process.env.PORT) || 3333,
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};