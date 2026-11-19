
import prisma from "../config/database.js";

const RECORD_SEQUENCE = [
    "ENTRY",
    "BREAK_START",
    "BREAK_END",
    "EXIT",
];

function createError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function formatMinutes(totalMinutes) {
    if (totalMinutes === null || totalMinutes === undefined) {
        return null;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

function getWeekday(date) {
    return date.getUTCDay();
}

function validateDate(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createError("Data inválida. Utilize YYYY-MM-DD.");
    }

    const parsed = new Date(`${date}T12:00:00.000Z`);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
    ) {
        throw createError("A data informada não existe.");
    }

    return parsed;
}

function getDateParts(date, timezone) {
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

    return Object.fromEntries(
        parts.map((part) => [part.type, part.value])
    );
}

function getLocalDate(date, timezone) {
    const parts = getDateParts(date, timezone);

    return `${parts.year}-${parts.month}-${parts.day}`;
}

function getLocalMinutes(date, timezone) {
    const parts = getDateParts(date, timezone);

    return Number(parts.hour) * 60 + Number(parts.minute);
}

function getTimezoneOffset(date, timezone) {
    const parts = getDateParts(date, timezone);

    const localAsUTC = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
    );

    return (localAsUTC - date.getTime()) / 60000;
}

function localMidnightToUTC(dateString, timezone) {
    const [year, month, day] = dateString.split("-").map(Number);

    const targetUTC = Date.UTC(year, month - 1, day);

    let result = new Date(targetUTC);

    // Ajusta o horário UTC até corresponder à meia-noite local.
    for (let attempt = 0; attempt < 4; attempt++) {
        const offset = getTimezoneOffset(result, timezone);

        const adjusted = new Date(targetUTC - offset * 60000);

        if (adjusted.getTime() === result.getTime()) {
            break;
        }

        result = adjusted;
    }

    return result;
}

function getDayRange(dateString, timezone) {
    const [year, month, day] = dateString.split("-").map(Number);

    const nextDay = new Date(
        Date.UTC(year, month - 1, day + 1)
    );

    const nextDate = nextDay.toISOString().slice(0, 10);

    return {
        start: localMidnightToUTC(dateString, timezone),
        end: localMidnightToUTC(nextDate, timezone),
    };
}

function validateTimeline(records) {
    if (records.length > RECORD_SEQUENCE.length) {
        throw createError("Quantidade de registros de ponto inválida.");
    }

    for (let index = 0; index < records.length; index++) {
        const record = records[index];

        if (record.type !== RECORD_SEQUENCE[index]) {
            throw createError(
                `Sequência inválida. O registro esperado é ${RECORD_SEQUENCE[index]}.`
            );
        }

        if (
            index > 0 &&
            record.recordedAt.getTime() <=
                records[index - 1].recordedAt.getTime()
        ) {
            throw createError(
                "Existem registros com horários inconsistentes."
            );
        }
    }

    return records;
}

function calculateDuration(start, end) {
    const duration = Math.floor(
        (end.getTime() - start.getTime()) / 60000
    );

    return Math.max(duration, 0);
}

function calculateWorkedMinutes(records, isToday, now) {
    let workedMinutes = 0;
    let breakMinutes = 0;

    if (records.length >= 2) {
        workedMinutes += calculateDuration(
            records[0].recordedAt,
            records[1].recordedAt
        );
    }

    if (records.length === 4) {
        workedMinutes += calculateDuration(
            records[2].recordedAt,
            records[3].recordedAt
        );

        breakMinutes = calculateDuration(
            records[1].recordedAt,
            records[2].recordedAt
        );
    }

    // Funcionário ainda trabalhando.
    if (records.length === 1 && isToday) {
        workedMinutes += calculateDuration(
            records[0].recordedAt,
            now
        );
    }

    // Funcionário atualmente em intervalo.
    if (records.length === 2 && isToday) {
        breakMinutes += calculateDuration(
            records[1].recordedAt,
            now
        );
    }

    // Funcionário retornou do intervalo e continua trabalhando.
    if (records.length === 3 && isToday) {
        workedMinutes += calculateDuration(
            records[2].recordedAt,
            now
        );
    }

    return {
        workedMinutes,
        breakMinutes,
    };
}

function calculateLateMinutes(records, scheduleDay, timezone) {
    const entry = records.find(
        (record) => record.type === "ENTRY"
    );

    if (!entry || !scheduleDay) {
        return null;
    }

    const expectedEntry = timeToMinutes(scheduleDay.startTime);
    const actualEntry = getLocalMinutes(entry.recordedAt, timezone);

    return Math.max(actualEntry - expectedEntry, 0);
}

function calculateEarlyDepartureMinutes(records, scheduleDay, timezone) {
    const exit = records.find(
        (record) => record.type === "EXIT"
    );

    if (!exit || !scheduleDay) {
        return null;
    }

    const expectedExit = timeToMinutes(scheduleDay.endTime);
    const actualExit = getLocalMinutes(exit.recordedAt, timezone);

    return Math.max(expectedExit - actualExit, 0);
}

function calculateVariations(workedMinutes, expectedMinutes, completed) {
    if (!completed || expectedMinutes === null) {
        return {
            balanceMinutes: null,
            overtimeMinutes: null,
            deficitMinutes: null,
        };
    }

    const balance = workedMinutes - expectedMinutes;

    return {
        balanceMinutes: balance,
        overtimeMinutes: Math.max(balance, 0),
        deficitMinutes: Math.max(-balance, 0),
    };
}

export async function calculateEmployeeWorkday(
    employeeId,
    companyId,
    date
) {
    const targetDate = validateDate(date);

    const employee = await prisma.employee.findFirst({
        where: {
            id: employeeId,
            companyId,
        },
        include: {
            company: true,
        },
    });

    if (!employee) {
        throw createError("Funcionário não encontrado.", 404);
    }

    const timezone = employee.company.timezone || "America/Sao_Paulo";

    try {
        new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
        });
    } catch {
        throw createError("Fuso horário da empresa inválido.");
    }

    const weekday = getWeekday(targetDate);

    const assignment = await prisma.employeeSchedule.findFirst({
        where: {
            employeeId,
            startDate: {
                lte: targetDate,
            },
            OR: [
                { endDate: null },
                {
                    endDate: {
                        gte: targetDate,
                    },
                },
            ],
        },
        include: {
            schedule: {
                include: {
                    days: true,
                },
            },
        },
        orderBy: {
            startDate: "desc",
        },
    });

    const scheduleDay = assignment
        ? assignment.schedule.days.find(
            (day) => day.weekday === weekday
        ) || null
        : null;

    const { start, end } = getDayRange(date, timezone);

    const records = await prisma.timeRecord.findMany({
        where: {
            employeeId,
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

    const timeline = validateTimeline(records);

    const now = new Date();

    const isToday = getLocalDate(now, timezone) === date;

    const {
        workedMinutes,
        breakMinutes,
    } = calculateWorkedMinutes(timeline, isToday, now);

    const expectedMinutes = scheduleDay
        ? scheduleDay.expectedMinutes
        : null;

    const completed =
        timeline.length === RECORD_SEQUENCE.length;

    const variations = calculateVariations(
        workedMinutes,
        expectedMinutes,
        completed
    );

    const lateMinutes = calculateLateMinutes(
        timeline,
        scheduleDay,
        timezone
    );

    const earlyDepartureMinutes = calculateEarlyDepartureMinutes(
        timeline,
        scheduleDay,
        timezone
    );

    const nextType = RECORD_SEQUENCE[timeline.length] || null;

    let status;

    if (!scheduleDay) {
        status = timeline.length === 0
            ? "DAY_OFF"
            : "NO_SCHEDULE";
    } else if (completed) {
        status = "COMPLETED";
    } else if (timeline.length === 0) {
        status = "NOT_STARTED";
    } else {
        status = "IN_PROGRESS";
    }

    return {
        employee: {
            id: employee.id,
            name: employee.fullName,
            employeeCode: employee.employeeCode,
        },

        date,
        timezone,

        schedule: scheduleDay
            ? {
                name: assignment.schedule.name,
                startTime: scheduleDay.startTime,
                breakStartTime: scheduleDay.breakStartTime,
                breakEndTime: scheduleDay.breakEndTime,
                endTime: scheduleDay.endTime,
                expectedMinutes,
                expectedHours: formatMinutes(expectedMinutes),
            }
            : null,

        records: timeline.map((record) => ({
            id: record.id,
            type: record.type,
            recordedAt: record.recordedAt,
        })),

        summary: {
            workedMinutes,
            workedHours: formatMinutes(workedMinutes),

            breakMinutes,
            breakHours: formatMinutes(breakMinutes),

            expectedMinutes,
            expectedHours: formatMinutes(expectedMinutes),

            lateMinutes,
            lateHours: formatMinutes(lateMinutes),

            earlyDepartureMinutes,
            earlyDepartureHours: formatMinutes(earlyDepartureMinutes),

            overtimeMinutes: variations.overtimeMinutes,
            overtimeHours: formatMinutes(variations.overtimeMinutes),

            deficitMinutes: variations.deficitMinutes,
            deficitHours: formatMinutes(variations.deficitMinutes),

            balanceMinutes: variations.balanceMinutes,
        },

        status,
        nextType,
        completed,
    };
}
