import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Avatar, Icon, PageHeader } from '../components/ui'
import { exportCSV, exportPDF } from '../exportFiles'
import { getReport } from '../services/reportService'
import { hm, pad } from '../utils'
const HEAD = ['Funcionário', 'Previstas', 'Trabalhadas', 'Extras', 'Atrasos (min)', 'Incompletos', 'Saldo']
const today = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
const dayOffset = (end, n) => new Date(Date.parse(`${end}T00:00:00Z`) - (n - 1) * 86400000).toISOString().slice(0, 10)
export default function Reports() {
  const { employees, token, user, openModal } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const [draft, setDraft] = useState(() => ({ startDate: dayOffset(today(timezone), 7), endDate: today(timezone), employeeId: '' }))
  const [filters, setFilters] = useState(draft)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setDraft((old) => ({ ...old, [key]: e.target.value }))
  const generate = async () => {
    if (!draft.startDate || !draft.endDate || draft.startDate > draft.endDate) return setError('Informe um período válido.')
    setBusy(true); setError('')
    try { const next = await getReport(draft, token); setReport(next); setFilters(draft) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const summaries = report?.summaries || []
  const rows = useMemo(() => summaries.filter((s) => !filters.employeeId || s.employee.id === Number(filters.employeeId)).map((s) => {
    const balance = (s.workedMinutes || 0) - (s.expectedMinutes || 0)
    return [s.employee.fullName, hm(s.expectedMinutes || 0), hm(s.workedMinutes || 0), hm(s.overtimeMinutes || 0), s.lateMinutes || 0, s.incompleteDays || 0, `${balance < 0 ? '-' : '+'}${hm(balance)}`]
  }), [summaries, filters.employeeId])
  const total = report?.totals || {}
  const plot = summaries.map((s, i) => ({ x: i, value: s.days.reduce((n, d) => n + (d.summary.workedMinutes || 0), 0) }))
  const maxValue = Math.max(...plot.map((p) => p.value), 60)
  const points = plot.map((p, i) => `${plot.length < 2 ? 430 : 40 + i * 780 / (plot.length - 1)},${170 - p.value / maxValue * 135}`).join(' ')
  const label = report ? `${report.startDate} – ${report.endDate}` : `${filters.startDate} – ${filters.endDate}`
  const doExport = (type) => type === 'csv' ? exportCSV(HEAD, rows, 'relatorio-jornada.csv') : exportPDF(`Relatório de jornada (${label})`, HEAD, rows, 'relatorio-jornada.pdf')
  return <>
    <PageHeader title="Relatórios" desc="Analise horas, ocorrências e desempenho da operação."><button className="bt o" onClick={() => openModal(<><h2>Exportar relatório</h2><p className="sm" style={{ margin: '8px 0 18px' }}>Período: {label}</p><div className="row" style={{ justifyContent: 'flex-end' }}><button className="bt o" onClick={() => doExport('csv')}><Icon n="dl" /> CSV</button><button className="bt" onClick={() => doExport('pdf')}><Icon n="dl" /> PDF</button></div></>)}><Icon n="dl" /> Exportar relatório</button></PageHeader>
    <div className="pn pd" style={{ marginBottom: 16 }}><div className="fl"><div><label>De</label><input className="fi" type="date" value={draft.startDate} onChange={set('startDate')} /></div><div><label>Até</label><input className="fi" type="date" value={draft.endDate} onChange={set('endDate')} /></div><div><label>Funcionário</label><select className="fi" value={draft.employeeId} onChange={set('employeeId')}><option value="">Todos os funcionários</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div><div style={{ flex: 'none', minWidth: 0 }}><button className="bt" disabled={busy} onClick={generate}><Icon n="filter" /> {busy ? 'Gerando…' : 'Gerar relatório'}</button></div></div>{error && <div className="er">{error}</div>}</div>
    <div className="g2" style={{ gridTemplateColumns: '1fr 1.5fr' }}><div className="pn pd"><div className="lb">Total de horas trabalhadas · {label}</div><div className="num" style={{ margin: '22px 0 14px', fontSize: 38 }}>{total.workedMinutes == null ? '—' : hm(total.workedMinutes)}</div><div className="sm">Fuso horário: {report?.timezone || '—'}</div></div><div className="pn kp" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: 0 }}>{[['Horas extras', hm(total.overtimeMinutes || 0), 'No período'], ['Atrasos', total.lateMinutes || 0, 'minutos acumulados'], ['Incompletos', total.incompleteDays || 0, 'dias para revisar']].map(([l, v, s]) => <div key={l}><div className="sm" style={{ color: 'var(--t)' }}>{l}</div><div className="num" style={{ fontSize: 28 }}>{v}</div><div className="sm" style={{ fontSize: 10 }}>{s}</div></div>)}</div></div>
    <div className="pn pd" style={{ marginBottom: 16 }}><div className="sp"><div><div className="lb">Evolução do período</div><h2 style={{ marginTop: 6 }}>Horas realizadas por funcionário</h2></div></div><svg viewBox="0 0 860 190" preserveAspectRatio="none" style={{ width: '100%', height: 190, marginTop: 10, strokeWidth: 1.5 }}><g stroke="var(--b)"><path d="M0 40H860M0 100H860M0 160H860" /></g><polyline points={points} stroke="var(--t)" /></svg></div>
    <div className="pn"><div className="sp" style={{ padding: '18px 20px' }}><h2>Detalhamento por funcionário</h2><span className="lb">{rows.length} resultados</span></div><div className="sc"><table><thead><tr>{HEAD.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r[0]}><td><span className="row"><Avatar name={r[0]} /><b>{r[0]}</b></span></td>{r.slice(1).map((x, i) => <td key={i}>{x}</td>)}</tr>)}{!rows.length && <tr><td colSpan={7} className="sm" style={{ textAlign: 'center', padding: 40 }}>{report ? 'Nenhum resultado para o período.' : 'Selecione o período e gere o relatório.'}</td></tr>}</tbody></table></div></div>
  </>
}
