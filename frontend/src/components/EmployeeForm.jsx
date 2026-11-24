import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { createEmployee, updateEmployee } from '../services/employeeService'
import { Field, Icon } from './ui'
import { okm, onlyDigits, validCPF } from '../utils'

export default function EmployeeForm({ employee }) {
  const { journeys, token, refreshData, closeModal, toast } = useApp()
  const assignment = employee?.scheduleAssignments?.find((x) => !x.endDate)
  const [f, setF] = useState({ fullName: employee?.fullName || employee?.n || '', email: employee?.user?.email || employee?.e || '', position: employee?.position || employee?.c || '', cpf: employee?.cpf || '', phone: employee?.phone || employee?.tel || '', employeeCode: employee?.employeeCode || employee?.mat || '', scheduleId: assignment?.scheduleId || employee?.scheduleId || '', scheduleStartDate: new Date().toISOString().slice(0, 10), admissionDate: employee?.admissionDate ? new Date(employee.admissionDate).toISOString().slice(0, 10) : '', password: '' })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setF((old) => ({ ...old, [key]: event.target.value }))
  const digits = (key, max) => (event) => setF((old) => ({ ...old, [key]: onlyDigits(event.target.value, max) }))
  const save = async () => {
    const errors = {}
    if (f.fullName.trim().length < 3) errors.fullName = 'Informe o nome completo.'
    if (!okm(f.email)) errors.email = 'Informe um e-mail válido.'
    if (!f.employeeCode.trim()) errors.employeeCode = 'Informe a matrícula.'
    if (!employee && f.password.length < 8) errors.password = 'A senha inicial deve ter ao menos 8 caracteres.'
    if (f.cpf && !validCPF(f.cpf)) errors.cpf = 'CPF inválido.'
    if (f.phone && ![10, 11].includes(f.phone.length)) errors.phone = 'Use DDD + número (10 ou 11 dígitos).'
    if (!employee && f.scheduleId && !f.scheduleStartDate) errors.scheduleStartDate = 'Informe quando a jornada começa.'
    setErr(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      const body = { fullName: f.fullName.trim(), email: f.email.trim(), employeeCode: f.employeeCode.trim(), cpf: f.cpf || undefined, phone: f.phone || undefined, position: f.position || undefined, admissionDate: f.admissionDate || undefined }
      if (employee) await updateEmployee(employee.id, body, token)
      else await createEmployee({ ...body, password: f.password, ...(f.scheduleId ? { scheduleId: Number(f.scheduleId), scheduleStartDate: f.scheduleStartDate } : {}) }, token)
      await refreshData()
      closeModal(); toast(employee ? 'Funcionário atualizado' : 'Funcionário cadastrado')
    } catch (error) { setErr({ form: error.message }) } finally { setBusy(false) }
  }
  const E = ({ k }) => err[k] ? <div className="fe">{err[k]}</div> : null
  return <>
    <h2>{employee ? 'Editar' : 'Adicionar'} funcionário</h2>
    <div className="sm" style={{ marginBottom: 16 }}>{employee ? 'Atualize os dados vinculados à conta do funcionário.' : 'A conta de acesso será criada junto com o cadastro.'}</div>
    <div className="lb" style={{ marginBottom: 10 }}>Dados pessoais</div>
    <div className="fg">
      <Field label="Nome completo" w><input className="fi" value={f.fullName} onChange={set('fullName')} /><E k="fullName" /></Field>
      <Field label="CPF"><input className="fi" inputMode="numeric" maxLength={11} value={f.cpf} onChange={digits('cpf', 11)} /><E k="cpf" /></Field>
      <Field label="Telefone"><input className="fi" inputMode="numeric" maxLength={11} value={f.phone} onChange={digits('phone', 11)} /><E k="phone" /></Field>
      <Field label="E-mail corporativo" w><input className="fi" type="email" value={f.email} onChange={set('email')} /><E k="email" /></Field>
    </div>
    <div className="lb" style={{ margin: '18px 0 10px' }}>Informações profissionais</div>
    <div className="fg">
      <Field label="Cargo"><input className="fi" value={f.position} onChange={set('position')} /></Field>
      <Field label="Matrícula"><input className="fi" value={f.employeeCode} onChange={set('employeeCode')} /><E k="employeeCode" /></Field>
      {!employee && <Field label="Senha inicial"><input className="fi" type="password" value={f.password} onChange={set('password')} /><E k="password" /></Field>}
      {!employee && <Field label="Jornada"><select className="fi" value={f.scheduleId} onChange={set('scheduleId')}><option value="">Nenhuma</option>{journeys.filter((j) => j.isActive).map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}</select></Field>}
      {!employee && f.scheduleId && <Field label="Início da jornada"><input className="fi" type="date" value={f.scheduleStartDate} onChange={set('scheduleStartDate')} /><E k="scheduleStartDate" /></Field>}
      <Field label="Data de admissão"><input className="fi" type="date" value={f.admissionDate} onChange={set('admissionDate')} /></Field>
    </div>
    <div className="er">{err.form}</div>
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="bt o" onClick={closeModal}>Cancelar</button><button className="bt" disabled={busy} onClick={save}><Icon n="check" /> {busy ? 'Salvando…' : 'Salvar'}</button></div>
  </>
}
