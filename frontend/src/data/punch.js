import { useEffect, useState } from 'react'
import { pad, tm } from '../utils'

export const spNow = () => {
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date())
  const g = (t) => +p.find((x) => x.type === t).value
  return { h: g('hour') % 24, m: g('minute'), s: g('second') }
}
export const spDate = () => {
  const t = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
export function useNow() {
  const [n, setN] = useState(spNow())
  useEffect(() => { const t = setInterval(() => setN(spNow()), 1000); return () => clearInterval(t) }, [])
  return n
}

export const LABELS = ['Registrar entrada', 'Iniciar intervalo', 'Retornar do intervalo', 'Registrar saída']
export const DONE = ['Entrada registrada', 'Início do intervalo registrado', 'Retorno do intervalo registrado', 'Saída registrada']
export const SIT = ['Não iniciada', 'Trabalhando', 'Em intervalo', 'Trabalhando', 'Finalizada']
export const BADGE = ['Jornada não iniciada', 'Jornada em andamento', 'Em intervalo', 'Jornada em andamento', 'Jornada finalizada']
export const BADGE_SHORT = ['Não iniciada', 'Em jornada', 'Em intervalo', 'Em jornada', 'Finalizada']
export const stepIndex = (p) => { const i = p.findIndex((x) => !x); return i < 0 ? 4 : i }
export const initialPunch = (empId) => (empId === 1 ? ['08:02', '12:01', null, null] : [null, null, null, null])
export const workedMin = (p, nowMin) => {
  const [a, b, c, d] = p.map((x) => (x ? tm(x) : null))
  let w = 0
  if (a != null) w += Math.max(0, (b ?? nowMin) - a)
  if (c != null) w += Math.max(0, (d ?? nowMin) - c)
  return w
}
export const fmtWork = (m) => `${pad((m / 60) | 0)}h${pad(m % 60)}min`
