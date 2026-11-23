import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { okm } from '../utils'
import { Icon } from '../components/ui'

const TXT = {
  login: ['Acesse sua conta', 'Entre com suas credenciais para continuar.'],
  cad: ['Crie sua conta', 'Configure o acesso inicial da sua empresa.'],
  rec: ['Recuperar senha', 'Informe seu e-mail para receber o link de redefinição.'],
  red: ['Redefinir senha', 'Defina uma nova senha de acesso.'],
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <label className="lb" style={{ display: 'block', margin: '14px 0 6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="fi" style={{ height: 40 }} type={type === 'password' && show ? 'text' : type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        {type === 'password' && <button type="button" style={{ position: 'absolute', right: 12, top: 12, color: '#858B91' }} onClick={() => setShow(!show)}><Icon n="eye" /></button>}
      </div>
    </>
  )
}

export default function Auth({ mode }) {
  const nav = useNavigate()
  const { setUser, toast, employees } = useApp()
  const [tab, setTab] = useState('admin')
  const [f, setF] = useState({ em: 'camila@novaobra.com.br', pw: 'demo12345', pw2: '', nm: '', emp: '' })
  const [err, setErr] = useState('')
  const set = (k) => (v) => setF({ ...f, [k]: v })

  const switchTab = (t) => { setTab(t); setErr(''); setF({ ...f, em: t === 'func' ? 'marina.costa@novaobra.com.br' : 'camila@novaobra.com.br' }) }

  const submit = () => {
    const bad = (t) => setErr(t)
    if (mode === 'login') {
      if (!okm(f.em)) return bad('Informe um e-mail corporativo válido.')
      if (f.pw.length < 6) return bad('A senha deve ter ao menos 6 caracteres.')
      const emp = employees.find((x) => x.e.toLowerCase() === f.em.toLowerCase())
      if (tab === 'func') {
        if (!emp) return bad('E-mail não cadastrado. Solicite seu acesso ao administrador.')
        if (emp.s === 'Inativo') return bad('Acesso desativado. Fale com o administrador.')
        setUser({ role: 'func', empId: emp.id, name: emp.n, email: emp.e }); toast('Bem-vindo(a), ' + emp.n.split(' ')[0]); return nav('/funcionario')
      }
      if (emp) return bad('Este e-mail pertence a um funcionário. Use a aba Funcionário.')
      setUser({ role: 'admin', name: 'Camila Mendes', email: f.em }); toast('Bem-vinda, Camila'); nav('/admin')
    } else if (mode === 'cad') {
      if (!okm(f.em)) return bad('Informe um e-mail corporativo válido.')
      if (!f.nm || !f.emp) return bad('Preencha nome completo e empresa.')
      if (f.pw.length < 6) return bad('A senha deve ter ao menos 6 caracteres.')
      setUser({ role: 'admin', name: f.nm, email: f.em }); toast('Conta criada com sucesso'); nav('/admin')
    } else if (mode === 'rec') {
      if (!okm(f.em)) return bad('Informe um e-mail válido.')
      toast('Link de redefinição enviado'); nav('/redefinir-senha')
    } else {
      if (f.pw.length < 6) return bad('A senha deve ter ao menos 6 caracteres.')
      if (f.pw !== f.pw2) return bad('As senhas não coincidem.')
      toast('Senha redefinida'); nav('/login')
    }
  }
  const btn = { login: ['arr', 'Entrar no sistema'], cad: ['arr', 'Criar conta'], rec: ['arr', 'Enviar link'], red: ['check', 'Redefinir senha'] }[mode]

  return (
    <div className="au" style={{ height: '100vh' }}>
      <div className="l">
        <div className="logo"><span className="lg"><Icon n="bars" /></span>CONTA <i>PONTO</i></div>
        <div>
          <div className="lb">Gestão de jornada</div>
          <h1>Precisão em cada<br />hora trabalhada.</h1>
          <p style={{ color: '#858B91', maxWidth: 340, lineHeight: 1.6 }}>Controle operacional, registros confiáveis e decisões mais claras para sua empresa.</p>
        </div>
        <div className="sp lb" style={{ fontSize: 9 }}><span>Ambiente seguro</span><span>v2.4.0</span></div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, strokeWidth: 0.15 }}><path d="M0 58 62 100" /></svg>
      </div>
      <div className="r">
        <form style={{ width: '100%', maxWidth: 380 }} onSubmit={(e) => { e.preventDefault(); submit() }}>
          <div className="lb" style={{ fontSize: 9 }}>Acesso / 01</div>
          <h1 style={{ fontWeight: 400, margin: '14px 0 8px', fontSize: 24 }}>{TXT[mode][0]}</h1>
          <p className="sm" style={{ marginBottom: 22 }}>{TXT[mode][1]}</p>
          {mode === 'login' && (
            <div className="tab">
              <button type="button" className={tab === 'admin' ? 'on' : ''} onClick={() => switchTab('admin')}>Administrador</button>
              <button type="button" className={tab === 'func' ? 'on' : ''} onClick={() => switchTab('func')}>Funcionário</button>
            </div>
          )}
          {mode !== 'red' && <Input label="E-mail corporativo" type="email" value={f.em} onChange={set('em')} />}
          {mode === 'cad' && <><Input label="Nome completo" value={f.nm} onChange={set('nm')} placeholder="Seu nome" /><Input label="Empresa" value={f.emp} onChange={set('emp')} placeholder="Razão social" /></>}
          {(mode === 'login' || mode === 'cad') && <Input label="Senha" type="password" value={f.pw} onChange={set('pw')} />}
          {mode === 'red' && <><Input label="Nova senha" type="password" value={f.pw} onChange={set('pw')} /><Input label="Confirmar senha" type="password" value={f.pw2} onChange={set('pw2')} /></>}
          <div className="er">{err}</div>
          {mode === 'login' && (
            <div className="sp" style={{ margin: '6px 0 14px', fontSize: 11 }}>
              <label><input type="checkbox" defaultChecked /> &nbsp;Manter conectado</label>
              <button type="button" onClick={() => nav('/recuperar-senha')}>Esqueci minha senha</button>
            </div>
          )}
          <button className="bt" type="submit" style={{ marginTop: mode === 'login' ? 0 : 14 }}><Icon n={btn[0]} /> {btn[1]}</button>
          {mode === 'login' && tab === 'func' && <p className="sm" style={{ marginTop: 8 }}>Use o e-mail cadastrado pelo administrador. Demonstração: marina.costa@novaobra.com.br com qualquer senha de 6+ caracteres.</p>}
          {mode === 'login' && tab === 'func' && <p style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: '#858B91' }}>O acesso do funcionário é criado pelo administrador da empresa.</p>}
          {mode === 'login' && tab === 'admin' && <p style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: '#858B91' }}>Ainda não possui acesso? <button type="button" style={{ textDecoration: 'underline', color: '#111315' }} onClick={() => nav('/cadastro')}>Criar conta</button></p>}
          {mode !== 'login' && mode !== 'red' && <p style={{ textAlign: 'center', marginTop: 18 }}><button type="button" style={{ textDecoration: 'underline', fontSize: 11 }} onClick={() => nav('/login')}>Voltar para o acesso</button></p>}
          <p className="lb" style={{ textAlign: 'center', marginTop: 32, fontSize: 9 }}>Ambiente de demonstração · dados fictícios</p>
        </form>
      </div>
    </div>
  )
}
