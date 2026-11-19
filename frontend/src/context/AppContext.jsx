import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { E0, R0, REQ0, AT0, JR0 } from '../data/mock'
import { nowLabel } from '../utils'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [photo, setPhotoState] = useState(() => { try { return localStorage.getItem('cp_photo') } catch { return null } })
  const setPhoto = (p) => { setPhotoState(p); try { p ? localStorage.setItem('cp_photo', p) : localStorage.removeItem('cp_photo') } catch { /* sem armazenamento */ } }
  const [user, setUser] = useState(null)
  const [employees, setEmployees] = useState(E0)
  const [records, setRecords] = useState(R0)
  const [requests, setRequests] = useState(REQ0)
  const [activities, setActivities] = useState(AT0)
  const [journeys, setJourneys] = useState(JR0)
  const [unread, setUnread] = useState(true)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toast = useCallback((text) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])
  const log = (u, a, i, icn, ty) => setActivities((x) => [[u, a, i, icn, nowLabel(), ty], ...x])
  const openModal = (node) => setModal(node)
  const closeModal = () => setModal(null)

  const value = {
    theme, setTheme, photo, setPhoto, user, setUser, employees, setEmployees, records, setRecords, requests, setRequests,
    activities, journeys, setJourneys, unread, setUnread, toast, log, openModal, closeModal,
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
