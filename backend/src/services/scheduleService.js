import prisma from "../config/database.js";

function calculateExpectedMinutes(day) {
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const total = toMinutes(day.endTime) - toMinutes(day.startTime);

    const breakMinutes =
        day.breakStartTime && day.breakEndTime
            ? toMinutes(day.breakEndTime) - toMinutes(day.breakStartTime)
            : 0;

    return total - breakMinutes;
}

function prepareDays(days) {
    return days.map((day) => ({
        weekday: day.weekday,
        startTime: day.startTime,
        breakStartTime: day.breakStartTime || null,
        breakEndTime: day.breakEndTime || null,
        endTime: day.endTime,
        expectedMinutes: calculateExpectedMinutes(day),
    }));
}

export async function createSchedule(data, companyId, adminId) {
    return prisma.$transaction(async (tx) => {
        const schedule = await tx.workSchedule.create({
            data: {
                companyId,
                name: data.name,
                description: data.description || null,
                days: {
                    create: prepareDays(data.days),
                },
            },
            include: {
                days: {
                    orderBy: { weekday: "asc" },
                },
            },
        });

        await tx.auditLog.create({
            data: {
                companyId,
                userId: adminId,
                action: "SCHEDULE_CREATED",
                entity: "WorkSchedule",
                entityId: String(schedule.id),
                details: { name: schedule.name },
            },
        });

        return schedule;
    });
}

export async function listSchedules(companyId) {
    return prisma.workSchedule.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        include: {
            days: {
                orderBy: { weekday: "asc" },
            },
            _count: {
                select: {
                    assignments: true,
                },
            },
        },
    });
}

export async function getSchedule(scheduleId, companyId) {
    const schedule = await prisma.workSchedule.findFirst({
        where: {
            id: scheduleId,
            companyId,
        },
        include: {
            days: {
                orderBy: { weekday: "asc" },
            },
            assignments: {
                include: {
                    employee: {
                        select: {
                            id: true,
                            fullName: true,
                            employeeCode: true,
                        },
                    },
                },
                orderBy: { startDate: "desc" },
            },
        },
    });

    if (!schedule) {
        const error = new Error("Jornada não encontrada.");
        error.status = 404;
        throw error;
    }

    return schedule;
}


export async function updateSchedule(
    scheduleId,
    companyId,
    adminId,
    data
) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.workSchedule.findFirst({
            where: {
                id: scheduleId,
                companyId,
            },
        });

        if (!existing) {
            const error = new Error("Jornada não encontrada.");
            error.status = 404;
            throw error;
        }

        // Verifica se a jornada já foi atribuída a algum funcionário.
        const hasAssignments = await tx.employeeSchedule.findFirst({
            where: {
                scheduleId,
            },
            select: {
                id: true,
            },
        });

        // Uma jornada utilizada não pode ter seus horários alterados.
        if (data.days !== undefined && hasAssignments) {
            const error = new Error(
                "Esta jornada já foi atribuída a funcionários. " +
                "Para preservar o histórico, crie uma nova jornada com os horários atualizados."
            );

            error.status = 409;
            throw error;
        }

        const updateData = {};

        if (data.name !== undefined) {
            updateData.name = data.name;
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.days !== undefined) {
            await tx.workScheduleDay.deleteMany({
                where: {
                    scheduleId,
                },
            });

            updateData.days = {
                create: prepareDays(data.days),
            };
        }

        const schedule = await tx.workSchedule.update({
            where: {
                id: scheduleId,
            },
            data: updateData,
            include: {
                days: {
                    orderBy: {
                        weekday: "asc",
                    },
                },
            },
        });

        await tx.auditLog.create({
            data: {
                companyId,
                userId: adminId,
                action: "SCHEDULE_UPDATED",
                entity: "WorkSchedule",
                entityId: String(scheduleId),
                details: {
                    changedFields: Object.keys(data),
                },
            },
        });

        return schedule;
    });
}

export async function changeScheduleStatus(
    scheduleId,
    companyId,
    adminId,
    isActive
) {
    return prisma.$transaction(async (tx) => {
        const schedule = await tx.workSchedule.findFirst({
            where: {
                id: scheduleId,
                companyId,
            },
        });

        if (!schedule) {
            const error = new Error("Jornada não encontrada.");
            error.status = 404;
            throw error;
        }

        const updated = await tx.workSchedule.update({
            where: { id: scheduleId },
            data: { isActive },
        });

        await tx.auditLog.create({
            data: {
                companyId,
                userId: adminId,
                action: isActive
                    ? "SCHEDULE_ACTIVATED"
                    : "SCHEDULE_DEACTIVATED",
                entity: "WorkSchedule",
                entityId: String(scheduleId),
            },
        });

        return updated;
    });
}


export async function assignSchedule(
    scheduleId,
    companyId,
    adminId,
    employeeId,
    startDate
) {
    const effectiveDate = new Date(`${startDate}T00:00:00.000Z`);

    return prisma.$transaction(async (tx) => {
        const schedule = await tx.workSchedule.findFirst({
            where: {
                id: scheduleId,
                companyId,
                isActive: true,
            },
        });

        if (!schedule) {
            const error = new Error("Jornada não encontrada ou inativa.");
            error.status = 404;
            throw error;
        }

        const employee = await tx.employee.findFirst({
            where: {
                id: employeeId,
                companyId,
                status: "ACTIVE",
            },
        });

        if (!employee) {
            const error = new Error("Funcionário não encontrado ou inativo.");
            error.status = 404;
            throw error;
        }

        const currentAssignment = await tx.employeeSchedule.findFirst({
            where: {
                employeeId,
                OR: [
                    { endDate: null },
                    { endDate: { gte: effectiveDate } },
                    { startDate: { gte: effectiveDate } },
                ],
            },
            orderBy: {
                startDate: "desc",
            },
        });

        if (
            currentAssignment &&
            effectiveDate <= currentAssignment.startDate
        ) {
            const error = new Error(
                "A nova jornada deve começar depois da data inicial da jornada atual."
            );
            error.status = 409;
            throw error;
        }

        // Encerra o vínculo anterior no dia anterior à nova jornada.
        if (currentAssignment) {
            const previousEndDate = new Date(effectiveDate);
            previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);

            await tx.employeeSchedule.update({
                where: {
                    id: currentAssignment.id,
                },
                data: {
                    endDate: previousEndDate,
                },
            });
        }

        const assignment = await tx.employeeSchedule.create({
            data: {
                employeeId,
                scheduleId,
                startDate: effectiveDate,
            },
            include: {
                schedule: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        await tx.auditLog.create({
            data: {
                companyId,
                userId: adminId,
                action: "SCHEDULE_ASSIGNED",
                entity: "EmployeeSchedule",
                entityId: String(assignment.id),
                details: {
                    employeeId,
                    scheduleId,
                    startDate,
                },
            },
        });

        return assignment;
    });
}
