import { get, post } from './api'
export const getToday = (token) => get('/time-records/today', token)
export const createTimeRecord = (type, token) => post('/time-records', { type }, token)
