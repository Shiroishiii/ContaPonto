import { get } from './api'
export const getReport = (params, token) => get(`/reports?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null)))}`, token)
export const getWorkday = (employeeId, date, token) => get(`/workday/${employeeId}/${date}`, token)
