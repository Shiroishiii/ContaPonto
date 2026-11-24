import { get, patch, post, put } from './api'
export const listEmployees = (token) => get('/employees', token)
export const getEmployee = (id, token) => get(`/employees/${id}`, token)
export const createEmployee = (body, token) => post('/employees', body, token)
export const updateEmployee = (id, body, token) => put(`/employees/${id}`, body, token)
export const updateEmployeeStatus = (id, status, token) => patch(`/employees/${id}/status`, { status }, token)
