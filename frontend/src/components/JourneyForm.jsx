import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { carga, tm } from '../utils'
import { Field, Icon } from './ui'

export default function JourneyForm({ index }) {
  const { journeys, setJourneys, employees, log, closeModal, toast, user } = useApp()
  const [f, setF] = useState(index >= 0 ? journeys[index] : { n: '', e: '08:00', i: '12:00', r: '13:00', s: '17:00', d: 'Seg–Sex', f: '', a: 1 })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = () => {
    if (!f.n.trim() || !f.e || !f.i || !f.r || !f.s) return setErr('Preencha o nome e todos os horários.')
    if (!(tm(f.e) < tm(f.i) && tm(f.i) < tm(f.r) && tm(f.r) < tm(f.s))) return setErr('Os horários devem estar em ordem: entrada, intervalo, retorno e saída.')
    const j = { ...f, a: +f.a }
    setJourneys((l) => (index >= 0 ? l.map((x, k) => (k === index ? j : x)) : [...l, j]))
    log(user.name, index >= 0 ? 'Atualizou uma jornada' : 'Criou uma jornada', `${j.n} · Carga ${carga(j)}`, 'cal', 'Jornadas')
    closeModal(); toast('Jornada salva')
  }
  return (
    <>
      <h2>{index >= 0 ? 'Editar' : 'Nova'} jornada</h2>
      <div className="fg" style={{ marginTop: 16 }}>
        <Field label="Nome da jornada" w><input className="fi" value={f.n} onChange={set('n')} /></Field>
        <Field label="Funcionário vinculado" w>
          <select className="fi" value={f.f} onChange={set('f')}><option value="">Nenhum</option>{employees.slice(0, 12).map((e) => <option key={e.id}>{e.n}</option>)}</select>
        </Field>
        <Field label="Entrada"><input className="fi" type="time" value={f.e} onChange={set('e')} /></Field>
        <Field label="Início do intervalo"><input className="fi" type="time" value={f.i} onChange={set('i')} /></Field>
        <Field label="Retorno do intervalo"><input className="fi" type="time" value={f.r} onChange={set('r')} /></Field>
        <Field label="Saída"><input className="fi" type="time" value={f.s} onChange={set('s')} /></Field>
        <Field label="Dias da semana"><select className="fi" value={f.d} onChange={set('d')}>{['Seg–Sex', 'Seg–Sáb', 'Seg–Dom'].map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Status"><select className="fi" value={f.a} onChange={set('a')}><option value={1}>Ativo</option><option value={0}>Inativo</option></select></Field>
      </div>
      <div className="er">{err}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="bt o" onClick={closeModal}>Cancelar</button>
        <button className="bt" onClick={save}><Icon n="check" /> Salvar</button>
      </div>
    </>
  )
}
