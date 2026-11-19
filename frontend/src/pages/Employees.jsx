import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { JO } from '../data/mock'
import { Avatar, Badge, Icon, PageHeader, Pagination } from '../components/ui'
import EmployeeForm from '../components/EmployeeForm'
import { exportPDF } from '../exportFiles'
import { carga, fmtCPF, fmtTel } from '../utils'

function Profile({ emp }) {
  const { records, journeys, openModal, closeModal } = useApp()
  const rs = records.filter((r) => r.n === emp.n).slice(0, 3)
  const j = journeys.find((x) => x.n === emp.j) || journeys[0]
  const info = [['E-mail', emp.e], ['Cadastro', emp.d], ['Jornada vinculada', `${emp.j} · ${carga(j)}/dia`], ['Cargo', emp.c], ['CPF', fmtCPF(emp.cpf) || '—'], ['Telefone', fmtTel(emp.tel) || '—']]
  return (
    <>
      <div className="row"><Avatar name={emp.n} solid size={44} /><div style={{ flex: 1 }}><h2>{emp.n}</h2><div className="sm">{emp.c}</div></div><Badge t={emp.s} /></div>
      <div className="fg" style={{ margin: '20px 0' }}>{info.map(([k, v]) => <div key={k}><div className="lb">{k}</div><div style={{ marginTop: 4 }}>{v}</div></div>)}</div>
      <div className="lb" style={{ marginBottom: 6 }}>Histórico recente</div>
      {rs.length ? <table><thead><tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Total</th></tr></thead><tbody>{rs.map((r, i) => <tr key={i}><td>{r.d.split('-').reverse().join('/')}</td><td>{r.en}</td><td>{r.sa}</td><td>{r.t}</td></tr>)}</tbody></table> : <div className="sm">Sem registros recentes.</div>}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={() => openModal(<EmployeeForm employee={emp} />)}><Icon n="edit" /> Editar</button>
        <button className="bt o" onClick={closeModal}>Fechar</button>
      </div>
    </>
  )
}

export default function Employees() {
  const { employees, setEmployees, openModal, log, toast, user } = useApp()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [st, setSt] = useState('')
  const [jo, setJo] = useState('')
  const [pg, setPg] = useState(1)
  const [menu, setMenu] = useState(null)
  useEffect(() => { const c = () => setMenu(null); document.addEventListener('click', c); return () => document.removeEventListener('click', c) }, [])

  const list = employees.filter((e) => (!q || (e.n + e.e).toLowerCase().includes(q.toLowerCase())) && (!st || e.s === st) && (!jo || e.j === jo))
  const pages = Math.max(1, Math.ceil(list.length / 5))
  const page = Math.min(pg, pages)
  const rows = list.slice((page - 1) * 5, page * 5)

  const toggle = (e) => { const s = e.s === 'Inativo' ? 'Ativo' : 'Inativo'; setEmployees((l) => l.map((x) => (x.id === e.id ? { ...x, s } : x))); log(user.name, 'Alterou o status de funcionário', `${e.n} · ${s}`, 'edit', 'Funcionários'); toast('Status atualizado') }
  const remove = (e) => { setEmployees((l) => l.filter((x) => x.id !== e.id)); toast(e.n + ' removido') }

  return (
    <>
      <PageHeader title="Funcionários" desc="Gerencie pessoas, vínculos e acessos da empresa."><button className="bt" onClick={() => openModal(<EmployeeForm />)}><Icon n="plus" /> Adicionar funcionário</button></PageHeader>
      <div className="sp" style={{ gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="ib" style={{ width: 290, justifyContent: 'flex-start' }}><Icon n="search" /><input style={{ width: '100%' }} value={q} placeholder="Buscar por nome ou e-mail" onChange={(e) => { setParams(e.target.value ? { q: e.target.value } : {}); setPg(1) }} /></div>
        <div className="row">
          <select className="fi" style={{ width: 140 }} value={st} onChange={(e) => { setSt(e.target.value); setPg(1) }}><option value="">Todos os status</option>{['Ativo', 'Trabalhando', 'Atrasado', 'Inativo'].map((s) => <option key={s}>{s}</option>)}</select>
          <select className="fi" style={{ width: 150 }} value={jo} onChange={(e) => { setJo(e.target.value); setPg(1) }}><option value="">Todas as jornadas</option>{JO.map((s) => <option key={s}>{s}</option>)}</select>
          <button className="bt o" onClick={() => { setParams({}); setSt(''); setJo(''); setPg(1) }}><Icon n="filter" /> Limpar</button>
        </div>
      </div>
      <div className="pn">
        <div className="sp" style={{ padding: '12px 16px', borderBottom: '1px solid var(--b)' }}>
          <span className="sm"><b style={{ color: 'var(--t)' }}>{rows.length}</b> de {list.length} funcionários</span>
          <button className="sm row" onClick={() => exportPDF('Funcionários', ['Nome', 'E-mail', 'Cargo', 'Jornada', 'Status', 'Cadastro'], list.map((e) => [e.n, e.e, e.c, e.j, e.s, e.d]), 'funcionarios.pdf')}><Icon n="dl" /> Exportar lista</button>
        </div>
        <div className="sc"><table><thead><tr><th>Funcionário</th><th>Cargo</th><th>Jornada</th><th>Status</th><th>Cadastro</th><th /></tr></thead><tbody>
          {rows.map((e) => (
            <tr key={e.id} className="k" onClick={() => openModal(<Profile emp={e} />)}>
              <td><span className="row"><Avatar name={e.n} /><span><b>{e.n}</b><div className="sm" style={{ fontSize: 10 }}>{e.e}</div></span></span></td>
              <td className="sm">{e.c}</td><td className="sm">{e.j}</td><td><Badge t={e.s} /></td><td className="sm">{e.d}</td>
              <td style={{ position: 'relative' }} onClick={(ev) => { ev.stopPropagation(); setMenu(menu === e.id ? null : e.id) }}>
                <button className="sm">•••</button>
                {menu === e.id && <div className="dd"><button onClick={() => openModal(<Profile emp={e} />)}>Ver perfil</button><button onClick={() => openModal(<EmployeeForm employee={e} />)}>Editar</button><button onClick={() => toggle(e)}>{e.s === 'Inativo' ? 'Ativar' : 'Inativar'}</button><button style={{ color: 'var(--r)' }} onClick={() => remove(e)}>Excluir</button></div>}
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="sm" style={{ textAlign: 'center', padding: 40 }}>Nenhum funcionário encontrado. Ajuste a busca ou os filtros.</td></tr>}
        </tbody></table></div>
        <Pagination page={page} pages={pages} onChange={setPg} label={`Página ${page} de ${pages}`} />
      </div>
    </>
  )
}
