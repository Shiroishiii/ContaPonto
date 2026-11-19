import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Avatar, Badge, Icon, PageHeader } from '../components/ui'

const TABS = [['pend', 'Pendentes', 'Pendente'], ['apr', 'Aprovadas', 'Aprovada'], ['rej', 'Rejeitadas', 'Rejeitada']]

export default function Requests() {
  const { requests, setRequests, log, toast, user } = useApp()
  const [tab, setTab] = useState('pend')
  const [sel, setSel] = useState(0)
  const [obs, setObs] = useState('')
  const status = TABS.find((t) => t[0] === tab)[2]
  const list = requests.filter((r) => r.st === status)
  const r = list.find((x) => x.id === sel) || list[0]
  const pend = requests.filter((x) => x.st === 'Pendente').length

  const decide = (st) => {
    setRequests((l) => l.map((x) => (x.id === r.id ? { ...x, st, ob: obs } : x)))
    log(user.name, `${st === 'Aprovada' ? 'Aprovou' : 'Rejeitou'} uma solicitação de correção`, `${r.n} · Registro de ${r.tp.toLowerCase()} em ${r.dr.slice(0, 6)}`, 'msg', 'Solicitações')
    setObs(''); setSel(0); toast('Solicitação ' + st.toLowerCase())
  }

  return (
    <>
      <PageHeader title="Solicitações de correção" desc="Analise ajustes solicitados pelos funcionários.">
        <div className="pn row" style={{ gap: 0 }}>
          {TABS.map(([k, label]) => (
            <button key={k} className="ib" style={{ border: 0, height: 30, ...(tab === k ? { background: 'var(--s)', fontWeight: 600 } : { color: 'var(--m)' }) }} onClick={() => { setTab(k); setSel(0) }}>
              {label} {k === 'pend' && pend > 0 && <span className="bd">{pend}</span>}
            </button>
          ))}
        </div>
      </PageHeader>
      <div className="g2 sl" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>
        <div className="pn">
          {list.map((x) => (
            <button key={x.id} className="row" style={{ width: '100%', padding: '12px 14px', borderBottom: '1px solid var(--b)', textAlign: 'left', ...(x === r ? { borderLeft: '2px solid var(--t)', background: 'var(--s)' } : {}) }} onClick={() => setSel(x.id)}>
              <Avatar name={x.n} /><span style={{ flex: 1 }}><b>{x.n}</b><div className="sm" style={{ fontSize: 10 }}>{x.tp} · {x.dr.slice(0, 6)}</div></span><Badge t={x.st} />
            </button>
          ))}
          {!list.length && <div className="sm" style={{ padding: 24 }}>Nenhuma solicitação nesta aba.</div>}
        </div>
        {r ? (
          <div className="pn pd">
            <div className="sp"><div><div className="lb">Análise de solicitação</div><h2 style={{ fontSize: 20, fontWeight: 500, margin: '10px 0 4px' }}>{r.n}</h2><div className="sm">{r.dr} · {r.sol}</div></div><Badge t={r.st} /></div>
            <div className="row" style={{ margin: '20px 0', borderTop: '1px solid var(--b)', paddingTop: 20 }}>
              {[['Registro original', r.o], ['Alteração solicitada', r.s]].map(([l, v], i) => (
                <div key={l} style={{ display: 'contents' }}>
                  <div className="pn" style={{ flex: 1, padding: 16, background: 'var(--s)' }}><div className="lb" style={{ fontSize: 9 }}>{l}</div><div className="sm">{r.tp}</div><div className="num" style={{ fontSize: 26, marginTop: 8 }}>{v}</div></div>
                  {i === 0 && <Icon n="arr" />}
                </div>
              ))}
            </div>
            <div style={{ borderLeft: '1px solid var(--b)', padding: '2px 12px', marginBottom: 18 }}><div className="lb" style={{ fontSize: 9 }}>Justificativa do funcionário</div><div style={{ marginTop: 6 }}>“{r.j}”</div></div>
            {r.st === 'Pendente' ? (
              <>
                <label className="lb" style={{ display: 'block', marginBottom: 6 }}>Observação administrativa</label>
                <textarea className="fi" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Adicione uma observação sobre a decisão (opcional)" />
                <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
                  <button className="bt r" onClick={() => decide('Rejeitada')}><Icon n="x" /> Rejeitar solicitação</button>
                  <button className="bt" onClick={() => decide('Aprovada')}><Icon n="check" /> Aprovar alteração</button>
                </div>
              </>
            ) : <div className="sm">Decisão: {r.st.toLowerCase()}.{r.ob ? ' Observação: ' + r.ob : ''}</div>}
          </div>
        ) : <div className="pn pd sm">Selecione uma solicitação para analisar.</div>}
      </div>
    </>
  )
}
