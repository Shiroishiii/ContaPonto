import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getReport } from '../services/reportService'
import { Avatar, Badge, Icon, PageHeader } from '../components/ui'
import EmployeeForm from '../components/EmployeeForm'
import JourneyForm from '../components/JourneyForm'
import { hm } from '../utils'

const today = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
const prettyDate = (timezone) => new Date().toLocaleDateString('pt-BR', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' })
const TYPE = { ENTRY: 'Entrada', BREAK_START: 'Início do intervalo', BREAK_END: 'Retorno', EXIT: 'Saída' }
export default function Dashboard() {
  const { adminRequests: requests, employees, records, token, user, openModal, dataError } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const nav = useNavigate()
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const [per, setPer] = useState('today')
  useEffect(() => { let active = true; const endDate = today(timezone); const days = per === 'today' ? 1 : 7; const startDate = new Date(Date.parse(`${endDate}T12:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10); getReport({ startDate, endDate }, token).then((r) => { if (active) setReport(r) }).catch((e) => { if (active) setReportError(e.message) }); return () => { active = false } }, [token, per, timezone])
  const summaries = report?.summaries || []
  const current = summaries.map((x) => x.days?.find((day) => day.date === today(timezone))).filter(Boolean)
  const working = current.filter((x) => x.status === 'IN_PROGRESS').length
  const incomplete = current.filter((x) => ['NOT_STARTED', 'IN_PROGRESS'].includes(x.status)).length
  const late = current.filter((x) => (x.summary?.lateMinutes || 0) > 0).length
  const pending = requests.filter((r) => r.st === 'Pendente').length
  const kpis = [['Funcionários ativos', employees.filter((employee) => employee.status === 'ACTIVE').length, 'Na empresa', 'g'], ['Trabalhando agora', working, 'Registros em andamento', 'g'], ['Incompletos ou sem entrada', incomplete, 'Hoje', 'a'], ['Correções pendentes', pending, 'Aguardando análise', 'r']]
  const bars = useMemo(() => { const counts = Array(22).fill(0); records.forEach((r) => { const hour = Number((r.time || '').slice(0, 2)); if (hour >= 6 && hour < 18) counts[hour - 6]++ }); const max = Math.max(...counts, 1); return counts.map((n) => Math.max(3, n / max * 100)) }, [records])
  const shortcuts = [['users', 'Novo funcionário', 'Adicionar ao quadro', () => openModal(<EmployeeForm />)], ['cal', 'Criar jornada', 'Configurar horários', () => openModal(<JourneyForm />)], ['msg', 'Analisar correções', `${pending} aguardando revisão`, () => nav('/admin/solicitacoes')]]
  const recent = [...records].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)).slice(0, 5)
  return <>
    <PageHeader title="Visão geral" desc={`Operação de hoje, ${prettyDate(timezone)}.`}><select className="fi" style={{ width: 150 }} value={per} onChange={(e) => setPer(e.target.value)}><option value="today">Hoje</option><option value="7">Últimos 7 dias</option></select><button className="bt" onClick={() => openModal(<EmployeeForm />)}><Icon n="plus" /> Adicionar funcionário</button></PageHeader>
    {(dataError || reportError) && <div className="er">{dataError || reportError}</div>}
    <div className="pn kp">{kpis.map((k) => <div key={k[0]}><div className="sp sm"><span style={{ color: 'var(--t)' }}>{k[0]}</span><i className="sq" style={{ background: `var(--${k[3]})` }} /></div><div className="num">{k[1]}</div><div className="sm" style={{ fontSize: 10 }}>{k[2]}</div></div>)}</div>
    <div className="g2"><div className="pn pd"><div className="sp"><div><div className="lb">Movimentação</div><h2 style={{ marginTop: 6 }}>Registros por horário</h2></div><span className="sm">Entradas e saídas</span></div><div className="row" style={{ marginTop: 12, alignItems: 'baseline' }}><span className="num" style={{ fontSize: 28 }}>{records.length}</span><span className="sm">registros hoje</span></div><div className="bars">{bars.map((v, i) => <i key={i} style={{ height: `${v}%` }} title={`${i + 6}h · ${Math.round(v)}%`} />)}</div><div className="sp sm" style={{ marginTop: 6 }}>{['7h', '9h', '11h', '13h', '15h', '17h'].map((h) => <span key={h}>{h}</span>)}</div></div>
      <div className="pn" style={{ display: 'flex', flexDirection: 'column' }}><div className="pd" style={{ flex: 1 }}><div className="sp"><span className="lb">Agora</span><button className="sm" onClick={() => nav('/admin/registros')}>Ver registros →</button></div><h2 style={{ margin: '6px 0 20px' }}>Situação da equipe</h2>{[['Trabalhando', working], ['Com atraso', late], ['Sem entrada ou incompletos', incomplete], ['Jornada concluída', current.filter((x) => x.status === 'COMPLETED').length]].map(([label, count]) => <div key={label} className="row" style={{ marginBottom: 16, fontSize: 11 }}><span style={{ width: 150 }}>{label}</span><i style={{ flex: 1, height: 2, background: 'var(--b)', position: 'relative' }}><i style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${employees.length ? count / employees.length * 100 : 0}%`, background: 'var(--m)' }} /></i><b>{count}</b></div>)}</div><div className="sp pd" style={{ borderTop: '1px solid var(--b)', padding: '14px 20px' }}><span className="lb">Horas no período</span><b style={{ fontSize: 20 }}>{report ? hm(report.totals.workedMinutes) : '—'}</b></div></div></div>
    <div className="g2"><div className="pn"><div className="sp" style={{ padding: '20px 20px 12px' }}><div><div className="lb">Tempo real</div><h2 style={{ marginTop: 6 }}>Registros recentes</h2></div><button className="sm" onClick={() => nav('/admin/registros')}>Visualizar todos</button></div><div className="sc"><table><thead><tr><th>Funcionário</th><th>Registro</th><th>Horário</th><th /></tr></thead><tbody>{recent.map((r) => <tr key={r.id}><td><span className="row"><Avatar name={r.n} /><b>{r.n}</b></span></td><td className="sm">{TYPE[r.type]}</td><td>{r.time}</td><td><Badge t="Registrado" /></td></tr>)}{!recent.length && <tr><td colSpan={4} className="sm" style={{ textAlign: 'center', padding: 30 }}>Nenhum registro hoje.</td></tr>}</tbody></table></div></div>
      <div className="pn pd"><div className="lb">Ações rápidas</div><h2 style={{ margin: '6px 0 14px' }}>Atalhos operacionais</h2>{shortcuts.map((a) => <button key={a[1]} className="row" style={{ width: '100%', padding: '12px 0', borderTop: '1px solid var(--b)', textAlign: 'left' }} onClick={a[3]}><span className="ic"><Icon n={a[0]} /></span><span style={{ flex: 1 }}><b>{a[1]}</b><div className="sm">{a[2]}</div></span><Icon n="r" /></button>)}</div></div>
  </>
}
