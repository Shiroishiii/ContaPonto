import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../src/validators/authValidator.js";
import { createEmployeeSchema, employeeStatusSchema, updateEmployeeSchema } from "../src/validators/employeeValidator.js";
import { createScheduleSchema, assignScheduleSchema } from "../src/validators/scheduleValidator.js";
import { getRecordSequence } from "../src/utils/workdayRules.js";

test("auth normalizes email and formatted CNPJ", () => {
    const result = registerSchema.parse({
        companyName: "Empresa Teste", cnpj: "11.222.333/0001-81",
        adminName: "Admin Teste", email: " ADMIN@EXAMPLE.COM ", password: "senha-segura",
    });
    assert.equal(result.email, "admin@example.com");
    assert.equal(result.cnpj, "11222333000181");
    assert.equal(loginSchema.safeParse({ email: "x", password: "" }).success, false);
});

test("employee validates CPF digits, phone and required fields", () => {
    const base = { fullName: "Pessoa Teste", employeeCode: "A1", email: "pessoa@example.com", password: "senha-segura" };
    assert.equal(createEmployeeSchema.safeParse({ ...base, cpf: "529.982.247-25", phone: "+55 (11) 98765-4321" }).success, true);
    assert.equal(createEmployeeSchema.safeParse({ ...base, cpf: "111.111.111-11" }).success, false);
    assert.equal(createEmployeeSchema.safeParse({ ...base, cpf: "529.982.247-24" }).success, false);
    assert.equal(createEmployeeSchema.safeParse({ ...base, phone: "telefone" }).success, false);
    assert.equal(createEmployeeSchema.safeParse({ ...base, fullName: "" }).success, false);
    assert.equal(employeeStatusSchema.safeParse({ status: "ON_LEAVE" }).success, true);
    assert.deepEqual(updateEmployeeSchema.parse({ fullName: "Nome Atualizado" }), { fullName: "Nome Atualizado" });
    assert.equal(updateEmployeeSchema.parse({ cpf: null }).cpf, null);
});

test("schedule validates ordering, weekdays and duplicate weekdays", () => {
    const validDay = { weekday: 1, startTime: "08:00", breakStartTime: "12:00", breakEndTime: "13:00", endTime: "17:00" };
    assert.equal(createScheduleSchema.safeParse({ name: "Comercial", days: [validDay] }).success, true);
    assert.equal(createScheduleSchema.safeParse({ name: "Comercial", days: [{ ...validDay, weekday: 7 }] }).success, false);
    assert.equal(createScheduleSchema.safeParse({ name: "Comercial", days: [validDay, validDay] }).success, false);
    assert.equal(createScheduleSchema.safeParse({ name: "Comercial", days: [{ ...validDay, breakEndTime: "11:00" }] }).success, false);
    assert.equal(assignScheduleSchema.safeParse({ employeeId: 1, startDate: "2026-02-30" }).success, false);
});

test("schedule without a break requires only entry and exit", () => {
    assert.deepEqual(getRecordSequence({ breakStartTime: null, breakEndTime: null }), ["ENTRY", "EXIT"]);
    assert.deepEqual(getRecordSequence({ breakStartTime: "12:00", breakEndTime: "13:00" }), ["ENTRY", "BREAK_START", "BREAK_END", "EXIT"]);
    assert.deepEqual(getRecordSequence(null), ["ENTRY", "BREAK_START", "BREAK_END", "EXIT"]);
});
