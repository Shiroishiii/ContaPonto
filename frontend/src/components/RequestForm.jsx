import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { createCorrection } from '../services/correctionService'
import { getWorkday } from '../services/reportService'
import { Field, Icon } from './ui'
const TYPES = ['Entrada', 'Início do intervalo', 'Retorno', 'Saída']
const BACK = { Entrada: 'ENTRY', 'Início do intervalo': 'BREAK_START', Retorno: 'BREAK_END', Saída: 'EXIT' }
const dateSP = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/Sao_Paulo' }).format(new Date())
const toLocalISO = (date, time, timezone) => {
  const target = new Date(`${date}T${time}:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(target)
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  const localAsUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return new Date(target.getTime() - (localAsUTC - target.getTime())).toISOString()
}
export default function RequestForm({ date = '', tipo = 'Entrada' }) {
  const { me, user, token, requests, refreshData, closeModal, toast } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const [f, setF] = useState({ date: date || dateSP(timezone), tipo, time: '', j: '' })
  const [err, setErr] = useState({})
  const [records, setRecords] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!me?.id || !f.date) return
    let active = true
    getWorkday(me.id, f.date, token).then((data) => { if (active) setRecords(data.records || []) }).catch(() => { if (active) setRecords([]) })
    return () => { active = false }
  }, [me?.id, f.date, token])
  const set = (key) => (event) => setF((old) => ({ ...old, [key]: event.target.value }))
  const save = async () => {
    const errors = {}
    if (!f.date) errors.date = 'Informe a data do registro.'
    else if (f.date > dateSP(timezone)) errors.date = 'A data não pode ser futura.'
    if (!f.time) errors.time = 'Informe o horário solicitado.'
    if (f.j.trim().length < 10) errors.j = 'Descreva o motivo com ao menos 10 caracteres.'
    const kind = BACK[f.tipo]
    const original = records.find((r) => r.type === kind)
    if (requests.some((r) => r.status === 'PENDING' && r.requestedType === kind && r.requestedAt?.slice(0, 10) === f.date)) errors.date = 'Já existe uma solicitação pendente para este registro.'
    setErr(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      const requestedAt = toLocalISO(f.date, f.time, timezone)
      await createCorrection({ action: original ? 'ADJUST_TIME' : 'ADD_RECORD', recordId: original?.id || null, requestedType: kind, requestedAt, reason: f.j.trim() }, token)
      await refreshData(); closeModal(); toast('Solicitação enviada para análise')
    } catch (error) { setErr({ form: error.message }) } finally { setBusy(false) }
  }
  const E = ({ k }) => err[k] ? <div className="fe">{err[k]}</div> : null
  return <>
    <h2>Nova solicitação de correção</h2><div className="sm" style={{ margin: '4px 0 16px' }}>O administrador analisará o ajuste e você será avisado da decisão.</div>
    <div className="fg">
      <Field label="Data do registro"><input className="fi" type="date" max={dateSP(timezone)} value={f.date} onChange={set('date')} /><E k="date" /></Field>
      <Field label="Tipo de registro"><select className="fi" value={f.tipo} onChange={set('tipo')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Horário solicitado" w><input className="fi" type="time" value={f.time} onChange={set('time')} /><E k="time" /></Field>
      <Field label="Justificativa" w><textarea className="fi" placeholder="Explique o motivo da correção" value={f.j} onChange={set('j')} /><E k="j" /></Field>
    </div>
    <div className="er">{err.form}</div>
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="bt o" onClick={closeModal}>Cancelar</button><button className="bt" disabled={busy} onClick={save}><Icon n="check" /> {busy ? 'Enviando…' : 'Enviar solicitação'}</button></div>
  </>
}
