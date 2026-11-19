import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { JO } from '../data/mock'
import { okm, onlyDigits, validCPF } from '../utils'
import { Field, Icon } from './ui'

export default function EmployeeForm({ employee }) {
  const { employees, setEmployees, setRecords, log, closeModal, toast, user } = useApp()
  const [f, setF] = useState(employee ? { cpf: '', tel: '', ...employee } : { n: '', e: '', c: '', j: JO[0], s: 'Ativo', cpf: '', tel: '' })
  const [err, setErr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const digits = (k, max) => (e) => setF({ ...f, [k]: onlyDigits(e.target.value, max) })
  const blockNonDigit = (e) => { if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault() }

  const save = () => {
    const x = {}
    if (!f.n.trim()) x.n = 'Informe o nome completo.'
    if (!okm(f.e)) x.e = 'Informe um e-mail válido.'
    if (!f.c.trim()) x.c = 'Informe o cargo.'
    if (!validCPF(f.cpf)) x.cpf = f.cpf.length < 11 ? 'O CPF deve ter 11 números.' : 'CPF inválido. Confira os números digitados.'
    else if (employees.some((o) => o.cpf === f.cpf && o.id !== employee?.id)) x.cpf = 'Este CPF já está cadastrado.'
    if (![10, 11].includes(f.tel.length)) x.tel = 'O telefone deve ter DDD + número (10 ou 11 números).'
    setErr(x)
    if (Object.keys(x).length) return
    if (employee) {
      setEmployees((l) => l.map((o) => (o.id === employee.id ? { ...o, ...f } : o)))
      log(user.name, 'Atualizou dados de funcionário', `${f.n} · ${f.c}`, 'edit', 'Funcionários')
    } else {
      setEmployees((l) => [{ ...f, id: Date.now(), d: new Date().toLocaleDateString('pt-BR') }, ...l])
      setRecords((l) => [{ n: f.n, d: '2025-06-18', en: '—', iv: '—', rt: '—', sa: '—', t: '—', df: '—', s: 'Incompleto' }, ...l])
      log(user.name, 'Cadastrou um novo funcionário', `${f.n} · ${f.c}`, 'users', 'Funcionários')
    }
    closeModal(); toast('Funcionário salvo')
  }
  const E = ({ k }) => (err[k] ? <div className="fe">{err[k]}</div> : null)

  return (
    <>
      <h2>{employee ? 'Editar' : 'Adicionar'} funcionário</h2>
      <div className="sm" style={{ marginBottom: 16 }}>Dados de demonstração.</div>
      <div className="lb" style={{ marginBottom: 10 }}>Dados pessoais</div>
      <div className="fg">
        <Field label="Nome completo" w><input className="fi" value={f.n} onChange={set('n')} /><E k="n" /></Field>
        <Field label="CPF"><input className="fi" inputMode="numeric" maxLength={11} placeholder="Somente números" value={f.cpf} onKeyDown={blockNonDigit} onChange={digits('cpf', 11)} /><E k="cpf" /></Field>
        <Field label="Telefone"><input className="fi" inputMode="numeric" maxLength={11} placeholder="DDD + número" value={f.tel} onKeyDown={blockNonDigit} onChange={digits('tel', 11)} /><E k="tel" /></Field>
        <Field label="E-mail corporativo" w><input className="fi" value={f.e} onChange={set('e')} /><E k="e" /></Field>
      </div>
      <div className="lb" style={{ margin: '18px 0 10px' }}>Informações profissionais</div>
      <div className="fg">
        <Field label="Cargo"><input className="fi" value={f.c} onChange={set('c')} /><E k="c" /></Field>
        <Field label="Jornada"><select className="fi" value={f.j} onChange={set('j')}>{JO.map((j) => <option key={j}>{j}</option>)}</select></Field>
        <Field label="Status"><select className="fi" value={f.s === 'Inativo' ? 'Inativo' : 'Ativo'} onChange={set('s')}><option>Ativo</option><option>Inativo</option></select></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={save}><Icon n="check" /> Salvar</button>
      </div>
    </>
  )
}
