import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Avatar, Icon, PageHeader } from '../components/ui'
import { exportCSV, exportPDF } from '../exportFiles'
import { brDate, hm, pad } from '../utils'

const HEAD = ['Funcionário', 'Previstas', 'Trabalhadas', 'Extras', 'Atrasos', 'Incompletos', 'Saldo']
const END = '2025-06-18'
const MIN = '2025-05-19' // 30 dias antes da data de referência
const PERIODS = [['m', '01 — 18 jun 2025', 18], ['7', 'Últimos 7 dias', 7], ['15', 'Últimos 15 dias', 15], ['30', 'Últimos 30 dias', 30], ['c', 'Personalizado', 0]]
const PTS = [30, 50, 45, 70, 55, 85, 60, 80, 50, 75].map((v, i) => [40 + i * 86, 170 - v])
const PRV = [40, 52, 48, 62, 58, 72, 66, 60, 58, 68].map((v, i) => [40 + i * 86, 170 - v])
const line = (a) => a.map((p) => p.join(',')).join(' ')
const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

function ExportModal({ rows, who, label }) {
  const { closeModal } = useApp()
  const tag = label.replace(/[^\d]+/g, '-').replace(/^-|-$/g, '')
  return (
    <>
      <h2>Exportar relatório</h2>
      <p className="sm" style={{ margin: '8px 0 18px' }}>O relatório inclui os filtros atuais ({who || 'todos os funcionários'}, {label}).</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt o" onClick={() => { closeModal(); exportCSV(HEAD, rows, `relatorio-${tag}.csv`) }}><Icon n="dl" /> CSV</button>
        <button className="bt" onClick={() => { closeModal(); exportPDF(`Relatório de jornada (${label})`, HEAD, rows, `relatorio-${tag}.pdf`) }}><Icon n="dl" /> PDF</button>
      </div>
    </>
  )
}

export default function Reports() {
  const { employees, openModal, toast } = useApp()
  const init = { p: 'm', f: '', s: '', a: MIN, b: END }
  const [draft, setDraft] = useState(init)
  const [ap, setAp] = useState(init)
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value })

  const days = ap.p === 'c' ? diffDays(ap.a, ap.b) + 1 : PERIODS.find((x) => x[0] === ap.p)[2]
  const label = ap.p === 'c' ? `${brDate(ap.a)} — ${brDate(ap.b)}` : PERIODS.find((x) => x[0] === ap.p)[1]
  const k = days / 18

  const data = useMemo(() => employees.filter((e) => !ap.f || e.n === ap.f).map((e, i) => {
    const p = Math.round(176 * k), w = Math.round(p + (((i * 7) % 12) - 4) * k), ex = Math.round(((i * 13) % 140) * k)
    const at = Math.round((i % 5 === 0 ? 1 + (i % 3) : 0) * Math.max(k, 0.5)), inc = i % 11 === 0 ? 1 : 0
    const saldo = (w - p) * 60 + (ex % 30)
    return { n: e.n, p, w, ex, at, inc, saldo }
  }).filter((r) => (ap.s === 'atraso' ? r.at > 0 : ap.s === 'inc' ? r.inc > 0 : true)), [employees, ap, k])

  const rows = data.map((r) => [r.n, r.p + 'h', r.w + 'h', Math.floor(r.ex / 60) + 'h ' + pad(r.ex % 60) + 'min', r.at, r.inc, (r.saldo < 0 ? '-' : '+') + hm(r.saldo)])
  const one = ap.f && data[0]
  const totalMin = one ? one.w * 60 : Math.round(9842.6 * 60 * k)
  const kpis = one
    ? [['Horas extras', Math.floor(one.ex / 60) + 'h ' + pad(one.ex % 60), 'No período'], ['Atrasos', one.at, 'No período'], ['Incompletos', one.inc, 'Requerem revisão']]
    : [['Horas extras', Math.round(184 * k) + 'h', '1,8% do total'], ['Atrasos', Math.round(47 * k), Math.round(31 * k) + 'h acumuladas'], ['Incompletos', Math.max(1, Math.round(12 * k)), 'Requerem revisão']]

  const generate = () => {
    if (draft.p === 'c') {
      if (!draft.a || !draft.b) return toast('Informe a data inicial e a final.')
      if (draft.a > draft.b) return toast('A data inicial deve ser anterior à final.')
      if (draft.a < MIN || draft.b > END) return toast('Escolha datas dentro dos últimos 30 dias.')
    }
    setAp(draft); toast('Relatório gerado')
  }

  return (
    <>
      <PageHeader title="Relatórios" desc="Analise horas, ocorrências e desempenho da operação."><button className="bt o" onClick={() => openModal(<ExportModal rows={rows} who={ap.f} label={label} />)}><Icon n="dl" /> Exportar relatório</button></PageHeader>
      <div className="pn pd" style={{ marginBottom: 16 }}><div className="fl">
        <div><label>Período</label><select className="fi" value={draft.p} onChange={set('p')}>{PERIODS.map((x) => <option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></div>
        {draft.p === 'c' && <>
          <div><label>De</label><input className="fi" type="date" min={MIN} max={END} value={draft.a} onChange={set('a')} /></div>
          <div><label>Até</label><input className="fi" type="date" min={MIN} max={END} value={draft.b} onChange={set('b')} /></div>
        </>}
        <div><label>Funcionário</label><select className="fi" value={draft.f} onChange={set('f')}><option value="">Todos os funcionários</option>{employees.slice(0, 30).map((e) => <option key={e.id}>{e.n}</option>)}</select></div>
        <div><label>Situação</label><select className="fi" value={draft.s} onChange={set('s')}><option value="">Todas as situações</option><option value="atraso">Com atraso</option><option value="inc">Incompletos</option></select></div>
        <div style={{ flex: 'none', minWidth: 0 }}><button className="bt" onClick={generate}><Icon n="filter" /> Gerar relatório</button></div>
      </div></div>
      <div className="g2" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <div className="pn pd"><div className="lb">Total de horas trabalhadas · {label}</div>
          <div className="num" style={{ margin: '22px 0 14px', fontSize: 38 }}>{Math.floor(totalMin / 60).toLocaleString('pt-BR')}<small style={{ fontSize: 14, color: 'var(--m)' }}>h</small> {pad(totalMin % 60)}<small style={{ fontSize: 12, color: 'var(--m)' }}>min</small></div>
          <div style={{ color: 'var(--g)', fontSize: 10 }}>+2,8% em relação ao período anterior</div>
        </div>
        <div className="pn kp" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: 0 }}>
          {kpis.map(([l, v, s]) => <div key={l}><div className="sm" style={{ color: 'var(--t)' }}>{l}</div><div className="num" style={{ fontSize: 28 }}>{v}</div><div className="sm" style={{ fontSize: 10 }}>{s}</div></div>)}
        </div>
      </div>
      <div className="pn pd" style={{ marginBottom: 16 }}>
        <div className="sp"><div><div className="lb">Evolução diária</div><h2 style={{ marginTop: 6 }}>Horas previstas × realizadas</h2></div><span className="sm">— Realizadas &nbsp;╌ Previstas</span></div>
        <svg viewBox="0 0 860 190" preserveAspectRatio="none" style={{ width: '100%', height: 190, marginTop: 10, strokeWidth: 1.5 }}>
          <g stroke="var(--b)"><path d="M0 40H860M0 100H860M0 160H860" /></g>
          <polyline points={line(PRV)} stroke="var(--m)" strokeDasharray="5 4" /><polyline points={line(PTS)} stroke="var(--t)" />
        </svg>
      </div>
      <div className="pn">
        <div className="sp" style={{ padding: '18px 20px' }}><h2>Detalhamento por funcionário</h2><span className="lb">{rows.length} resultados</span></div>
        <div className="sc"><table><thead><tr>{HEAD.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
          {rows.slice(0, 10).map((r) => <tr key={r[0]}><td><span className="row"><Avatar name={r[0]} /><b>{r[0]}</b></span></td>{r.slice(1).map((x, i) => <td key={i}>{x}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={7} className="sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum resultado para os filtros escolhidos.</td></tr>}
        </tbody></table></div>
      </div>
    </>
  )
}
