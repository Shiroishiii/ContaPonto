
import {
    registerTimeRecord,
    getTodayRecords,
} from "../services/timeRecordService.js";

export async function store(req, res, next) {
    try {
        const { type } = req.body;

        const record = await registerTimeRecord(
            req.user.id,
            req.user.companyId,
            type
        );

        return res.status(201).json({
            message: "Ponto registrado com sucesso.",
            data: record,
        });
    } catch (error) {
        next(error);
    }
}

export async function today(req, res, next) {
    try {
        const result = await getTodayRecords(
            req.user.id,
            req.user.companyId,
            req.user.role
        );

        return res.json({
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
