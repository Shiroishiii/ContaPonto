import { Router } from "express";
import prisma from "../config/database.js";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js"
import scheduleRoutes from "./scheduleRoutes.js";
import timeRecordRoutes from "./timeRecordRoutes.js"

const router = Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Conta Ponto API",
    });
});

router.get("/health", async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            success: true,
            message: "API e banco de dados funcionando.",
        });
    } catch (error) {
        next(error);
    }
});

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/time-records", timeRecordRoutes);

export default router;
