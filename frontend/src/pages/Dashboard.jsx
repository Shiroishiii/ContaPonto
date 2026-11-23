import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Avatar, Badge, Icon, PageHeader } from '../components/ui'
import EmployeeForm from '../components/EmployeeForm'
import JourneyForm from '../components/JourneyForm'

const PERIODS = [['Hoje, 18 jun', 1, 472], ['Ontem, 17 jun', 0.96, 455], ['Últimos 7 dias', 6.4, 3071], ['Este mês', 17, 8112]]
const BARS = [30, 12, 60, 22, 95, 70, 100, 52, 65, 40, 45, 22, 58, 20, 78, 48, 95, 52, 62, 45, 30, 14]
const RECENT = [['Marina Costa', 'Entrada', '08:32', '8 min. atraso'], ['Rafael Oliveira', 'Retorno do Intervalo', '13:07', 'No horário'], ['Juliana Martins', 'Início do Intervalo', '12:03', 'No horário'], ['Lucas Ferreira', 'Entrada', '08:14', 'No horário']]
const SITUACAO = [['Trabalhando', 84, 'g'], ['Em intervalo', 18, 'a'], ['Ainda não iniciou', 11, 'r'], ['Jornada concluída', 15, 'n']]

export default function Dashboard() {
  const { adminRequests: requests, openModal } = useApp()
  const nav = useNavigate()
  const [per, setPer] = useState(0)
  const [, factor, total] = PERIODS[per]
  const pend = requests.filter((r) => r.st === 'Pendente').length
  const kpis = [['Funcionários ativos', 128, '+4 este mês', 'g'], ['Trabalhando agora', 84, '65,6% do quadro', 'g'], ['Sem entrada', 11, 'Esperados até 09:00', 'a'], ['Correções pendentes', String(pend).padStart(2, '0'), pend ? '1 nova hoje' : 'Tudo analisado', 'r']]
  const shortcuts = [['users', 'Novo funcionário', 'Adicionar ao quadro', () => openModal(<EmployeeForm />)], ['cal', 'Criar jornada', 'Configurar horários', () => openModal(<JourneyForm index={-1} />)], ['msg', 'Analisar correções', `${pend} aguardando revisão`, () => nav('/admin/solicitacoes')]]

  return (
    <>
      <PageHeader title="Visão geral" desc="Operação de hoje, quarta-feira, 18 de junho.">
        <select className="fi" style={{ width: 150 }} value={per} onChange={(e) => setPer(+e.target.value)}>{PERIODS.map((p, i) => <option key={p[0]} value={i}>{p[0]}</option>)}</select>
        <button className="bt" onClick={() => openModal(<EmployeeForm />)}><Icon n="plus" /> Adicionar funcionário</button>
      </PageHeader>
      <div className="pn kp">
        {kpis.map((k) => (
          <div key={k[0]}>
            <div className="sp sm"><span style={{ color: 'var(--t)' }}>{k[0]}</span><i className="sq" style={{ background: `var(--${k[3] === 'n' ? 'm' : k[3]})` }} /></div>
            <div className="num">{k[1]}</div><div className="sm" style={{ fontSize: 10 }}>{k[2]}</div>
          </div>
        ))}
      </div>
      <div className="g2">
        <div className="pn pd">
          <div className="sp"><div><div className="lb">Movimentação</div><h2 style={{ marginTop: 6 }}>Registros por horário</h2></div><span className="sm">▬ Entradas &nbsp;▬ Saídas</span></div>
          <div className="row" style={{ marginTop: 12, alignItems: 'baseline' }}><span className="num" style={{ fontSize: 28 }}>{total}</span><span className="sm">registros {per ? 'no período' : 'hoje'}<br />+8,4% vs. média</span></div>
          <div className="bars">{BARS.map((v, i) => <i key={i} className={i === 4 ? 'h' : ''} style={{ height: v + '%' }} title={`${7 + (i >> 1)}h · ${Math.round((v * factor) / 2 + 4)} registros`} />)}</div>
          <div className="sp sm" style={{ marginTop: 6 }}>{['7h', '9h', '11h', '13h', '15h', '17h'].map((h) => <span key={h}>{h}</span>)}</div>
        </div>
        <div className="pn" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="pd" style={{ flex: 1 }}>
            <div className="sp"><span className="lb">Agora</span><button className="sm" onClick={() => nav('/admin/registros')}>Ver registros →</button></div>
            <h2 style={{ margin: '6px 0 20px' }}>Situação da equipe</h2>
            {SITUACAO.map((s) => (
              <div key={s[0]} className="row" style={{ marginBottom: 16, fontSize: 11 }}>
                <span style={{ width: 130 }}><i className="sq" style={{ background: `var(--${s[2] === 'n' ? 'm' : s[2]})` }} />{s[0]}</span>
                <i style={{ flex: 1, height: 2, background: 'var(--b)', position: 'relative' }}><i style={{ position: 'absolute', left: 0, top: 0, height: 2, width: s[1] + '%', background: 'var(--m)' }} /></i><b>{s[1]}</b>
              </div>
            ))}
          </div>
          <div className="sp pd" style={{ borderTop: '1px solid var(--b)', padding: '14px 20px' }}>
            <span className="lb">Horas no período</span>
            <span><b style={{ fontSize: 20 }}>{Math.round(9842 * factor).toLocaleString('pt-BR')}</b><span className="sm">h</span> <span style={{ color: 'var(--g)', fontSize: 10 }}>+2,8%</span></span>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="pn">
          <div className="sp" style={{ padding: '20px 20px 12px' }}><div><div className="lb">Tempo real</div><h2 style={{ marginTop: 6 }}>Registros recentes</h2></div><button className="sm" onClick={() => nav('/admin/registros')}>Visualizar todos</button></div>
          <div className="sc"><table><thead><tr><th>Funcionário</th><th>Registro</th><th>Horário</th><th>Situação</th></tr></thead><tbody>
            {RECENT.map((r) => <tr key={r[0]} className="k" onClick={() => nav('/admin/registros')}><td><span className="row"><Avatar name={r[0]} /><b>{r[0]}</b></span></td><td className="sm">{r[1]}</td><td>{r[2]}</td><td><Badge t={r[3]} /></td></tr>)}
          </tbody></table></div>
        </div>
        <div className="pn pd">
          <div className="lb">Ações rápidas</div><h2 style={{ margin: '6px 0 14px' }}>Atalhos operacionais</h2>
          {shortcuts.map((a) => (
            <button key={a[1]} className="row" style={{ width: '100%', padding: '12px 0', borderTop: '1px solid var(--b)', textAlign: 'left' }} onClick={a[3]}>
              <span className="ic"><Icon n={a[0]} /></span><span style={{ flex: 1 }}><b>{a[1]}</b><div className="sm">{a[2]}</div></span><Icon n="r" />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
