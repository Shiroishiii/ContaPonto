import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Icon, PageHeader, Toggle, UserAvatar } from '../components/ui'
import { usePhotoPicker } from '../components/photo'

const SECTIONS = [['c1', 'Dados da empresa', 'brief'], ['c2', 'Aparência', 'sun'], ['c3', 'Preferências', 'gear'], ['c4', 'Minha conta', 'user']]
const PREFS = [['Notificar solicitações de correção', 'Receba um aviso sempre que houver uma nova solicitação.'], ['Alertar registros em atraso', 'Alerte após 15 minutos do horário previsto.'], ['Enviar resumo semanal por e-mail', 'Resumo enviado toda segunda-feira às 08:00.']]

function PasswordModal() {
  const { closeModal, toast } = useApp()
  const [v, setV] = useState('')
  const [err, setErr] = useState('')
  return (
    <>
      <h2>Alterar senha</h2>
      <div className="fg" style={{ marginTop: 16 }}><div className="w"><label>Nova senha</label><input className="fi" type="password" value={v} onChange={(e) => setV(e.target.value)} /></div></div>
      <div className="er">{err}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={() => (v.length < 6 ? setErr('Mínimo de 6 caracteres.') : (closeModal(), toast('Senha alterada')))}>Salvar</button>
      </div>
    </>
  )
}

export default function Settings() {
  const { theme, setTheme, user, setUser, toast, openModal } = useApp()
  const { photo, ref: fileRef, onChange: onPhoto, remove } = usePhotoPicker()
  const [prefs, setPrefs] = useState([true, true, false])
  const go = (id) => document.getElementById(id).scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <PageHeader title="Configurações" desc="Dados da empresa, aparência e preferências do sistema."><button className="bt" onClick={() => toast('Alterações salvas')}><Icon n="check" /> Salvar alterações</button></PageHeader>
      <div className="g2 sl" style={{ gridTemplateColumns: '190px 1fr', alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 0 }}>{SECTIONS.map(([id, l, i]) => <button key={id} className="nv" onClick={() => go(id)}><Icon n={i} />{l}</button>)}</div>
        <div>
          <div className="pn pd" id="c1" style={{ marginBottom: 16 }}>
            <h2>Dados da empresa</h2><div className="sm" style={{ margin: '4px 0 16px' }}>Informações exibidas nos documentos e relatórios.</div>
            <div className="sp" style={{ background: 'var(--s)', padding: 12, marginBottom: 16 }}><span className="row"><b>NO</b><span className="sm">Marca da empresa</span></span><button className="bt o" onClick={() => toast('Seleção de logotipo disponível na versão final')}>Alterar</button></div>
            <div className="fg">
              <div><label className="lb">Razão social</label><input className="fi" defaultValue="Nova Obra Engenharia Ltda." /></div>
              <div><label className="lb">CNPJ</label><input className="fi" defaultValue="12.345.678/0001-90" /></div>
              <div><label className="lb">E-mail administrativo</label><input className="fi" defaultValue="administrativo@novaobra.com.br" /></div>
              <div><label className="lb">Fuso horário</label><select className="fi"><option>Brasília (UTC−03:00)</option><option>Manaus (UTC−04:00)</option></select></div>
            </div>
          </div>
          <div className="pn pd" id="c2" style={{ marginBottom: 16 }}>
            <h2>Preferências visuais</h2><div className="sm" style={{ margin: '4px 0 16px' }}>Escolha como o Conta Ponto aparece para você.</div>
            <div className="fg">
              {[['light', 'Tema claro', 'Interface clara e objetiva', '#e9e9e4'], ['dark', 'Tema escuro', 'Menor emissão de luz', '#1C2023']].map(([k, l, d, c]) => (
                <button key={k} className="pn" style={{ textAlign: 'left', padding: 8, ...(theme === k ? { borderColor: 'var(--t)' } : {}) }} onClick={() => setTheme(k)}>
                  <div style={{ height: 56, background: c, border: '1px solid var(--b)', marginBottom: 10 }} /><b>{l}</b><div className="sm">{d}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="pn pd" id="c3" style={{ marginBottom: 16 }}>
            <h2>Preferências do sistema</h2><div className="sm" style={{ margin: '4px 0 8px' }}>Comportamentos gerais para a operação.</div>
            {PREFS.map(([t, d], i) => <div key={t} className="sp" style={{ padding: '14px 0', borderTop: '1px solid var(--b)' }}><div><b>{t}</b><div className="sm">{d}</div></div><Toggle on={prefs[i]} onClick={() => setPrefs(prefs.map((p, k) => (k === i ? !p : p)))} /></div>)}
          </div>
          <div className="pn pd" id="c4">
            <h2>Minha conta</h2>
            <div className="row" style={{ marginTop: 16 }}>
              <UserAvatar size={56} />
              <div style={{ flex: 1 }}><b>Foto de perfil</b><div className="sm">Sem foto, aparece a inicial do seu primeiro nome.</div></div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
              <button className="bt o" onClick={() => fileRef.current.click()}>{photo ? 'Trocar foto' : 'Adicionar foto'}</button>
              {photo && <button className="bt o" onClick={remove}>Remover</button>}
            </div>
            <div className="fg" style={{ margin: '16px 0' }}>
              <div><label className="lb">Nome</label><input className="fi" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} /></div>
              <div><label className="lb">E-mail</label><input className="fi" value={user.email} readOnly /></div>
            </div>
            <button className="bt o" onClick={() => openModal(<PasswordModal />)}>Alterar senha</button>
          </div>
        </div>
      </div>
    </>
  )
}
