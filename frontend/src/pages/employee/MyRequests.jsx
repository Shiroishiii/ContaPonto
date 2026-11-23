import { Fragment, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Badge, Icon, PageHeader } from '../../components/ui'
import RequestForm from '../../components/RequestForm'

function Details({ r }) {
  const { closeModal } = useApp()
  return (
    <>
      <div className="sp"><div><div className="lb">Solicitação de correção</div><h2 style={{ marginTop: 8 }}>{r.tp} · {r.dr}</h2></div><Badge t={r.st} /></div>
      <div className="row" style={{ margin: '20px 0' }}>
        {[['Registro original', r.o], ['Horário solicitado', r.s]].map(([l, v], i) => (
          <Fragment key={l}><div className="pn" style={{ flex: 1, padding: 14, background: 'var(--s)' }}><div className="lb" style={{ fontSize: 9 }}>{l}</div><div className="num" style={{ fontSize: 24, marginTop: 8 }}>{v}</div></div>{i === 0 && <Icon n="arr" />}</Fragment>
        ))}
      </div>
      <div style={{ borderLeft: '1px solid var(--b)', padding: '2px 12px' }}><div className="lb" style={{ fontSize: 9 }}>Sua justificativa</div><div style={{ marginTop: 6 }}>“{r.j}”</div></div>
      {r.ob && <div style={{ borderLeft: '1px solid var(--b)', padding: '2px 12px', marginTop: 14 }}><div className="lb" style={{ fontSize: 9 }}>Observação do administrador</div><div style={{ marginTop: 6 }}>{r.ob}</div></div>}
      <div className="sm" style={{ marginTop: 14 }}>Enviada em {r.env}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="bt o" onClick={closeModal}>Fechar</button></div>
    </>
  )
}

export default function MyRequests() {
  const { me, requests, setRequests, openModal, log, toast } = useApp()
  const [menu, setMenu] = useState(null)
  useEffect(() => { const c = () => setMenu(null); document.addEventListener('click', c); return () => document.removeEventListener('click', c) }, [])
  const list = requests.filter((r) => r.n === me.n)

  const cancel = (r) => { setRequests((l) => l.filter((x) => x.id !== r.id)); log(me.n, 'Cancelou uma solicitação de correção', `${r.tp} em ${r.dr.slice(0, 6)}`, 'msg', 'Solicitações'); toast('Solicitação cancelada') }

  return (
    <>
      <PageHeader title="Minhas correções" desc="Acompanhe e solicite ajustes nos seus registros."><button className="bt" onClick={() => openModal(<RequestForm />)}><Icon n="plus" /> Nova solicitação</button></PageHeader>
      <div className="pn sc">
        <table>
          <thead><tr><th>Data do registro</th><th>Tipo</th><th>Horário solicitado</th><th>Enviada em</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="k" onClick={() => openModal(<Details r={r} />)}>
                <td className="sm">{r.dr}</td><td className="sm">{r.tp}</td><td className="sm">{r.s}</td><td className="sm">{r.env}</td><td><Badge t={r.st} /></td>
                <td style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setMenu(menu === r.id ? null : r.id) }}>
                  <button className="sm">•••</button>
                  {menu === r.id && <div className="dd"><button onClick={() => openModal(<Details r={r} />)}>Ver detalhes</button>{r.st === 'Pendente' && <button style={{ color: 'var(--r)' }} onClick={() => cancel(r)}>Cancelar solicitação</button>}</div>}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="sm" style={{ textAlign: 'center', padding: 40 }}>Você ainda não fez nenhuma solicitação. Use “Nova solicitação” para pedir um ajuste.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
