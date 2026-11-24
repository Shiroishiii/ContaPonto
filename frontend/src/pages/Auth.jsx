import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { okm } from '../utils'
import { Icon } from '../components/ui'

const TXT = {
  login: ['Acesse sua conta', 'Entre com suas credenciais para continuar.'],
  cad: ['Crie sua conta', 'Configure o acesso inicial da sua empresa.'],
  rec: ['Recuperar senha', 'A recuperação ainda não está disponível pela API.'],
  red: ['Redefinir senha', 'A redefinição ainda não está disponível pela API.'],
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
  const { signIn, signUp, toast } = useApp()
  const [f, setF] = useState({ em: '', pw: '', pw2: '', nm: '', emp: '', cnpj: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF({ ...f, [k]: v })


  const submit = async () => {
    const bad = (t) => setErr(t)
    setErr(''); setBusy(true)
    try {
    if (mode === 'login') {
      if (!okm(f.em)) return bad('Informe um e-mail corporativo válido.')
      if (!f.pw) return bad('Informe sua senha.')
      const logged = await signIn({ email: f.em, password: f.pw })
      toast('Bem-vindo(a), ' + logged.name.split(' ')[0]); nav(logged.role === 'ADMIN' ? '/admin' : '/funcionario')
    } else if (mode === 'cad') {
      if (!okm(f.em)) return bad('Informe um e-mail corporativo válido.')
      if (!f.nm || !f.emp) return bad('Preencha nome completo e empresa.')
      if (f.pw.length < 8) return bad('A senha deve ter ao menos 8 caracteres.')
      const created = await signUp({ adminName: f.nm, companyName: f.emp, cnpj: f.cnpj || undefined, email: f.em, password: f.pw })
      toast('Conta criada com sucesso'); nav(created.role === 'ADMIN' ? '/admin' : '/funcionario')
    } else if (mode === 'rec') {
      return bad('A recuperação de senha ainda não está disponível no servidor. Entre em contato com o administrador da empresa.')
    } else {
      return bad('A redefinição de senha ainda não está disponível no servidor.')
    }
    } catch (error) { bad(error.message) } finally { setBusy(false) }
  }
  const btn = { login: ['arr', 'Entrar no sistema'], cad: ['arr', 'Criar conta'], rec: ['arr', 'Ver disponibilidade'], red: ['check', 'Ver disponibilidade'] }[mode]

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
          {mode !== 'red' && <Input label="E-mail corporativo" type="email" value={f.em} onChange={set('em')} />}
          {mode === 'cad' && <><Input label="Nome completo" value={f.nm} onChange={set('nm')} placeholder="Seu nome" /><Input label="Empresa" value={f.emp} onChange={set('emp')} placeholder="Razão social" /><Input label="CNPJ (opcional)" value={f.cnpj} onChange={set('cnpj')} placeholder="Somente números" /></>}
          {(mode === 'login' || mode === 'cad') && <Input label="Senha" type="password" value={f.pw} onChange={set('pw')} />}
          {mode === 'red' && <><Input label="Nova senha" type="password" value={f.pw} onChange={set('pw')} /><Input label="Confirmar senha" type="password" value={f.pw2} onChange={set('pw2')} /></>}
          <div className="er">{err}</div>
          {mode === 'login' && (
            <div className="sp" style={{ margin: '6px 0 14px', fontSize: 11 }}>
              <span className="sm">Sessão protegida por token</span>
              <button type="button" onClick={() => nav('/recuperar-senha')}>Esqueci minha senha</button>
            </div>
          )}
          <button className="bt" disabled={busy} type="submit" style={{ marginTop: mode === 'login' ? 0 : 14 }}><Icon n={btn[0]} /> {busy ? 'Aguarde…' : btn[1]}</button>
          {mode === 'login' && <p style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: '#858B91' }}>Ainda não possui acesso? <button type="button" style={{ textDecoration: 'underline', color: '#111315' }} onClick={() => nav('/cadastro')}>Criar conta</button></p>}
          {mode !== 'login' && mode !== 'red' && <p style={{ textAlign: 'center', marginTop: 18 }}><button type="button" style={{ textDecoration: 'underline', fontSize: 11 }} onClick={() => nav('/login')}>Voltar para o acesso</button></p>}
          <p className="lb" style={{ textAlign: 'center', marginTop: 32, fontSize: 9 }}>Acesso seguro · dados persistidos</p>
        </form>
      </div>
    </div>
  )
}
