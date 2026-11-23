import { I } from '../data/icons'
import { ini } from '../utils'
import { useApp } from '../context/AppContext'

export const Icon = ({ n }) => <svg viewBox="0 0 24 24"><path d={I[n]} /></svg>

const BC = { Ativo: 'g', Regular: 'g', 'No horário': 'g', Aprovada: 'g', Trabalhando: 'g', Atrasado: 'a', Atraso: 'a', Pendente: 'a', Inativo: 'n', 'Em andamento': 'n', Extra: 'n', Incompleto: 'r', Rejeitada: 'r', '8 min. atraso': 'a', 'Em intervalo': 'a', 'Jornada em andamento': 'g', 'Em jornada': 'g', 'Jornada não iniciada': 'n', 'Não iniciada': 'n', 'Jornada finalizada': 'g', Finalizada: 'g', 'Funcionário ativo': 'g', 'Funcionária ativa': 'g' }
export const Badge = ({ t, tone }) => <span className={'bg ' + (tone || BC[t] || 'n')}>{t}</span>

export const Avatar = ({ name, solid, size }) => (
  <span className={'av' + (solid ? '' : ' d')} style={size ? { width: size, height: size, fontSize: size / 3 } : undefined}>{ini(name)}</span>
)

export function UserAvatar({ size = 26 }) {
  const { user, photo } = useApp()
  const first = (user?.name || '').trim().split(' ')[0]
  return (
    <span className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.42), overflow: 'hidden' }}>
      {photo ? <img src={photo} alt="" /> : first.charAt(0).toUpperCase()}
    </span>
  )
}

export const PageHeader = ({ title, desc, children }) => (
  <div className="ph">
    <div><h1>{title}</h1><div className="sm" style={{ fontSize: 12 }}>{desc}</div></div>
    <div className="row">{children}</div>
  </div>
)

export const Toggle = ({ on, onClick }) => <button className={'tg' + (on ? ' on' : '')} onClick={onClick} />

export function Pagination({ page, pages, onChange, label }) {
  return (
    <div className="pg">
      <span className="sm">{label}</span>
      <span className="row" style={{ gap: 4 }}>
        <button onClick={() => onChange(Math.max(1, page - 1))}>‹</button>
        {[page, page + 1, page + 2].filter((n) => n <= pages).map((n) => (
          <button key={n} className={n === page ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>
        ))}
        <button onClick={() => onChange(Math.min(pages, page + 1))}>›</button>
      </span>
    </div>
  )
}

export const Field = ({ label, w, children }) => <div className={w ? 'w' : ''}><label>{label}</label>{children}</div>
