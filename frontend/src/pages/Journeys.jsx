import { useApp } from '../context/AppContext'
import { Badge, Icon, PageHeader } from '../components/ui'
import JourneyForm from '../components/JourneyForm'
import { carga } from '../utils'

export default function Journeys() {
  const { journeys, openModal } = useApp()
  return (
    <>
      <PageHeader title="Jornadas" desc="Cadastre e administre horários individuais."><button className="bt" onClick={() => openModal(<JourneyForm index={-1} />)}><Icon n="plus" /> Nova jornada</button></PageHeader>
      <div className="pn sc"><table><thead><tr><th>Jornada</th><th>Funcionários</th><th>Entrada</th><th>Intervalo</th><th>Saída</th><th>Dias</th><th>Carga</th><th>Status</th></tr></thead><tbody>
        {journeys.map((j, i) => (
          <tr key={i} className="k" onClick={() => openModal(<JourneyForm index={i} />)}>
            <td><b>{j.n}</b></td><td className="sm">{j.f || '—'}</td><td>{j.e}</td><td>{j.i}–{j.r}</td><td>{j.s}</td><td className="sm">{j.d}</td><td>{carga(j)}</td><td><Badge t={j.a ? 'Ativo' : 'Inativo'} /></td>
          </tr>
        ))}
      </tbody></table></div>
    </>
  )
}
