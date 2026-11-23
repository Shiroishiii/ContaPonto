import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { journeyOf, recordAt } from '../data/schedule'
import { fmtShort } from '../utils'
import { mm } from '../utils'
import { Field, Icon } from './ui'

const TYPES = ['Entrada', 'Início do intervalo', 'Retorno', 'Saída']
const KEY = { Entrada: 'en', 'Início do intervalo': 'iv', Retorno: 'rt', Saída: 'sa' }

export default function RequestForm({ date = '', tipo = 'Entrada' }) {
  const { me, journeys, requests, setRequests, setUnread, log, closeModal, toast } = useApp()
  const [f, setF] = useState({ date, tipo, time: '', j: '' })
  const [err, setErr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const today = new Date().toISOString().slice(0, 10)

  const save = () => {
    const x = {}
    if (!f.date) x.date = 'Informe a data do registro.'
    else if (f.date > today) x.date = 'A data não pode ser futura.'
    if (!f.time) x.time = 'Informe o horário solicitado.'
    if (f.j.trim().length < 10) x.j = 'Descreva o motivo com ao menos 10 caracteres.'
    if (!x.date && requests.some((r) => r.n === me.n && r.st === 'Pendente' && r.dr === fmtShort(f.date) && r.tp === f.tipo)) x.date = 'Já existe uma solicitação pendente para este registro.'
    setErr(x)
    if (Object.keys(x).length) return
    const rec = recordAt(me, f.date, journeyOf(me, journeys))
    const orig = rec && rec[KEY[f.tipo]] != null ? mm(rec[KEY[f.tipo]]) : '—'
    setRequests((l) => [{ id: Date.now(), n: me.n, tp: f.tipo, dr: fmtShort(f.date), o: orig, s: f.time, j: f.j.trim(), sol: 'Solicitado agora', env: fmtShort(today), st: 'Pendente' }, ...l])
    log(me.n, 'Solicitou correção de ponto', `${f.tipo} em ${fmtShort(f.date).slice(0, 6)}`, 'msg', 'Solicitações')
    setUnread(true); closeModal(); toast('Solicitação enviada para análise')
  }
  const E = ({ k }) => (err[k] ? <div className="fe">{err[k]}</div> : null)

  return (
    <>
      <h2>Nova solicitação de correção</h2>
      <div className="sm" style={{ margin: '4px 0 16px' }}>O administrador analisará o ajuste e você será avisado da decisão.</div>
      <div className="fg">
        <Field label="Data do registro"><input className="fi" type="date" max={today} value={f.date} onChange={set('date')} /><E k="date" /></Field>
        <Field label="Tipo de registro"><select className="fi" value={f.tipo} onChange={set('tipo')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Horário solicitado" w><input className="fi" type="time" value={f.time} onChange={set('time')} /><E k="time" /></Field>
        <Field label="Justificativa" w><textarea className="fi" placeholder="Explique o motivo da correção" value={f.j} onChange={set('j')} /><E k="j" /></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={save}><Icon n="check" /> Enviar solicitação</button>
      </div>
    </>
  )
}
