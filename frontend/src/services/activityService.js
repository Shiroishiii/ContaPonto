import { get } from './api'
export const listActivities = (params, token) => get(`/activities?${new URLSearchParams(params)}`, token)
