import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { getWorkday } from '../../services/reportService'
import { useNow, LABELS, BADGE } from '../../data/punch'
import { Badge, Icon } from '../../components/ui'
import Track from '../../components/Track'
import { hm, pad, sgn } from '../../utils'
const localToday = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
const offsetDate = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
const time = (date, timezone) => date ? new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)) : '—'
const TYPES = ['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT']
export default function EmpDashboard() {
  const { me, user, token, requests, today } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const nav = useNavigate(); const now = useNow()
  const [workday, setWorkday] = useState(null); const [week, setWeek] = useState([]); const [error, setError] = useState('')
  useEffect(() => {
    if (!me?.id || !token) return
    let active = true
    Promise.all(Array.from({ length: 7 }, (_, i) => getWorkday(me.id, offsetDate(localToday(timezone), i - 6), token))).then((days) => { if (active) { setWeek(days); setWorkday(days.at(-1)) } }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [me?.id, token, today, timezone])
  const pending = requests.filter((r) => r.status === 'PENDING').length
  const worked = week.reduce((sum, x) => sum + (x.summary?.workedMinutes || 0), 0)
  const expected = week.reduce((sum, x) => sum + (x.summary?.expectedMinutes || 0), 0)
  const saldo = week.reduce((sum, x) => sum + (x.summary?.balanceMinutes || 0), 0)
  const next = today?.nextType
  const idx = next ? TYPES.indexOf(next) : 4
  const items = LABELS.map((label, i) => ({ label, time: time(workday?.records?.find((r) => r.type === TYPES[i])?.recordedAt, timezone), state: workday?.records?.some((r) => r.type === TYPES[i]) ? 'done' : i === idx ? 'cur' : 'pend' }))
  const recentRequest = requests[0]
  return <>
    <div className="ph"><div><h1 style={{ fontSize: 26 }}>Olá, {me?.n?.split(' ')[0] || 'Funcionário'}.</h1><div className="sm" style={{ fontSize: 12 }}>{new Date().toLocaleDateString('pt-BR', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div><Badge t={BADGE[Math.min(idx, 4)]} /></div>
    {error && <div className="er">{error}</div>}
    <div className="g2"><div className="pn pd" style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: 270 }}><div className="lb" style={{ fontSize: 9 }}>Sua jornada hoje</div><div className="sp na" style={{ flex: 1, alignItems: 'center', gap: 16, flexWrap: 'wrap' }}><div><div className="sm">Próxima ação</div><div style={{ fontSize: 28, margin: '10px 0' }}>{next ? LABELS[idx] : 'Jornada concluída'}</div><div className="sm" style={{ fontSize: 10 }}>Horário previsto: {workday?.schedule?.endTime || '—'}</div></div><div style={{ textAlign: 'right' }}><div className="num" style={{ fontSize: 34 }}>{workday?.summary?.workedHours || '—'}</div><div className="lb" style={{ fontSize: 8 }}>trabalhados</div></div></div><button className="bt" onClick={() => nav('/funcionario/registrar-ponto')}><Icon n="clock" /> Ir para registro de ponto</button></div>
      <div className="pn pd"><div className="sp"><span className="lb" style={{ fontSize: 9 }}>Últimos 7 dias</span><b style={{ fontSize: 17 }}>{hm(worked)}</b></div><h2 style={{ margin: '8px 0 18px' }}>Resumo semanal</h2><div className="wk">{week.map((d) => <div key={d.date} title={`${d.date}: ${d.summary.workedHours || '0h00'}`}><i style={{ height: `${Math.min(100, d.summary.workedMinutes / Math.max(d.summary.expectedMinutes || 480, 1) * 100)}%` }} /></div>)}</div><div className="wk" style={{ height: 'auto', margin: '8px 0 14px' }}>{week.map((d) => <span key={d.date} className="sm" style={{ textAlign: 'center', background: 'none' }}>{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'narrow', timeZone: 'UTC' })}</span>)}</div><div className="sp sm" style={{ borderTop: '1px solid var(--b)', paddingTop: 12 }}><span>Previstas <b style={{ color: 'var(--t)' }}>{hm(expected)}</b></span><span>Saldo <b style={{ color: `var(--${saldo < 0 ? 'a' : 'g'})` }}>{sgn(saldo)}</b></span></div></div></div>
    <div className="g2"><div className="pn pd"><div className="sp"><span className="lb" style={{ fontSize: 9 }}>Hoje</span><button className="sm" onClick={() => nav('/funcionario/historico')}>Ver histórico</button></div><h2 style={{ margin: '8px 0 24px' }}>Registros da jornada</h2><Track items={items} /></div><div className="pn pd"><div className="lb" style={{ fontSize: 9 }}>Solicitações</div><h2 style={{ fontSize: 17, fontWeight: 500, margin: '14px 0 10px' }}>{pending ? `${pending} correção(ões) em análise` : 'Nenhuma correção pendente'}</h2><div className="sm" style={{ marginBottom: 22 }}>{recentRequest ? `Última solicitação: ${recentRequest.dr}.` : 'Você não tem solicitações aguardando avaliação.'}</div><button className="row" style={{ fontWeight: 600, fontSize: 12 }} onClick={() => nav('/funcionario/correcoes')}>Ver solicitações <Icon n="arr" /></button></div></div>
  </>
}
