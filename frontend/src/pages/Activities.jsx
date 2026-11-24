import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { listActivities } from '../services/activityService'
import { Icon, PageHeader } from '../components/ui'
const TYPES = ['', 'Solicitações', 'Funcionários', 'Jornadas', 'Sistema']
const actionText = (action) => ({ EMPLOYEE_CREATED: 'Cadastrou um funcionário', EMPLOYEE_UPDATED: 'Atualizou os dados de um funcionário', EMPLOYEE_DEACTIVATED: 'Inativou um funcionário', EMPLOYEE_REACTIVATED: 'Reativou um funcionário', SCHEDULE_CREATED: 'Criou uma jornada', SCHEDULE_UPDATED: 'Atualizou uma jornada', SCHEDULE_ASSIGNED: 'Atribuiu uma jornada', SCHEDULE_ACTIVATED: 'Ativou uma jornada', SCHEDULE_DEACTIVATED: 'Inativou uma jornada', TIME_RECORD_CREATED: 'Registrou um ponto', CORRECTION_REQUESTED: 'Solicitou correção de ponto', CORRECTION_APPROVED: 'Aprovou uma correção', CORRECTION_REJECTED: 'Rejeitou uma correção' }[action] || action.replaceAll('_', ' ').toLowerCase())
export default function Activities() {
  const { activities, setActivities, token, dataError } = useApp()
  const [type, setType] = useState('')
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const close = () => setMenu(false); document.addEventListener('click', close); return () => document.removeEventListener('click', close) }, [])
  useEffect(() => { listActivities(type ? { category: type } : {}, token).then((result) => setActivities(result.items.map((a) => ({ ...a, actorName: a.user?.name || 'Sistema', category: a.entity === 'CorrectionRequest' ? 'Solicitações' : a.entity === 'Employee' ? 'Funcionários' : a.entity === 'WorkSchedule' || a.entity === 'EmployeeSchedule' ? 'Jornadas' : 'Sistema' })))).catch((e) => setError(e.message)) }, [type, token, setActivities])
  const list = activities.filter((a) => !type || a.category === type)
  const dateHeading = list[0] ? new Date(list[0].createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return <>
    <PageHeader title="Histórico de atividades" desc="Rastreabilidade das ações realizadas no sistema."><div style={{ position: 'relative' }}><button className="bt o" onClick={(e) => { e.stopPropagation(); setMenu(!menu) }}><Icon n="filter" /> {type || 'Filtrar atividades'}</button>{menu && <div className="dd">{TYPES.map((value) => <button key={value} onClick={() => setType(value)}>{value || 'Todas'}</button>)}</div>}</div></PageHeader>
    {(error || dataError) && <div className="er">{error || dataError}</div>}
    <div className="pn pd"><div className="lb" style={{ marginBottom: 12, fontSize: 9 }}>{dateHeading || 'Atividades recentes'}</div>{list.map((item) => <div key={item.id} className="tl"><span className="sm" style={{ width: 80, flex: 'none' }}>{new Date(item.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</span><span className="ic"><Icon n="pulse" /></span><div style={{ flex: 1 }}><b>{item.actorName}</b><div style={{ margin: '4px 0' }}>{actionText(item.action)}</div><div className="sm" style={{ fontSize: 10 }}>{item.entity}{item.entityId ? ` · ${item.entityId}` : ''}</div></div><span className="bg n">{item.category}</span></div>)}{!list.length && <div className="sm" style={{ padding: 30, textAlign: 'center' }}>Nenhuma atividade para este filtro.</div>}</div>
  </>
}
