import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon, UserAvatar } from './ui'

const NAV = [
  ['/admin', 'Visão geral', 'grid'], ['/admin/funcionarios', 'Funcionários', 'users'], ['/admin/jornadas', 'Jornadas', 'cal'],
  ['/admin/registros', 'Registros de ponto', 'clock'], ['/admin/solicitacoes', 'Solicitações', 'msg'],
  ['/admin/relatorios', 'Relatórios', 'chart'], ['/admin/atividades', 'Atividades', 'pulse'],
]
const TITLES = { '/admin': 'Visão geral', '/admin/funcionarios': 'Funcionários', '/admin/jornadas': 'Jornadas', '/admin/registros': 'Registros de ponto', '/admin/solicitacoes': 'Solicitações', '/admin/relatorios': 'Relatórios', '/admin/atividades': 'Atividades', '/admin/configuracoes': 'Configurações' }

export default function Layout() {
  const { user, setUser, theme, setTheme, requests, unread, setUnread } = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [col, setCol] = useState(false)
  const [open, setOpen] = useState(false)
  const [bell, setBell] = useState(false)
  const [prof, setProf] = useState(false)
  useEffect(() => { setOpen(false); setBell(false); setProf(false) }, [pathname])
  if (!user) return <Navigate to="/login" replace />
  const pend = requests.filter((r) => r.st === 'Pendente')

  return (
    <div className={`app ${col ? 'col' : ''} ${open ? 'op' : ''}`}>
      <aside className="sb">
        <div className="top">
          <div className="logo"><span className="lg"><Icon n="bars" /></span><span className="tx">CONTA <i>PONTO</i></span></div>
          <button className="ib" style={{ minWidth: 28, height: 28, padding: 0 }} onClick={() => setCol(!col)}><Icon n="r" /></button>
        </div>
        <div className="ub" onClick={() => nav('/admin/configuracoes')}>
          <UserAvatar />
          <div className="tx"><b style={{ fontSize: 12 }}>{user.name}</b><div className="sm">Administradora</div></div>
        </div>
        <div className="lb tx" style={{ padding: '0 10px 8px', fontSize: 9 }}>Operação</div>
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => 'nv' + (isActive ? ' on' : '')}>
            <Icon n={icon} /><span className="tx">{label}</span>
            {to.endsWith('solicitacoes') && pend.length > 0 && <span className="bd tx">{pend.length}</span>}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid var(--b)', paddingTop: 10 }}>
          <NavLink to="/admin/configuracoes" className={({ isActive }) => 'nv' + (isActive ? ' on' : '')}><Icon n="gear" /><span className="tx">Configurações</span></NavLink>
          <button className="nv" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n="sun" /><span className="tx">{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span></button>
          <button className="nv" onClick={() => { setUser(null); nav('/login') }}><Icon n="out" /><span className="tx">Sair</span></button>
        </div>
      </aside>
      <div className="mn">
        <header className="hd">
          <button className="ib mb" onClick={() => setOpen(!open)}><Icon n="menu" /></button>
          <div className="bc">Conta Ponto &nbsp;›&nbsp; <b>{TITLES[pathname]}</b></div>
          <div className="ib"><Icon n="search" />
            <input placeholder="Buscar" onKeyDown={(e) => e.key === 'Enter' && nav('/admin/funcionarios?q=' + encodeURIComponent(e.target.value))} />
            <span className="sm" style={{ borderLeft: '1px solid var(--b)', paddingLeft: 8 }}>⌘K</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="nb" onClick={() => { setBell(!bell); setProf(false); setUnread(false) }}><Icon n="bell" />{unread && <i className="dot" />}</button>
            {bell && (
              <div className="dd" style={{ width: 290 }}>
                <div className="lb">Notificações</div>
                {pend.map((r) => (
                  <button key={r.id} onClick={() => nav('/admin/solicitacoes')}><b>{r.n}</b> solicitou correção de {r.tp.toLowerCase()}<div className="sm">{r.sol}</div></button>
                ))}
                {!pend.length && <div className="sm">Nenhuma notificação nova.</div>}
                <button className="sm" onClick={() => nav('/admin/atividades')}>Ver atividades</button>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="nb" onClick={() => { setProf(!prof); setBell(false) }}><UserAvatar size={28} /></button>
            {prof && (
              <div className="dd">
                <div><b>{user.name}</b><div className="sm">{user.email}</div></div>
                <button onClick={() => nav('/admin/configuracoes')}>Minha conta</button>
                <button onClick={() => { setUser(null); nav('/login') }}>Sair</button>
              </div>
            )}
          </div>
        </header>
        <main className="ct"><div className="in"><Outlet /></div></main>
      </div>
    </div>
  )
}
