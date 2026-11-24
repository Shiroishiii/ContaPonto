
import {
    createEmployee,
    listEmployees,
    getEmployee,
    updateEmployee,
    changeEmployeeStatus,
} from "../services/employeeService.js";

import {
    createEmployeeSchema,
    updateEmployeeSchema,
    employeeStatusSchema,
} from "../validators/employeeValidator.js";

export async function store(req, res, next) {
    try {
        const data = createEmployeeSchema.parse(req.body);

        const employee = await createEmployee(
            data,
            req.user.companyId,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            message: "Funcionário cadastrado com sucesso.",
            data: employee,
        });
    } catch (error) {
        next(error);
    }
}

export async function index(req, res, next) {
    try {
        const employees = await listEmployees(req.user.companyId);

        return res.status(200).json({
            success: true,
            data: employees,
        });
    } catch (error) {
        next(error);
    }
}

export async function show(req, res, next) {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de funcionário inválido.",
            });
        }

        const employee = await getEmployee(
            employeeId,
            req.user.companyId
        );

        return res.status(200).json({
            success: true,
            data: employee,
        });
    } catch (error) {
        next(error);
    }
}

export async function update(req, res, next) {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de funcionário inválido.",
            });
        }

        const data = updateEmployeeSchema.parse(req.body);

        const employee = await updateEmployee(
            employeeId,
            req.user.companyId,
            req.user.id,
            data
        );

        return res.status(200).json({
            success: true,
            message: "Funcionário atualizado com sucesso.",
            data: employee,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateStatus(req, res, next) {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de funcionário inválido.",
            });
        }

        const { status } = employeeStatusSchema.parse(req.body);

        const employee = await changeEmployeeStatus(
            employeeId,
            req.user.companyId,
            req.user.id,
            status
        );

        return res.status(200).json({
            success: true,
            message: status === "ACTIVE"
                ? "Funcionário reativado com sucesso."
                : "Funcionário inativado com sucesso.",
            data: employee,
        });
    } catch (error) {
        next(error);
    }
}
