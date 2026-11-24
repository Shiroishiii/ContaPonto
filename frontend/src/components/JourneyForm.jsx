import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { assignSchedule, createSchedule, updateSchedule, updateScheduleStatus } from '../services/scheduleService'
import { tm } from '../utils'
import { Field, Icon } from './ui'
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const presets = { 'Seg–Sex': [1, 2, 3, 4, 5], 'Seg–Sáb': [1, 2, 3, 4, 5, 6], 'Seg–Dom': [0, 1, 2, 3, 4, 5, 6] }
const pattern = (days) => Object.entries(presets).find(([, values]) => values.length === days.length && values.every((x) => days.some((d) => d.weekday === x)))?.[0] || 'Seg–Sex'
export default function JourneyForm({ index = -1, journey: passed }) {
  const { journeys, employees, token, refreshData, closeModal, toast } = useApp()
  const journey = passed || (index >= 0 ? journeys[index] : null)
  const assigned = (journey?.assignments || []).some((a) => !a.endDate)
  const first = journey?.days?.[0] || {}
  const [f, setF] = useState({ name: journey?.name || '', startTime: first.startTime || '08:00', breakStartTime: first.breakStartTime || '12:00', breakEndTime: first.breakEndTime || '13:00', endTime: first.endTime || '17:00', days: pattern(journey?.days || []), employeeId: '', startDate: new Date().toISOString().slice(0, 10), isActive: journey?.isActive ?? true })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setF((old) => ({ ...old, [key]: key === 'isActive' ? event.target.value === 'true' : event.target.value }))
  const save = async () => {
    if (!f.name.trim()) return setErr('Informe o nome da jornada.')
    if (!(tm(f.startTime) < tm(f.breakStartTime) && tm(f.breakStartTime) < tm(f.breakEndTime) && tm(f.breakEndTime) < tm(f.endTime))) return setErr('Os horários devem estar em ordem.')
    if (journey && assigned && (journey.days[0]?.startTime !== f.startTime || journey.days[0]?.breakStartTime !== f.breakStartTime || journey.days[0]?.breakEndTime !== f.breakEndTime || journey.days[0]?.endTime !== f.endTime || pattern(journey.days) !== f.days)) return setErr('Esta jornada tem atribuições ativas. Para preservar os horários históricos, crie outra jornada.')
    setBusy(true); setErr('')
    const dayList = (presets[f.days] || presets['Seg–Sex']).map((weekday) => ({ weekday, startTime: f.startTime, breakStartTime: f.breakStartTime, breakEndTime: f.breakEndTime, endTime: f.endTime }))
    try {
      let saved = journey
      if (journey) saved = await updateSchedule(journey.id, { name: f.name.trim(), ...(!assigned ? { days: dayList } : {}) }, token)
      else saved = await createSchedule({ name: f.name.trim(), days: dayList }, token)
      if (f.employeeId) await assignSchedule(saved.id, Number(f.employeeId), f.startDate, token)
      if (journey && journey.isActive !== f.isActive) await updateScheduleStatus(journey.id, f.isActive, token)
      await refreshData(); closeModal(); toast('Jornada salva')
    } catch (error) { setErr(error.message) } finally { setBusy(false) }
  }
  return <>
    <h2>{journey ? 'Editar' : 'Nova'} jornada</h2>
    <div className="fg" style={{ marginTop: 16 }}>
      <Field label="Nome da jornada" w><input className="fi" value={f.name} onChange={set('name')} /></Field>
      <Field label="Atribuir a funcionário" w><select className="fi" value={f.employeeId} onChange={set('employeeId')}><option value="">Sem nova atribuição</option>{employees.filter((e) => e.status === 'ACTIVE').map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field>
      {f.employeeId && <Field label="Início da atribuição"><input className="fi" type="date" value={f.startDate} onChange={set('startDate')} /></Field>}
      <Field label="Entrada"><input className="fi" type="time" value={f.startTime} onChange={set('startTime')} /></Field>
      <Field label="Início do intervalo"><input className="fi" type="time" value={f.breakStartTime} onChange={set('breakStartTime')} /></Field>
      <Field label="Retorno do intervalo"><input className="fi" type="time" value={f.breakEndTime} onChange={set('breakEndTime')} /></Field>
      <Field label="Saída"><input className="fi" type="time" value={f.endTime} onChange={set('endTime')} /></Field>
      <Field label="Dias da semana"><select className="fi" value={f.days} onChange={set('days')}>{Object.keys(presets).map((d) => <option key={d}>{d}</option>)}</select></Field>
      {journey && <Field label="Status"><select className="fi" value={String(f.isActive)} onChange={set('isActive')}><option value="true">Ativo</option><option value="false">Inativo</option></select></Field>}
    </div>
    {journey?.days?.length > 0 && <div className="sm" style={{ marginTop: 12 }}>Dias configurados: {journey.days.map((d) => WEEKDAYS[d.weekday]).join(', ')} · {journey.assignments?.filter((a) => !a.endDate).map((a) => a.employee.fullName).join(', ') || 'Sem atribuições ativas'}{assigned && <><br />Os horários atribuídos são preservados. Para mudar horários, crie uma nova jornada.</>}</div>}
    <div className="er">{err}</div>
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="bt o" onClick={closeModal}>Cancelar</button><button className="bt" disabled={busy} onClick={save}><Icon n="check" /> {busy ? 'Salvando…' : 'Salvar'}</button></div>
  </>
}
