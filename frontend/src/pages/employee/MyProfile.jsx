import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { journeyOf } from '../../data/schedule'
import { Badge, Field, Icon, PageHeader, UserAvatar } from '../../components/ui'
import { usePhotoPicker } from '../../components/photo'
import { fem, fmtTel, maskCPF, MON3, okm, onlyDigits, validCPF } from '../../utils'

const digitsOnly = (e) => { if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault() }

function EditPersonal() {
  const { me, employees, setEmployees, user, setUser, log, closeModal, toast } = useApp()
  const [f, setF] = useState({ full: me.full || me.n, e: me.e, cpf: me.cpf || '', tel: me.tel || '' })
  const [err, setErr] = useState({})
  const E = ({ k }) => (err[k] ? <div className="fe">{err[k]}</div> : null)
  const save = () => {
    const x = {}
    if (f.full.trim().split(/\s+/).length < 2) x.full = 'Informe o nome completo.'
    if (!okm(f.e)) x.e = 'Informe um e-mail válido.'
    else if (employees.some((o) => o.id !== me.id && o.e.toLowerCase() === f.e.toLowerCase())) x.e = 'Este e-mail já está em uso.'
    if (!validCPF(f.cpf)) x.cpf = f.cpf.length < 11 ? 'O CPF deve ter 11 números.' : 'CPF inválido. Confira os números digitados.'
    else if (employees.some((o) => o.id !== me.id && o.cpf === f.cpf)) x.cpf = 'Este CPF já está cadastrado.'
    if (![10, 11].includes(f.tel.length)) x.tel = 'O telefone deve ter DDD + número (10 ou 11 números).'
    setErr(x)
    if (Object.keys(x).length) return
    setEmployees((l) => l.map((o) => (o.id === me.id ? { ...o, full: f.full.trim(), e: f.e, cpf: f.cpf, tel: f.tel } : o)))
    setUser({ ...user, email: f.e })
    log(me.n, 'Atualizou dados pessoais', me.n, 'edit', 'Funcionários')
    closeModal(); toast('Dados pessoais atualizados')
  }
  return (
    <>
      <h2>Editar dados pessoais</h2>
      <div className="sm" style={{ margin: '4px 0 16px' }}>Cargo, jornada e demais dados profissionais são administrados pela sua empresa.</div>
      <div className="fg">
        <Field label="Nome completo" w><input className="fi" value={f.full} onChange={(e) => setF({ ...f, full: e.target.value })} /><E k="full" /></Field>
        <Field label="E-mail" w><input className="fi" value={f.e} onChange={(e) => setF({ ...f, e: e.target.value })} /><E k="e" /></Field>
        <Field label="CPF"><input className="fi" inputMode="numeric" maxLength={11} placeholder="Somente números" value={f.cpf} onKeyDown={digitsOnly} onChange={(e) => setF({ ...f, cpf: onlyDigits(e.target.value, 11) })} /><E k="cpf" /></Field>
        <Field label="Telefone"><input className="fi" inputMode="numeric" maxLength={11} placeholder="DDD + número" value={f.tel} onKeyDown={digitsOnly} onChange={(e) => setF({ ...f, tel: onlyDigits(e.target.value, 11) })} /><E k="tel" /></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={save}><Icon n="check" /> Salvar</button>
      </div>
    </>
  )
}

function ChangePassword({ onDone }) {
  const { closeModal, toast } = useApp()
  const [f, setF] = useState({ a: '', n: '', c: '' })
  const [err, setErr] = useState('')
  const save = () => {
    if (f.a.length < 6) return setErr('Informe sua senha atual.')
    if (f.n.length < 6) return setErr('A nova senha deve ter ao menos 6 caracteres.')
    if (f.n === f.a) return setErr('A nova senha deve ser diferente da atual.')
    if (f.n !== f.c) return setErr('A confirmação não coincide com a nova senha.')
    onDone(); closeModal(); toast('Senha alterada com sucesso')
  }
  return (
    <>
      <h2>Alterar minha senha</h2>
      <div className="fg" style={{ marginTop: 16 }}>
        {[['Senha atual', 'a'], ['Nova senha', 'n'], ['Confirmar nova senha', 'c']].map(([l, k]) => <Field key={k} label={l} w><input className="fi" type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>)}
      </div>
      <div className="er">{err}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={save}>Salvar</button>
      </div>
    </>
  )
}

export default function MyProfile() {
  const { me, journeys, openModal } = useApp()
  const { photo, ref, onChange, pick, remove } = usePhotoPicker()
  const [pw, setPw] = useState('há 47 dias')
  const sched = journeyOf(me, journeys)
  const adm = (() => { const [d, m, y] = me.d.split('/'); return `${d} ${MON3[+m - 1]} ${y}` })()
  const row = (items) => <div className="fg" style={{ margin: '18px 0' }}>{items.map(([k, v]) => <div key={k}><div className="sm" style={{ fontSize: 10 }}>{k}</div><b style={{ display: 'block', marginTop: 6 }}>{v}</b></div>)}</div>
  const sec = (t, d, children) => <div className="pn pd" style={{ marginBottom: 16 }}><h2>{t}</h2><div className="sm" style={{ fontSize: 10, marginTop: 4 }}>{d}</div>{children}</div>

  return (
    <>
      <PageHeader title="Meu perfil" desc="Consulte seus dados pessoais e informações de trabalho."><button className="bt o" onClick={() => openModal(<EditPersonal />)}><Icon n="edit" /> Editar dados pessoais</button></PageHeader>
      <div className="g2 sl" style={{ gridTemplateColumns: '210px 1fr', alignItems: 'start' }}>
        <div className="pn">
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block' }}><UserAvatar size={56} /></div>
            <h2 style={{ marginTop: 14 }}>{me.n}</h2>
            <div className="sm" style={{ margin: '4px 0 12px' }}>{me.c}</div>
            <Badge t={fem(me.n) ? 'Funcionária ativa' : 'Funcionário ativo'} />
            <div style={{ marginTop: 14 }}>
              <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} />
              <button className="sm" style={{ textDecoration: 'underline' }} onClick={pick}>{photo ? 'Trocar foto' : 'Adicionar foto'}</button>
              {photo && <button className="sm" style={{ textDecoration: 'underline', marginLeft: 12 }} onClick={remove}>Remover</button>}
            </div>
          </div>
          {[['Matrícula', me.mat], ['Admissão', adm]].map(([k, v]) => <div key={k} style={{ borderTop: '1px solid var(--b)', padding: 16 }}><div className="lb" style={{ fontSize: 8 }}>{k}</div><b style={{ display: 'block', marginTop: 8 }}>{v}</b></div>)}
        </div>
        <div>
          {sec('Dados pessoais', 'Informações de contato vinculadas à conta.', row([['Nome completo', me.full || me.n], ['CPF', maskCPF(me.cpf)], ['E-mail', me.e], ['Telefone', fmtTel(me.tel) || '—']]))}
          {sec('Informações profissionais', 'Dados administrados pela sua empresa.', row([['Cargo', me.c], ['Departamento', me.dep], ['Jornada', me.j], ['Horário', sched.label]]))}
          {sec('Segurança da conta', `Última alteração de senha ${pw}.`, <button className="bt o" style={{ marginTop: 12 }} onClick={() => openModal(<ChangePassword onDone={() => setPw('hoje')} />)}>Alterar minha senha</button>)}
        </div>
      </div>
    </>
  )
}
