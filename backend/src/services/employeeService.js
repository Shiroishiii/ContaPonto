import bcrypt from "bcrypt";
import prisma from "../config/database.js";

export async function createEmployee(data, companyId, adminId) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
        return await prisma.$transaction(async (tx) => {
            // Confere se a jornada pertence à empresa do administrador
            if (data.scheduleId) {
                const schedule = await tx.workSchedule.findFirst({
                    where: {
                        id: data.scheduleId,
                        companyId,
                        isActive: true,
                    },
                });

                if (!schedule) {
                    const error = new Error("Jornada não encontrada ou inativa.");
                    error.status = 404;
                    throw error;
                }
            }

            // Cria a conta de acesso do empregado
            const user = await tx.user.create({
                data: {
                    companyId,
                    name: data.fullName,
                    email: data.email,
                    passwordHash,
                    role: "EMPLOYEE",
                    isActive: true,
                },
            });

            // Cria o cadastro profissional
            const employee = await tx.employee.create({
                data: {
                    companyId,
                    userId: user.id,
                    employeeCode: data.employeeCode,
                    fullName: data.fullName,
                    cpf: data.cpf ?? null,
                    phone: data.phone || null,
                    position: data.position || null,
                    admissionDate: data.admissionDate
                        ? new Date(`${data.admissionDate}T00:00:00.000Z`)
                        : null,
                },
            });

            await tx.auditLog.create({
                data: {
                    companyId,
                    userId: adminId,
                    action: "EMPLOYEE_CREATED",
                    entity: "Employee",
                    entityId: String(employee.id),
                    details: { employeeCode: employee.employeeCode },
                },
            });

            // Vincula a jornada, caso tenha sido selecionada
            if (data.scheduleId) {
                await tx.employeeSchedule.create({
                    data: {
                        employeeId: employee.id,
                        scheduleId: data.scheduleId,
                        startDate: new Date(
                            `${data.scheduleStartDate}T00:00:00.000Z`
                        ),
                    },
                });
            }

            return {
                id: employee.id,
                fullName: employee.fullName,
                employeeCode: employee.employeeCode,
                email: user.email,
                role: user.role,
                status: employee.status,
                scheduleId: data.scheduleId ?? null,
            };
        });
    } catch (error) {
        if (error.code === "P2002") {
            const conflict = new Error(
                "E-mail, CPF ou matrícula já cadastrado."
            );
            conflict.status = 409;
            throw conflict;
        }

        throw error;
    }
}

export async function listEmployees(companyId) {
    return prisma.employee.findMany({
        where: {
            companyId,
        },
        orderBy: {
            fullName: "asc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    role: true,
                },
            },
            scheduleAssignments: {
                where: {
                    endDate: null,
                },
                include: {
                    schedule: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
}


export async function getEmployee(employeeId, companyId) {
    const employee = await prisma.employee.findFirst({
        where: {
            id: employeeId,
            companyId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                },
            },
            scheduleAssignments: {
                include: {
                    schedule: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    startDate: "desc",
                },
            },
        },
    });

    if (!employee) {
        const error = new Error("Funcionário não encontrado.");
        error.status = 404;
        throw error;
    }

    return employee;
}

export async function updateEmployee(
    employeeId,
    companyId,
    adminId,
    data
) {
    try {
        return await prisma.$transaction(async (tx) => {
            const employee = await tx.employee.findFirst({
                where: {
                    id: employeeId,
                    companyId,
                },
                include: {
                    user: true,
                },
            });

            if (!employee) {
                const error = new Error("Funcionário não encontrado.");
                error.status = 404;
                throw error;
            }

            const employeeData = {};

            if (data.fullName !== undefined) {
                employeeData.fullName = data.fullName;
            }

            if (data.employeeCode !== undefined) {
                employeeData.employeeCode = data.employeeCode;
            }

            if (data.cpf !== undefined) {
                employeeData.cpf = data.cpf;
            }

            if (data.phone !== undefined) {
                employeeData.phone = data.phone;
            }

            if (data.position !== undefined) {
                employeeData.position = data.position;
            }

            if (data.admissionDate !== undefined) {
                employeeData.admissionDate = data.admissionDate
                    ? new Date(`${data.admissionDate}T00:00:00.000Z`)
                    : null;
            }

            const updatedEmployee = await tx.employee.update({
                where: {
                    id: employeeId,
                },
                data: employeeData,
            });

            // Sincroniza nome e e-mail da conta de acesso
            if (employee.userId && employee.user) {
                const userData = {};

                if (data.fullName !== undefined) {
                    userData.name = data.fullName;
                }

                if (data.email !== undefined) {
                    userData.email = data.email;
                }

                if (Object.keys(userData).length > 0) {
                    await tx.user.update({
                        where: {
                            id: employee.userId,
                        },
                        data: userData,
                    });
                }
            } else if (data.email !== undefined) {
                const error = new Error(
                    "Funcionário não possui uma conta de acesso vinculada."
                );
                error.status = 400;
                throw error;
            }

            await tx.auditLog.create({
                data: {
                    companyId,
                    userId: adminId,
                    action: "EMPLOYEE_UPDATED",
                    entity: "Employee",
                    entityId: String(employeeId),
                    details: {
                        changedFields: Object.keys(data),
                    },
                },
            });

            return updatedEmployee;
        });
    } catch (error) {
        if (error.code === "P2002") {
            const conflict = new Error(
                "E-mail, CPF ou matrícula já está sendo utilizado."
            );
            conflict.status = 409;
            throw conflict;
        }

        throw error;
    }
}

export async function changeEmployeeStatus(
    employeeId,
    companyId,
    adminId,
    status
) {
    return prisma.$transaction(async (tx) => {
        const employee = await tx.employee.findFirst({
            where: {
                id: employeeId,
                companyId,
            },
        });

        if (!employee) {
            const error = new Error("Funcionário não encontrado.");
            error.status = 404;
            throw error;
        }

        const isActive = status === "ACTIVE";

        const updated = await tx.employee.update({
            where: {
                id: employeeId,
            },
            data: {
                status,
            },
        });

        if (employee.userId) {
            await tx.user.update({
                where: {
                    id: employee.userId,
                },
                data: {
                    isActive,
                },
            });
        }

        await tx.auditLog.create({
            data: {
                companyId,
                userId: adminId,
                action: isActive
                    ? "EMPLOYEE_REACTIVATED"
                    : "EMPLOYEE_DEACTIVATED",
                entity: "Employee",
                entityId: String(employeeId),
                details: {
                    previousStatus: employee.status,
                    newStatus: status,
                },
            },
        });

        return updated;
    });
}
