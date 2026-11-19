
import prisma from "../config/database.js";

const RECORD_SEQUENCE = [
    "ENTRY",
    "BREAK_START",
    "BREAK_END",
    "EXIT",
];

function getLocalDate(date, timezone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}

function getTimezoneOffset(date, timezone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
    );

    const localAsUTC = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
        Number(values.second)
    );

    return (localAsUTC - date.getTime()) / 60000;
}

function getLocalDayRange(date, timezone) {
    const localDate = getLocalDate(date, timezone);
    const [year, month, day] = localDate.split("-").map(Number);

    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDate = nextDay.toISOString().slice(0, 10);

    function localMidnightToUTC(dateString) {
        const [y, m, d] = dateString.split("-").map(Number);
        const approximateUTC = new Date(Date.UTC(y, m - 1, d));
        const offset = getTimezoneOffset(approximateUTC, timezone);

        return new Date(approximateUTC.getTime() - offset * 60000);
    }

    return {
        start: localMidnightToUTC(localDate),
        end: localMidnightToUTC(nextDate),
    };
}

function createError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export async function registerTimeRecord(userId, companyId, type) {
    if (!RECORD_SEQUENCE.includes(type)) {
        throw createError("Tipo de registro inválido.");
    }

    const employee = await prisma.employee.findFirst({
        where: {
            userId,
            companyId,
            status: "ACTIVE",
        },
        include: {
            company: true,
        },
    });

    if (!employee) {
        throw createError("Funcionário ativo não encontrado.", 404);
    }

    const now = new Date();
    const timezone = employee.company.timezone || "America/Sao_Paulo";
    const { start, end } = getLocalDayRange(now, timezone);

    return prisma.$transaction(async (tx) => {
        const records = await tx.timeRecord.findMany({
            where: {
                employeeId: employee.id,
                companyId,
                recordedAt: {
                    gte: start,
                    lt: end,
                },
            },
            orderBy: {
                recordedAt: "asc",
            },
        });

        if (records.length >= RECORD_SEQUENCE.length) {
            throw createError(
                "Todos os registros de hoje já foram realizados."
            );
        }

        const expectedType = RECORD_SEQUENCE[records.length];

        if (type !== expectedType) {
            const descriptions = {
                ENTRY: "entrada",
                BREAK_START: "início do intervalo",
                BREAK_END: "retorno do intervalo",
                EXIT: "saída",
            };

            throw createError(
                `Próximo registro esperado: ${descriptions[expectedType]}.`
            );
        }

        const record = await tx.timeRecord.create({
            data: {
                companyId,
                employeeId: employee.id,
                type,
                recordedAt: now,
                source: "WEB",
            },
        });

        await tx.auditLog.create({
            data: {
                companyId,
                userId,
                action: "TIME_RECORD_CREATED",
                entity: "TimeRecord",
                entityId: record.id,
                details: {
                    type,
                    recordedAt: now.toISOString(),
                },
            },
        });

        return record;
    });
}

export async function getTodayRecords(userId, companyId, role) {
    const now = new Date();

    const company = await prisma.company.findUnique({
        where: {
            id: companyId,
        },
        select: {
            timezone: true,
        },
    });

    if (!company) {
        throw createError("Empresa não encontrada.", 404);
    }

    const timezone = company.timezone || "America/Sao_Paulo";
    const { start, end } = getLocalDayRange(now, timezone);

    // Administrador consulta os registros de toda a empresa.
    if (role === "ADMIN") {
        const records = await prisma.timeRecord.findMany({
            where: {
                companyId,
                recordedAt: {
                    gte: start,
                    lt: end,
                },
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        fullName: true,
                        position: true,
                    },
                },
            },
            orderBy: {
                recordedAt: "asc",
            },
        });

        return {
            records,
            nextType: null,
            completed: null,
        };
    }

    // Funcionário consulta somente os próprios registros.
    const employee = await prisma.employee.findFirst({
        where: {
            userId,
            companyId,
            status: "ACTIVE",
        },
    });

    if (!employee) {
        throw createError("Funcionário ativo não encontrado.", 404);
    }

    const records = await prisma.timeRecord.findMany({
        where: {
            employeeId: employee.id,
            companyId,
            recordedAt: {
                gte: start,
                lt: end,
            },
        },
        orderBy: {
            recordedAt: "asc",
        },
    });

    const nextType = RECORD_SEQUENCE[records.length] || null;

    return {
        records,
        nextType,
        completed: records.length === RECORD_SEQUENCE.length,
    };
}
