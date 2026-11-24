import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginApi, me as meApi, register as registerApi } from '../services/authService'
import { setUnauthorizedHandler } from '../services/api'
import { listEmployees } from '../services/employeeService'
import { listSchedules } from '../services/scheduleService'
import { getToday } from '../services/timeRecordService'
import { listCorrections } from '../services/correctionService'
import { listActivities } from '../services/activityService'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const TOKEN_KEY = 'contaponto_token'
const roleUI = (role) => role === 'ADMIN' ? 'admin' : 'func'
const statusUI = (status) => status === 'ACTIVE' ? 'Ativo' : status === 'ON_LEAVE' ? 'Afastado' : 'Inativo'
const mapEmployee = (e) => ({ ...e, n: e.fullName, e: e.user?.email || '', c: e.position || '', cpf: e.cpf || '', tel: e.phone || '', s: statusUI(e.status), d: e.createdAt ? new Date(e.createdAt).toLocaleDateString('pt-BR') : '', mat: e.employeeCode, j: e.scheduleAssignments?.[0]?.schedule?.name || '', scheduleId: e.scheduleAssignments?.[0]?.scheduleId || e.scheduleAssignments?.[0]?.schedule?.id || null })
const TYPE_LABEL = { ENTRY: 'Entrada', BREAK_START: 'Início do intervalo', BREAK_END: 'Retorno', EXIT: 'Saída' }
const localParts = (date, timezone) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(date)).map((x) => [x.type, x.value]))
const mapRecord = (r, timezone) => { const local = localParts(r.recordedAt, timezone); return { id: r.id, employeeId: r.employeeId, n: r.employee?.fullName || '', d: `${local.year}-${local.month}-${local.day}`, type: r.type, label: TYPE_LABEL[r.type], time: `${local.hour}:${local.minute}`, recordedAt: r.recordedAt } }
const mapSchedule = (s) => ({ ...s, n: s.name, a: s.isActive ? 1 : 0, days: s.days || [], f: (s.assignments || []).map((a) => a.employee?.fullName).filter(Boolean).join(', ') })
const mapCorrection = (r) => ({ ...r, n: r.employee?.fullName || '', tp: TYPE_LABEL[r.requestedType] || r.action, dr: r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '', s: r.requestedAt ? new Date(r.requestedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '', o: r.record?.recordedAt ? new Date(r.record.recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—', j: r.reason, sol: new Date(r.createdAt).toLocaleDateString('pt-BR'), env: new Date(r.createdAt).toLocaleDateString('pt-BR'), st: r.status === 'PENDING' ? 'Pendente' : r.status === 'APPROVED' ? 'Aprovada' : 'Rejeitada', ob: r.reviewerNote || '' })

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [user, setUserState] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [requests, setRequests] = useState([])
  const [activities, setActivities] = useState([])
  const [journeys, setJourneys] = useState([])
  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [photo, setPhotoState] = useState(null)
  const [unread, setUnread] = useState(false)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); setToken(null); setUserState(null)
    setEmployees([]); setRecords([]); setRequests([]); setActivities([]); setJourneys([]); setToday(null)
  }, [])
  const setUser = useCallback((value) => {
    if (!value) { clearSession(); return }
    setUserState(value)
  }, [clearSession])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { setUnauthorizedHandler(clearSession); return () => setUnauthorizedHandler(() => {}) }, [clearSession])

  const establish = useCallback(async (accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
    const { user: backendUser } = await meApi(accessToken)
    setUserState({ ...backendUser, role: roleUI(backendUser.role), backendRole: backendUser.role })
    return backendUser
  }, [])
  const signIn = useCallback(async (credentials) => {
    const result = await loginApi(credentials)
    await establish(result.token)
    return result.user
  }, [establish])
  const signUp = useCallback(async (input) => {
    await registerApi(input)
    return signIn({ email: input.email, password: input.password })
  }, [signIn])

  useEffect(() => {
    let active = true
    const restore = async () => {
      if (!token) { setLoading(false); return }
      setLoading(true)
      try { const { user: backendUser } = await meApi(token); if (active) setUserState({ ...backendUser, role: roleUI(backendUser.role), backendRole: backendUser.role }) }
      catch { if (active) clearSession() }
      finally { if (active) setLoading(false) }
    }
    restore()
    return () => { active = false }
  }, [token, clearSession])

  const refreshData = useCallback(async () => {
    if (!token || !user) return
    setDataError(''); setDataLoading(true)
    try {
      const jobs = [getToday(token)]
      if (user.role === 'admin') jobs.push(listEmployees(token), listSchedules(token), listCorrections(token), listActivities({}, token))
      else jobs.push(listCorrections(token))
      const values = await Promise.all(jobs)
      const todayData = values[0]
      setToday(todayData)
      setRecords((todayData.records || []).map((record) => mapRecord(record, user.company?.timezone)))
      if (user.role === 'admin') {
        setEmployees(values[1].map(mapEmployee)); setJourneys(values[2].map(mapSchedule)); setRequests(values[3].map(mapCorrection))
        setActivities((values[4].items || []).map((a) => ({ ...a, actorName: a.user?.name || 'Sistema', category: a.entity === 'CorrectionRequest' ? 'Solicitações' : a.entity === 'Employee' ? 'Funcionários' : a.entity === 'WorkSchedule' || a.entity === 'EmployeeSchedule' ? 'Jornadas' : 'Sistema' })))
      } else {
        setRequests(values[1].map(mapCorrection))
      }
    } catch (error) { setDataError(error.message) } finally { setDataLoading(false) }
  }, [token, user])
  useEffect(() => { if (!loading && user) refreshData() }, [loading, user, refreshData])

  const setPhoto = (p) => { setPhotoState(p); try { p ? localStorage.setItem(`cp_photo_${user?.id}`, p) : localStorage.removeItem(`cp_photo_${user?.id}`) } catch { /* storage unavailable */ } }
  useEffect(() => { try { setPhotoState(user ? localStorage.getItem(`cp_photo_${user.id}`) : null) } catch { setPhotoState(null) } }, [user?.id])
  const toast = useCallback((text) => { const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, text }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600) }, [])
  const openModal = (node) => setModal(node)
  const closeModal = () => setModal(null)
  const me = useMemo(() => {
    if (user?.role !== 'func') return null
    const found = employees.find((e) => e.userId === user.id)
    if (found) return { ...found, id: found.id, empId: found.id, name: found.n, full: found.n, c: found.c, e: found.e, j: found.j }
    const own = user.employee
    const assignment = own?.scheduleAssignments?.[0]
    return own ? { ...own, id: own.id, empId: own.id, n: own.fullName, full: own.fullName, e: user.email, c: own.position || '', cpf: own.cpf || '', tel: own.phone || '', mat: own.employeeCode, j: assignment?.schedule?.name || '', scheduleId: assignment?.scheduleId, schedule: assignment?.schedule } : { id: user.employeeId, empId: user.employeeId, n: user.name, full: user.name, e: user.email, c: '', j: '' }
  }, [user, employees])
  const punch = useMemo(() => {
    const steps = [null, null, null, null]
    for (const record of records) { const index = ['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'].indexOf(record.type); if (index >= 0) steps[index] = record.time }
    return steps
  }, [records])
  const adminRequests = requests
  const value = { theme, setTheme, photo, setPhoto, user, setUser, token, signIn, signUp, logout: clearSession, loading, dataLoading, dataError, refreshData, me, employees, setEmployees, records, setRecords, requests, setRequests, adminRequests, activities, setActivities, journeys, setJourneys, today, punch, unread, setUnread, toast, log: () => {}, openModal, closeModal }
  return <Ctx.Provider value={value}>{children}{modal && <div className="mo on" onClick={(e) => e.target === e.currentTarget && closeModal()}><div className="md">{modal}</div></div>}<div id="ts">{toasts.map((t) => <div key={t.id}>{t.text}</div>)}</div></Ctx.Provider>
}
