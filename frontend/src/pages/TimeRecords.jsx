import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Avatar, Badge, Icon, PageHeader, Pagination } from '../components/ui'
import { exportPDF } from '../exportFiles'
import { brDate } from '../utils'

const HEAD = ['Funcionário', 'Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total', 'Diferença', 'Situação']

export default function TimeRecords() {
  const { records, employees, toast } = useApp()
  const [draft, setDraft] = useState({ f: '', s: '', d: '2025-06-18' })
  const [applied, setApplied] = useState({ f: '', s: '', d: '' })
  const [pg, setPg] = useState(1)
  const list = records.filter((r) => (!applied.f || r.n === applied.f) && (!applied.s || r.s === applied.s) && (!applied.d || r.d === applied.d))
  const pages = Math.max(1, Math.ceil(list.length / 5))
  const page = Math.min(pg, pages)
  const rows = list.slice((page - 1) * 5, page * 5)
  const c = (...s) => list.filter((r) => s.includes(r.s)).length
  const pct = (n) => (list.length ? ((n / list.length) * 100).toFixed(1).replace('.', ',') : 0)
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value })
  const stats = [['Registros', list.length], ['Regulares', c('Regular', 'Extra')], ['Com atraso', c('Atraso')], ['Incompletos', c('Incompleto')]]

  return (
    <>
      <PageHeader title="Registros de ponto" desc="Consulte e acompanhe as jornadas de toda a equipe.">
        <button className="bt o" onClick={() => exportPDF('Registros de ponto', HEAD, list.map((r) => [r.n, brDate(r.d), r.en, r.iv, r.rt, r.sa, r.t, r.df, r.s]), 'registros-de-ponto.pdf')}><Icon n="dl" /> Exportar</button>
      </PageHeader>
      <div className="pn pd" style={{ marginBottom: 16 }}>
        <div className="fl">
          <div><label>Período</label><input className="fi" type="date" value={draft.d} onChange={set('d')} /></div>
          <div><label>Funcionário</label><select className="fi" value={draft.f} onChange={set('f')}><option value="">Todos os funcionários</option>{employees.slice(0, 30).map((e) => <option key={e.id}>{e.n}</option>)}</select></div>
          <div><label>Situação</label><select className="fi" value={draft.s} onChange={set('s')}><option value="">Todas as situações</option>{['Regular', 'Extra', 'Atraso', 'Incompleto', 'Em andamento'].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div style={{ flex: 'none', minWidth: 0, display: 'flex', gap: 8 }}>
            <button className="bt" onClick={() => { setApplied({ ...draft, d: draft.d === '2025-06-18' && !applied.d ? '' : draft.d }); setPg(1); toast('Filtros aplicados') }}><Icon n="filter" /> Aplicar filtros</button>
            <button className="bt o" onClick={() => { setApplied({ f: '', s: '', d: '' }); setDraft({ f: '', s: '', d: '2025-06-18' }); setPg(1) }}>Limpar</button>
          </div>
        </div>
      </div>
      <div className="pn kp" style={{ marginBottom: 16 }}>
        {stats.map(([l, n]) => <div key={l} className="sp" style={{ padding: '14px 20px' }}><span className="lb" style={{ fontSize: 9 }}>{l}</span><span><b style={{ fontSize: 20 }}>{n}</b> <span className="sm">{pct(n)}%</span></span></div>)}
      </div>
      <div className="pn">
        <div className="sc"><table><thead><tr>{HEAD.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><span className="row"><Avatar name={r.n} /><b>{r.n}</b></span></td><td className="sm">{brDate(r.d)}</td><td>{r.en}</td><td>{r.iv}</td><td>{r.rt}</td><td>{r.sa}</td><td>{r.t}</td>
              <td style={{ color: `var(--${r.df[0] === '-' ? 'a' : 'g'})` }}>{r.df}</td><td><Badge t={r.s} /></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={9} className="sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum registro encontrado para os filtros escolhidos.</td></tr>}
        </tbody></table></div>
        <Pagination page={page} pages={pages} onChange={setPg} label={`Exibindo ${list.length ? (page - 1) * 5 + 1 : 0}-${Math.min(page * 5, list.length)} de ${list.length} registros`} />
      </div>
    </>
  )
}
