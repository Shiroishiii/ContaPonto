import { Fragment, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { journeyOf, monthDays, monthStats, MONTHS, MIN_MONTH, MAX_MONTH } from '../../data/schedule'
import { Badge, Icon, PageHeader } from '../../components/ui'
import RequestForm from '../../components/RequestForm'
import { exportPDF } from '../../exportFiles'
import { hm, mm, pad, sgn } from '../../utils'

const cell = (v) => (v == null ? '—' : mm(v))

export default function History() {
  const { me, journeys, openModal } = useApp()
  const [ym, setYm] = useState(MAX_MONTH)
  const [open, setOpen] = useState(0)
  const sched = journeyOf(me, journeys)
  const days = monthDays(me, ym.y, ym.m, sched)
  const st = monthStats(days, sched)
  const canPrev = ym.y * 12 + ym.m > MIN_MONTH.y * 12 + MIN_MONTH.m
  const canNext = ym.y * 12 + ym.m < MAX_MONTH.y * 12 + MAX_MONTH.m
  const go = (n) => { const t = ym.y * 12 + ym.m + n; setYm({ y: Math.floor(t / 12), m: t % 12 }); setOpen(0) }

  const download = () => exportPDF(
    `Espelho de ponto - ${MONTHS[ym.m]} de ${ym.y} - ${me.n} (${me.mat})`,
    ['Data', 'Dia', 'Entrada', 'Início intervalo', 'Retorno', 'Saída', 'Total', 'Situação'],
    [...days].reverse().map((x) => [`${pad(x.d)}/${pad(ym.m + 1)}/${ym.y}`, x.wd, cell(x.en), cell(x.iv), cell(x.rt), cell(x.sa), x.tot == null ? '—' : hm(x.tot), x.st]).concat([['', '', '', '', '', 'Horas no mês', `${(st.total / 60) | 0}h${pad(st.total % 60)}`, `Saldo ${sgn(st.saldo)}`]]),
    `espelho-de-ponto-${ym.y}-${pad(ym.m + 1)}.pdf`,
  )

  return (
    <>
      <PageHeader title="Meu histórico" desc="Consulte seus registros e totais por período."><button className="bt o" onClick={download}><Icon n="dl" /> Baixar espelho</button></PageHeader>
      <div className="pn sp" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="row" style={{ padding: 12 }}>
          <button className="ib" disabled={!canPrev} style={{ transform: 'rotate(180deg)', opacity: canPrev ? 1 : 0.35 }} onClick={() => go(-1)}><Icon n="r" /></button>
          <b style={{ minWidth: 110, textAlign: 'center' }}>{MONTHS[ym.m]} de {ym.y}</b>
          <button className="ib" disabled={!canNext} style={{ opacity: canNext ? 1 : 0.35 }} onClick={() => go(1)}><Icon n="r" /></button>
        </div>
        <div className="row" style={{ gap: 0 }}>
          <div style={{ padding: '12px 28px', borderLeft: '1px solid var(--b)' }}><div className="lb" style={{ fontSize: 8 }}>Horas no mês</div><b style={{ display: 'block', marginTop: 6 }}>{(st.total / 60) | 0}h {pad(st.total % 60)}min</b></div>
          <div style={{ padding: '12px 28px', borderLeft: '1px solid var(--b)' }}><div className="lb" style={{ fontSize: 8 }}>Saldo</div><b style={{ display: 'block', marginTop: 6, color: `var(--${st.saldo < 0 ? 'a' : 'g'})` }}>{sgn(st.saldo).replace('h', 'h ')}min</b></div>
        </div>
      </div>
      <div className="pn sc">
        <table>
          <thead><tr><th>Data</th><th>Registros</th><th>Total</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {days.map((x, i) => (
              <Fragment key={x.date}>
                <tr className="k" onClick={() => setOpen(open === i + 1 ? -1 : i + 1)}>
                  <td><span style={{ fontSize: 16, fontWeight: 600, marginRight: 8 }}>{pad(x.d)}</span><span className="sm">{x.wd}</span></td>
                  <td className="sm">{[x.en, x.iv, x.rt, x.sa].map(cell).join(' · ')}</td>
                  <td><b>{x.tot == null ? '—' : hm(x.tot)}</b></td>
                  <td><Badge t={x.st} tone={x.st === 'Extra' ? 'g' : undefined} /></td>
                  <td style={{ textAlign: 'right' }}><span style={{ display: 'inline-block', transform: open === i + 1 ? 'rotate(180deg)' : 'none' }}><Icon n="chev" /></span></td>
                </tr>
                {open === i + 1 && (
                  <tr>
                    <td colSpan={5} style={{ background: 'var(--s)', padding: '18px 16px' }}>
                      <div className="sp" style={{ flexWrap: 'wrap', gap: 16 }}>
                        <div className="row" style={{ gap: 28 }}>
                          {[['Entrada', cell(x.en)], ['Intervalo', `${cell(x.iv)} — ${cell(x.rt)}`], ['Saída', cell(x.sa)]].map(([l, v]) => <div key={l}><div className="lb" style={{ fontSize: 8 }}>{l}</div><b style={{ display: 'block', marginTop: 6 }}>{v}</b></div>)}
                        </div>
                        <button className="bt o" onClick={() => openModal(<RequestForm date={x.date} />)}>Solicitar correção</button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
