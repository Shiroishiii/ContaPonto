import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { E0, R0, REQ0, AT0, JR0 } from '../data/mock'
import { initialPunch } from '../data/punch'
import { nowLabel } from '../utils'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const photoKey = (u) => 'cp_photo_' + (u ? u.role + (u.empId || '') : '')

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState(null) // { role: 'admin' | 'func', name, email, empId? }
  const [photo, setPhotoState] = useState(null)
  const [employees, setEmployees] = useState(E0)
  const [records, setRecords] = useState(R0)
  const [requests, setRequests] = useState(REQ0)
  const [activities, setActivities] = useState(AT0)
  const [journeys, setJourneys] = useState(JR0)
  const [punch, setPunch] = useState([null, null, null, null])
  const [unread, setUnread] = useState(true)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    try { setPhotoState(user ? localStorage.getItem(photoKey(user)) : null) } catch { setPhotoState(null) }
    setPunch(initialPunch(user?.empId))
  }, [user?.role, user?.empId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setPhoto = (p) => {
    setPhotoState(p)
    try { p ? localStorage.setItem(photoKey(user), p) : localStorage.removeItem(photoKey(user)) } catch { /* sem armazenamento */ }
  }
  const toast = useCallback((text) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])
  const log = (u, a, i, icn, ty) => setActivities((x) => [[u, a, i, icn, nowLabel(), ty], ...x])
  const openModal = (node) => setModal(node)
  const closeModal = () => setModal(null)

  const me = useMemo(() => (user?.role === 'func' ? employees.find((e) => e.id === user.empId) : null), [user, employees])
  const adminRequests = useMemo(() => requests.filter((r) => !r.demo), [requests])

  const value = {
    theme, setTheme, photo, setPhoto, user, setUser, me, employees, setEmployees, records, setRecords, requests, setRequests, adminRequests,
    activities, journeys, setJourneys, punch, setPunch, unread, setUnread, toast, log, openModal, closeModal,
  }
  return (
    <Ctx.Provider value={value}>
      {children}
      {modal && (
        <div className="mo on" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="md">{modal}</div>
        </div>
      )}
      <div id="ts">{toasts.map((t) => <div key={t.id}>{t.text}</div>)}</div>
    </Ctx.Provider>
  )
}
