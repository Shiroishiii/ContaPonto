import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Icon, PageHeader } from '../components/ui'

export default function Activities() {
  const { activities } = useApp()
  const [type, setType] = useState('')
  const [menu, setMenu] = useState(false)
  useEffect(() => { const c = () => setMenu(false); document.addEventListener('click', c); return () => document.removeEventListener('click', c) }, [])
  const list = activities.filter((a) => !type || a[5] === type)

  return (
    <>
      <PageHeader title="Histórico de atividades" desc="Rastreabilidade das ações realizadas no sistema.">
        <div style={{ position: 'relative' }}>
          <button className="bt o" onClick={(e) => { e.stopPropagation(); setMenu(!menu) }}><Icon n="filter" /> {type || 'Filtrar atividades'}</button>
          {menu && <div className="dd">{['', 'Solicitações', 'Funcionários', 'Jornadas', 'Sistema'].map((t) => <button key={t} onClick={() => setType(t)}>{t || 'Todas'}</button>)}</div>}
        </div>
      </PageHeader>
      <div className="pn pd">
        <div className="lb" style={{ marginBottom: 12, fontSize: 9 }}>18 jun 2025</div>
        {list.map((a, i) => (
          <div key={i} className="tl">
            <span className="sm" style={{ width: 80, flex: 'none' }}>{a[4]}</span><span className="ic"><Icon n={a[3]} /></span>
            <div style={{ flex: 1 }}><b>{a[0]}</b><div style={{ margin: '4px 0' }}>{a[1]}</div><div className="sm" style={{ fontSize: 10 }}>{a[2]}</div></div>
            <span className="bg n">{a[5]}</span>
          </div>
        ))}
        {!list.length && <div className="sm" style={{ padding: 30, textAlign: 'center' }}>Nenhuma atividade para este filtro.</div>}
      </div>
    </>
  )
}
