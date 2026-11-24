import { useApp } from '../context/AppContext'
import { Badge, Icon, PageHeader } from '../components/ui'
import JourneyForm from '../components/JourneyForm'
import { carga } from '../utils'
export default function Journeys() {
  const { journeys, dataError, dataLoading, openModal } = useApp()
  const labelDays = (j) => j.days.map((d) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.weekday]).join(', ')
  const hours = (j) => j.days[0] ? carga({ e: j.days[0].startTime, i: j.days[0].breakStartTime, r: j.days[0].breakEndTime, s: j.days[0].endTime }) : '—'
  return <>
    <PageHeader title="Jornadas" desc="Cadastre e administre horários individuais."><button className="bt" onClick={() => openModal(<JourneyForm />)}><Icon n="plus" /> Nova jornada</button></PageHeader>
    {dataError && <div className="er">{dataError}</div>}
    <div className="pn sc"><table><thead><tr><th>Jornada</th><th>Funcionários</th><th>Entrada</th><th>Intervalo</th><th>Saída</th><th>Dias</th><th>Carga</th><th>Status</th></tr></thead><tbody>
      {journeys.map((j) => <tr key={j.id} className="k" onClick={() => openModal(<JourneyForm journey={j} />)}>
        <td><b>{j.name}</b></td><td className="sm">{j.f || '—'}</td><td>{j.days[0]?.startTime || '—'}</td><td>{j.days[0]?.breakStartTime || '—'}–{j.days[0]?.breakEndTime || '—'}</td><td>{j.days[0]?.endTime || '—'}</td><td className="sm">{labelDays(j)}</td><td>{hours(j)}</td><td><Badge t={j.isActive ? 'Ativo' : 'Inativo'} /></td>
      </tr>)}
      {!journeys.length && <tr><td colSpan={8} className="sm" style={{ textAlign: 'center', padding: 40 }}>{dataLoading ? 'Carregando jornadas…' : 'Nenhuma jornada cadastrada.'}</td></tr>}
    </tbody></table></div>
  </>
}
