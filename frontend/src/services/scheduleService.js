import { get, patch, post, put } from './api'
export const listSchedules = (token) => get('/schedules', token)
export const getSchedule = (id, token) => get(`/schedules/${id}`, token)
export const createSchedule = (body, token) => post('/schedules', body, token)
export const updateSchedule = (id, body, token) => put(`/schedules/${id}`, body, token)
export const updateScheduleStatus = (id, isActive, token) => patch(`/schedules/${id}/status`, { isActive }, token)
export const assignSchedule = (id, employeeId, startDate, token) => post(`/schedules/${id}/assign`, { employeeId, startDate }, token)
