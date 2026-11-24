import { useApp } from '../context/AppContext'
import { Icon, PageHeader } from '../components/ui'
const SECTIONS = [['company-info', 'Dados da empresa', 'brief'], ['appearance', 'Aparência', 'sun'], ['account', 'Minha conta', 'user']]
export default function Settings() {
  const { theme, setTheme, user } = useApp()
  const company = user?.company
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const field = (label, value) => <div><label className="lb">{label}</label><input className="fi" value={value || '—'} readOnly /></div>
  return <>
    <PageHeader title="Configurações" desc="Consulte os dados da empresa e ajuste a aparência do sistema." />
    <div className="g2 sl" style={{ gridTemplateColumns: '190px 1fr', alignItems: 'start' }}>
      <div style={{ position: 'sticky', top: 0 }}>{SECTIONS.map(([id, label, icon]) => <button key={id} className="nv" onClick={() => go(id)}><Icon n={icon} />{label}</button>)}</div>
      <div>
        <div className="pn pd" id="company-info" style={{ marginBottom: 16 }}><h2>Dados da empresa</h2><div className="sm" style={{ margin: '4px 0 16px' }}>Informações cadastradas no sistema.</div><div className="fg">{field('Razão social', company?.name)}{field('CNPJ', company?.cnpj)}{field('Fuso horário', company?.timezone)}</div><div className="sm" style={{ marginTop: 12 }}>A edição dos dados empresariais ainda não é oferecida pela API.</div></div>
        <div className="pn pd" id="appearance" style={{ marginBottom: 16 }}><h2>Preferências visuais</h2><div className="sm" style={{ margin: '4px 0 16px' }}>O tema é uma preferência local deste navegador.</div><div className="fg">{[['light', 'Tema claro', 'Interface clara e objetiva', '#e9e9e4'], ['dark', 'Tema escuro', 'Menor emissão de luz', '#1C2023']].map(([key, label, desc, color]) => <button key={key} className="pn" style={{ textAlign: 'left', padding: 8, ...(theme === key ? { borderColor: 'var(--t)' } : {}) }} onClick={() => setTheme(key)}><div style={{ height: 56, background: color, border: '1px solid var(--b)', marginBottom: 10 }} /><b>{label}</b><div className="sm">{desc}</div></button>)}</div></div>
        <div className="pn pd" id="account"><h2>Minha conta</h2><div className="sm" style={{ margin: '4px 0 16px' }}>Dados retornados pelo usuário autenticado.</div><div className="fg">{field('Nome', user?.name)}{field('E-mail', user?.email)}{field('Perfil', user?.backendRole === 'ADMIN' ? 'Administrador' : 'Funcionário')}</div><div className="sm" style={{ marginTop: 12 }}>Nome, e-mail e senha não podem ser alterados por esta tela enquanto a API não oferecer essas operações.</div></div>
      </div>
    </div>
  </>
}
