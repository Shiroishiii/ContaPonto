import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useNow, stepIndex, workedMin, BADGE } from '../../data/punch'
import { journeyOf, monthDays } from '../../data/schedule'
import { Badge, Icon } from '../../components/ui'
import Track from '../../components/Track'
import { hm, longDay, pad, sgn } from '../../utils'

const NEXT = ['Registrar entrada', 'Iniciar intervalo', 'Retornar do intervalo', 'Registrar saída', 'Jornada finalizada']

export default function EmpDashboard() {
  const { me, punch, journeys, requests } = useApp()
  const nav = useNavigate()
  const now = useNow()
  const sched = journeyOf(me, journeys)
  const idx = stepIndex(punch)
  const worked = workedMin(punch, now.h * 60 + now.m)
  const first = me.n.split(' ')[0]
  const pend = requests.filter((r) => r.n === me.n && r.st === 'Pendente')

  const days = monthDays(me, 2025, 5, sched)
  const past = [16, 17].map((d) => days.find((x) => x.d === d))
  const bars = [past[0]?.tot ?? 0, past[1]?.tot ?? 0, worked, 0, 0]
  const saldo = past.reduce((a, x) => a + (x && x.tot != null ? x.tot - sched.min : 0), 0)
  const items = ['Entrada', 'Início do intervalo', 'Retorno', 'Saída prevista'].map((label, i) => ({
    label: i === 3 && punch[3] ? 'Saída' : label, time: punch[i] || (i === 3 ? sched.s : '—'), state: punch[i] ? 'done' : i === idx ? 'cur' : 'pend',
  }))

  return (
    <>
      <div className="ph">
        <div><h1 style={{ fontSize: 26 }}>Olá, {first}.</h1><div className="sm" style={{ fontSize: 12 }}>Quarta-feira, 18 de junho de 2025.</div></div>
        <Badge t={BADGE[idx]} />
      </div>
      <div className="g2">
        <div className="pn pd" style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: 270 }}>
          <div className="lb" style={{ fontSize: 9 }}>Sua jornada hoje</div>
          <div className="sp na" style={{ flex: 1, alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div><div className="sm">Próxima ação</div><div style={{ fontSize: 28, margin: '10px 0' }}>{NEXT[idx]}</div><div className="sm" style={{ fontSize: 10 }}>Horário previsto: {sched.s}</div></div>
            <div style={{ textAlign: 'right' }}><div className="num" style={{ fontSize: 34 }}>{pad((worked / 60) | 0)}<small style={{ fontSize: 13 }}>h</small> {pad(worked % 60)}<small style={{ fontSize: 13 }}>min</small></div><div className="lb" style={{ fontSize: 8 }}>trabalhados</div></div>
          </div>
          <div><button className="bt" onClick={() => nav('/funcionario/registrar-ponto')}><Icon n="clock" /> Ir para registro de ponto</button></div>
        </div>
        <div className="pn pd">
          <div className="sp"><span className="lb" style={{ fontSize: 9 }}>Semana atual</span><b style={{ fontSize: 17 }}>{(bars.reduce((a, b) => a + b, 0) / 60) | 0}h {pad(bars.reduce((a, b) => a + b, 0) % 60)}min</b></div>
          <h2 style={{ margin: '8px 0 18px' }}>Resumo semanal</h2>
          <div className="wk">{bars.map((v, i) => <div key={i}><i style={{ height: Math.min(100, (v / sched.min) * 100) + '%' }} /></div>)}</div>
          <div className="wk" style={{ height: 'auto', margin: '8px 0 14px' }}>{['S', 'T', 'Q', 'Q', 'S'].map((d, i) => <span key={i} className="sm" style={{ textAlign: 'center', background: 'none' }}>{d}</span>)}</div>
          <div className="sp sm" style={{ borderTop: '1px solid var(--b)', paddingTop: 12 }}><span>Previstas <b style={{ color: 'var(--t)' }}>{hm(sched.min * 5)}</b></span><span>Saldo <b style={{ color: `var(--${saldo < 0 ? 'a' : 'g'})` }}>{sgn(saldo)}</b></span></div>
        </div>
      </div>
      <div className="g2">
        <div className="pn pd">
          <div className="sp"><span className="lb" style={{ fontSize: 9 }}>Hoje</span><button className="sm" onClick={() => nav('/funcionario/historico')}>Ver histórico</button></div>
          <h2 style={{ margin: '8px 0 24px' }}>Registros da jornada</h2>
          <Track items={items} />
        </div>
        <div className="pn pd">
          <div className="lb" style={{ fontSize: 9 }}>Solicitações</div>
          <h2 style={{ fontSize: 17, fontWeight: 500, margin: '14px 0 10px' }}>{pend.length ? `${pend.length} ${pend.length > 1 ? 'correções' : 'correção'} em análise` : 'Nenhuma correção pendente'}</h2>
          <div className="sm" style={{ marginBottom: 22 }}>{pend.length ? `Sua solicitação de ${longDay(pend[pend.length - 1].dr)} está aguardando avaliação.` : 'Você não tem solicitações aguardando avaliação.'}</div>
          <button className="row" style={{ fontWeight: 600, fontSize: 12 }} onClick={() => nav('/funcionario/correcoes')}>{pend.length ? 'Acompanhar solicitação' : 'Ver solicitações'} <Icon n="arr" /></button>
        </div>
      </div>
    </>
  )
}
