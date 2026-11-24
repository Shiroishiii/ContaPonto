import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Avatar, Badge, Icon, PageHeader, Pagination } from '../components/ui'
import { exportPDF } from '../exportFiles'
import { getReport } from '../services/reportService'
import { brDate, hm } from '../utils'
const HEAD = ['Funcionário', 'Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total', 'Diferença', 'Situação']
const today = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
const LABELS = { ENTRY: 'en', BREAK_START: 'iv', BREAK_END: 'rt', EXIT: 'sa' }
const time = (value, timezone) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—'
const statusName = (day) => day.status === 'COMPLETED' ? day.summary.overtimeMinutes > 0 ? 'Extra' : day.summary.lateMinutes > 0 ? 'Atraso' : 'Regular' : day.records.length ? 'Em andamento' : day.status === 'DAY_OFF' ? 'Folga' : 'Incompleto'
export default function TimeRecords() {
  const { employees, token, user } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const [draft, setDraft] = useState({ employeeId: '', status: '', date: today(timezone) })
  const [applied, setApplied] = useState(draft)
  const [days, setDays] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pg, setPg] = useState(1)
  useEffect(() => { let active = true; setBusy(true); getReport({ startDate: applied.date, endDate: applied.date, ...(applied.employeeId ? { employeeId: applied.employeeId } : {}) }, token).then((report) => { if (active) setDays(report.summaries.map((s) => ({ employeeId: s.employee.id, n: s.employee.fullName, d: applied.date, ...Object.fromEntries(['en', 'iv', 'rt', 'sa'].map((key) => [key, '—'])), ...Object.fromEntries(s.days[0].records.map((r) => [LABELS[r.type], time(r.recordedAt, timezone)])), t: s.days[0].summary.workedHours ? `${s.days[0].summary.workedHours}h` : '—', df: s.days[0].summary.balanceMinutes == null ? '—' : `${s.days[0].summary.balanceMinutes < 0 ? '-' : '+'}${hm(s.days[0].summary.balanceMinutes)}`, s: statusName(s.days[0]) }))) }).catch((e) => { if (active) { setDays([]); setError(e.message) } }).finally(() => { if (active) setBusy(false) }); return () => { active = false } }, [applied, token, timezone])
  const list = useMemo(() => days.filter((r) => (!applied.status || r.s === applied.status)), [days, applied.status])
  const pages = Math.max(1, Math.ceil(list.length / 5)); const page = Math.min(pg, pages); const rows = list.slice((page - 1) * 5, page * 5)
  const count = (...values) => list.filter((r) => values.includes(r.s)).length
  const pct = (n) => list.length ? `${(n / list.length * 100).toFixed(1).replace('.', ',')}%` : '0%'
  const set = (key) => (e) => setDraft((old) => ({ ...old, [key]: e.target.value }))
  const apply = () => { setError(''); setPg(1); setApplied(draft) }
  const stats = [['Registros', list.length], ['Regulares', count('Regular', 'Extra')], ['Com atraso', count('Atraso')], ['Incompletos', count('Incompleto', 'Em andamento')]]
  return <>
    <PageHeader title="Registros de ponto" desc="Consulte e acompanhe as jornadas de toda a equipe."><button className="bt o" onClick={() => exportPDF('Registros de ponto', HEAD, list.map((r) => [r.n, brDate(r.d), r.en, r.iv, r.rt, r.sa, r.t, r.df, r.s]), 'registros-de-ponto.pdf')}><Icon n="dl" /> Exportar</button></PageHeader>
    <div className="pn pd" style={{ marginBottom: 16 }}><div className="fl"><div><label>Data</label><input className="fi" type="date" value={draft.date} onChange={set('date')} /></div><div><label>Funcionário</label><select className="fi" value={draft.employeeId} onChange={set('employeeId')}><option value="">Todos os funcionários</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div><div><label>Situação</label><select className="fi" value={draft.status} onChange={set('status')}><option value="">Todas as situações</option>{['Regular', 'Extra', 'Atraso', 'Incompleto', 'Em andamento', 'Folga'].map((s) => <option key={s}>{s}</option>)}</select></div><div style={{ flex: 'none', minWidth: 0, display: 'flex', gap: 8 }}><button className="bt" onClick={apply}><Icon n="filter" /> Aplicar filtros</button><button className="bt o" onClick={() => { const clean = { employeeId: '', status: '', date: today(timezone) }; setDraft(clean); setApplied(clean); setPg(1) }}>Limpar</button></div></div>{error && <div className="er">{error}</div>}</div>
    <div className="pn kp" style={{ marginBottom: 16 }}>{stats.map(([label, n]) => <div key={label} className="sp" style={{ padding: '14px 20px' }}><span className="lb" style={{ fontSize: 9 }}>{label}</span><span><b style={{ fontSize: 20 }}>{n}</b> <span className="sm">{pct(n)}</span></span></div>)}</div>
    <div className="pn"><div className="sc"><table><thead><tr>{HEAD.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.employeeId}><td><span className="row"><Avatar name={r.n} /><b>{r.n}</b></span></td><td className="sm">{brDate(r.d)}</td><td>{r.en}</td><td>{r.iv}</td><td>{r.rt}</td><td>{r.sa}</td><td>{r.t}</td><td style={{ color: `var(--${r.df.startsWith('-') ? 'a' : 'g'})` }}>{r.df}</td><td><Badge t={r.s} /></td></tr>)}{!rows.length && <tr><td colSpan={9} className="sm" style={{ textAlign: 'center', padding: 40 }}>{busy ? 'Carregando registros…' : 'Nenhum registro encontrado para os filtros escolhidos.'}</td></tr>}</tbody></table></div><Pagination page={page} pages={pages} onChange={setPg} label={`Exibindo ${list.length ? (page - 1) * 5 + 1 : 0}-${Math.min(page * 5, list.length)} de ${list.length} funcionários`} /></div>
  </>
}
