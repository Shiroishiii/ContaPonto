
import {
    createSchedule,
    listSchedules,
    getSchedule,
    updateSchedule,
    changeScheduleStatus,
    assignSchedule,
} from "../services/scheduleService.js";

import {
    createScheduleSchema,
    updateScheduleSchema,
    scheduleStatusSchema,
    assignScheduleSchema,
} from "../validators/scheduleValidator.js";

export async function store(req, res, next) {
    try {
        const data = createScheduleSchema.parse(req.body);

        const schedule = await createSchedule(
            data,
            req.user.companyId,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            message: "Jornada criada com sucesso.",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
}

export async function index(req, res, next) {
    try {
        const schedules = await listSchedules(req.user.companyId);

        return res.status(200).json({
            success: true,
            data: schedules,
        });
    } catch (error) {
        next(error);
    }
}

export async function show(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de jornada inválido.",
            });
        }

        const schedule = await getSchedule(id, req.user.companyId);

        return res.status(200).json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
}

export async function update(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de jornada inválido.",
            });
        }

        const data = updateScheduleSchema.parse(req.body);

        const schedule = await updateSchedule(
            id,
            req.user.companyId,
            req.user.id,
            data
        );

        return res.status(200).json({
            success: true,
            message: "Jornada atualizada com sucesso.",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateStatus(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de jornada inválido.",
            });
        }

        const { isActive } = scheduleStatusSchema.parse(req.body);

        const schedule = await changeScheduleStatus(
            id,
            req.user.companyId,
            req.user.id,
            isActive
        );

        return res.status(200).json({
            success: true,
            message: isActive
                ? "Jornada ativada com sucesso."
                : "Jornada desativada com sucesso.",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
}

export async function assign(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de jornada inválido.",
            });
        }

        const data = assignScheduleSchema.parse(req.body);

        const assignment = await assignSchedule(
            id,
            req.user.companyId,
            req.user.id,
            data.employeeId,
            data.startDate
        );

        return res.status(201).json({
            success: true,
            message: "Jornada atribuída ao funcionário com sucesso.",
            data: assignment,
        });
    } catch (error) {
        next(error);
    }
}
