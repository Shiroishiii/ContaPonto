import { Fragment, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getWorkday } from '../../services/reportService'
import { Badge, Icon, PageHeader } from '../../components/ui'
import RequestForm from '../../components/RequestForm'
import { exportPDF } from '../../exportFiles'
import { hm, pad, sgn } from '../../utils'
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TYPES = { ENTRY: 'en', BREAK_START: 'iv', BREAK_END: 'rt', EXIT: 'sa' }
const showTime = (date, timezone) => date ? new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)) : null
const dayStatus = (x) => x.status === 'COMPLETED' ? (x.summary.overtimeMinutes > 0 ? 'Extra' : x.summary.lateMinutes > 0 ? 'Atraso' : 'Regular') : x.status === 'DAY_OFF' && !x.records.length ? 'Folga' : x.records.length ? 'Incompleto' : 'Sem registros'
export default function History() {
  const { me, user, token, openModal } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  const [ym, setYm] = useState(() => ({ y: Number(currentDate.slice(0, 4)), m: Number(currentDate.slice(5, 7)) - 1 }))
  const [days, setDays] = useState([]); const [open, setOpen] = useState(-1); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const today = currentDate
  useEffect(() => {
    if (!me?.id) return
    let active = true; setLoading(true); setError('')
    const count = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate()
    const lastDay = ym.y === Number(today.slice(0, 4)) && ym.m === Number(today.slice(5, 7)) - 1 ? Number(today.slice(8, 10)) : count
    const dates = Array.from({ length: lastDay }, (_, i) => `${ym.y}-${pad(ym.m + 1)}-${pad(i + 1)}`)
    Promise.all(dates.map((date) => getWorkday(me.id, date, token))).then((items) => {
      if (!active) return
      setDays(items.map((item) => {
        const row = { ...item, en: null, iv: null, rt: null, sa: null }
        item.records.forEach((record) => { row[TYPES[record.type]] = showTime(record.recordedAt, item.timezone || timezone) })
        return { ...row, date: item.date, day: Number(item.date.slice(8, 10)), weekday: new Date(`${item.date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''), total: item.summary.workedMinutes, balance: item.summary.balanceMinutes, statusLabel: dayStatus(item) }
      }))
    }).catch((e) => { if (active) { setDays([]); setError(e.message) } }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [me?.id, token, ym.y, ym.m, today, timezone])
  const total = days.reduce((n, d) => n + (d.total || 0), 0)
  const saldo = days.reduce((n, d) => n + (d.balance || 0), 0)
  const canPrev = ym.y > 2020; const canNext = ym.y < Number(today.slice(0, 4)) || (ym.y === Number(today.slice(0, 4)) && ym.m < Number(today.slice(5, 7)) - 1)
  const go = (delta) => { const date = new Date(Date.UTC(ym.y, ym.m + delta, 1)); setYm({ y: date.getUTCFullYear(), m: date.getUTCMonth() }); setOpen(-1) }
  const download = () => exportPDF(`Espelho de ponto - ${MONTHS[ym.m]} de ${ym.y} - ${me.n} (${me.mat || ''})`, ['Data', 'Dia', 'Entrada', 'Início intervalo', 'Retorno', 'Saída', 'Total', 'Situação'], [...days].reverse().map((x) => [`${pad(x.day)}/${pad(ym.m + 1)}/${ym.y}`, x.weekday, x.en || '—', x.iv || '—', x.rt || '—', x.sa || '—', hm(x.total || 0), x.statusLabel]).concat([['', '', '', '', '', 'Horas no mês', hm(total), `Saldo ${sgn(saldo)}`]]), `espelho-ponto-${ym.y}-${pad(ym.m + 1)}.pdf`)
  return <>
    <PageHeader title="Meu histórico" desc="Consulte seus registros e totais por período."><button className="bt o" disabled={!days.length} onClick={download}><Icon n="dl" /> Baixar espelho</button></PageHeader>
    {error && <div className="er">{error}</div>}
    <div className="pn sp" style={{ marginBottom: 16, flexWrap: 'wrap' }}><div className="row" style={{ padding: 12 }}><button className="ib" disabled={!canPrev} style={{ transform: 'rotate(180deg)', opacity: canPrev ? 1 : 0.35 }} onClick={() => go(-1)}><Icon n="r" /></button><b style={{ minWidth: 150, textAlign: 'center' }}>{MONTHS[ym.m]} de {ym.y}</b><button className="ib" disabled={!canNext} style={{ opacity: canNext ? 1 : 0.35 }} onClick={() => go(1)}><Icon n="r" /></button></div><div className="row" style={{ gap: 0 }}><div style={{ padding: '12px 28px', borderLeft: '1px solid var(--b)' }}><div className="lb" style={{ fontSize: 8 }}>Horas no mês</div><b style={{ display: 'block', marginTop: 6 }}>{hm(total)}</b></div><div style={{ padding: '12px 28px', borderLeft: '1px solid var(--b)' }}><div className="lb" style={{ fontSize: 8 }}>Saldo</div><b style={{ display: 'block', marginTop: 6, color: `var(--${saldo < 0 ? 'a' : 'g'})` }}>{sgn(saldo)}</b></div></div></div>
    <div className="pn sc"><table><thead><tr><th>Data</th><th>Registros</th><th>Total</th><th>Situação</th><th /></tr></thead><tbody>{days.map((x, i) => <Fragment key={x.date}><tr className="k" onClick={() => setOpen(open === i ? -1 : i)}><td><span style={{ fontSize: 16, fontWeight: 600, marginRight: 8 }}>{pad(x.day)}</span><span className="sm">{x.weekday}</span></td><td className="sm">{[x.en, x.iv, x.rt, x.sa].map((v) => v || '—').join(' · ')}</td><td><b>{x.total == null ? '—' : hm(x.total)}</b></td><td><Badge t={x.statusLabel} tone={x.statusLabel === 'Extra' ? 'g' : undefined} /></td><td style={{ textAlign: 'right' }}><Icon n="chev" /></td></tr>{open === i && <tr><td colSpan={5} style={{ background: 'var(--s)', padding: '18px 16px' }}><div className="sp" style={{ flexWrap: 'wrap', gap: 16 }}><div className="row" style={{ gap: 28 }}>{[['Entrada', x.en || '—'], ['Intervalo', `${x.iv || '—'} — ${x.rt || '—'}`], ['Saída', x.sa || '—'], ['Atraso', x.summary.lateHours || '—'], ['Saída antecipada', x.summary.earlyDepartureHours || '—'], ['Saldo', x.summary.balanceMinutes == null ? '—' : sgn(x.summary.balanceMinutes)]].map(([label, value]) => <div key={label}><div className="lb" style={{ fontSize: 8 }}>{label}</div><b style={{ display: 'block', marginTop: 6 }}>{value}</b></div>)}</div><button className="bt o" onClick={() => openModal(<RequestForm date={x.date} />)}>Solicitar correção</button></div></td></tr>}</Fragment>)}{!days.length && <tr><td colSpan={5} className="sm" style={{ textAlign: 'center', padding: 40 }}>{loading ? 'Carregando histórico…' : 'Nenhum dia disponível.'}</td></tr>}</tbody></table></div>
  </>
}
