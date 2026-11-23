import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon, UserAvatar } from './ui'

const CFG = {
  admin: {
    home: '/admin',
    nav: [['/admin', 'Visão geral', 'grid'], ['/admin/funcionarios', 'Funcionários', 'users'], ['/admin/jornadas', 'Jornadas', 'cal'], ['/admin/registros', 'Registros de ponto', 'clock'], ['/admin/solicitacoes', 'Solicitações', 'msg'], ['/admin/relatorios', 'Relatórios', 'chart'], ['/admin/atividades', 'Atividades', 'pulse']],
    titles: { '/admin': 'Visão geral', '/admin/funcionarios': 'Funcionários', '/admin/jornadas': 'Jornadas', '/admin/registros': 'Registros de ponto', '/admin/solicitacoes': 'Solicitações', '/admin/relatorios': 'Relatórios', '/admin/atividades': 'Atividades', '/admin/configuracoes': 'Configurações' },
    badgeTo: '/admin/solicitacoes', profile: '/admin/configuracoes', profileLabel: 'Minha conta',
  },
  func: {
    home: '/funcionario',
    nav: [['/funcionario', 'Minha visão geral', 'grid'], ['/funcionario/registrar-ponto', 'Registrar ponto', 'clock'], ['/funcionario/historico', 'Meu histórico', 'cal'], ['/funcionario/correcoes', 'Correções', 'msg'], ['/funcionario/perfil', 'Meu perfil', 'user']],
    titles: { '/funcionario': 'Minha visão geral', '/funcionario/registrar-ponto': 'Registrar ponto', '/funcionario/historico': 'Meu histórico', '/funcionario/correcoes': 'Correções', '/funcionario/perfil': 'Meu perfil' },
    badgeTo: '/funcionario/correcoes', profile: '/funcionario/perfil', profileLabel: 'Meu perfil',
  },
}
const KEYWORDS = { '/funcionario/registrar-ponto': ['ponto', 'registrar', 'entrada', 'saída', 'saida', 'intervalo'], '/funcionario/historico': ['histórico', 'historico', 'espelho', 'mês', 'mes'], '/funcionario/correcoes': ['correção', 'correcao', 'correções', 'solicitação', 'solicitacao'], '/funcionario/perfil': ['perfil', 'dados', 'senha', 'foto'], '/funcionario': ['visão', 'visao', 'início', 'inicio', 'resumo'] }

export default function Layout({ role }) {
  const { user, setUser, me, theme, setTheme, requests, adminRequests, unread, setUnread, toast } = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [col, setCol] = useState(false)
  const [open, setOpen] = useState(false)
  const [bell, setBell] = useState(false)
  const [prof, setProf] = useState(false)
  useEffect(() => { setOpen(false); setBell(false); setProf(false) }, [pathname])
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={CFG[user.role].home} replace />
  const cfg = CFG[role]
  const mine = role === 'func' ? requests.filter((r) => r.n === me?.n) : []
  const pendCount = role === 'admin' ? adminRequests.filter((r) => r.st === 'Pendente').length : mine.filter((r) => r.st === 'Pendente').length

  const notes = role === 'admin'
    ? adminRequests.filter((r) => r.st === 'Pendente').map((r) => ({ k: r.id, t: <><b>{r.n}</b> solicitou correção de {r.tp.toLowerCase()}</>, s: r.sol }))
    : mine.filter((r) => !r.demo || r.st === 'Pendente').map((r) => ({ k: r.id, t: r.st === 'Pendente' ? <>Sua solicitação de {r.tp.toLowerCase()} está em análise</> : <>Sua solicitação de {r.tp.toLowerCase()} foi <b>{r.st === 'Aprovada' ? 'aprovada' : 'rejeitada'}</b></>, s: r.dr }))

  const search = (v) => {
    if (role === 'admin') return nav('/admin/funcionarios?q=' + encodeURIComponent(v))
    const q = v.trim().toLowerCase()
    const hit = Object.entries(KEYWORDS).find(([, ws]) => ws.some((w) => q && w.includes(q)))
    hit ? nav(hit[0]) : toast('Nenhuma página encontrada para a busca.')
  }

  return (
    <div className={`app ${col ? 'col' : ''} ${open ? 'op' : ''}`}>
      <aside className="sb">
        <div className="top">
          <div className="logo"><span className="lg"><Icon n="bars" /></span><span className="tx">CONTA <i>PONTO</i></span></div>
          <button className="ib" style={{ minWidth: 28, height: 28, padding: 0 }} onClick={() => setCol(!col)}><Icon n="r" /></button>
        </div>
        <div className="ub" onClick={() => nav(cfg.profile)}>
          <UserAvatar />
          <div className="tx"><b style={{ fontSize: 12 }}>{user.name}</b><div className="sm">{role === 'admin' ? 'Administradora' : me?.c}</div></div>
        </div>
        <div className="lb tx" style={{ padding: '0 10px 8px', fontSize: 9 }}>Operação</div>
        {cfg.nav.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === cfg.home} className={({ isActive }) => 'nv' + (isActive ? ' on' : '')}>
            <Icon n={icon} /><span className="tx">{label}</span>
            {to === cfg.badgeTo && pendCount > 0 && <span className="bd tx">{pendCount}</span>}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid var(--b)', paddingTop: 10 }}>
          {role === 'admin' && <NavLink to="/admin/configuracoes" className={({ isActive }) => 'nv' + (isActive ? ' on' : '')}><Icon n="gear" /><span className="tx">Configurações</span></NavLink>}
          <button className="nv" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n="sun" /><span className="tx">{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span></button>
          <button className="nv" onClick={() => { setUser(null); nav('/login') }}><Icon n="out" /><span className="tx">Sair</span></button>
        </div>
      </aside>
      <div className="mn">
        <header className="hd">
          <button className="ib mb" onClick={() => setOpen(!open)}><Icon n="menu" /></button>
          <div className="bc">Conta Ponto &nbsp;›&nbsp; <b>{cfg.titles[pathname]}</b></div>
          <div className="ib"><Icon n="search" />
            <input placeholder="Buscar" onKeyDown={(e) => e.key === 'Enter' && search(e.target.value)} />
            <span className="sm" style={{ borderLeft: '1px solid var(--b)', paddingLeft: 8 }}>⌘K</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="nb" onClick={() => { setBell(!bell); setProf(false); setUnread(false) }}><Icon n="bell" />{unread && <i className="dot" />}</button>
            {bell && (
              <div className="dd" style={{ width: 290 }}>
                <div className="lb">Notificações</div>
                {notes.map((n) => <button key={n.k} onClick={() => nav(cfg.badgeTo)}>{n.t}<div className="sm">{n.s}</div></button>)}
                {!notes.length && <div className="sm">Nenhuma notificação nova.</div>}
                {role === 'admin' && <button className="sm" onClick={() => nav('/admin/atividades')}>Ver atividades</button>}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="nb" onClick={() => { setProf(!prof); setBell(false) }}><UserAvatar size={28} /></button>
            {prof && (
              <div className="dd">
                <div><b>{user.name}</b><div className="sm">{user.email}</div></div>
                <button onClick={() => nav(cfg.profile)}>{cfg.profileLabel}</button>
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
