import { get, post } from './api'
export const login = (data) => post('/auth/login', data)
export const register = (data) => post('/auth/register', data)
export const me = (token) => get('/auth/me', token)
