import { get, post } from './api'
export const listCorrections = (token) => get('/corrections', token)
export const createCorrection = (body, token) => post('/corrections', body, token)
export const reviewCorrection = (id, body, token) => post(`/corrections/${id}/review`, body, token)
