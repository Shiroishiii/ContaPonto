import { useEffect, useState } from 'react'
import { pad, tm } from '../utils'

export const spNow = (timezone = 'America/Sao_Paulo') => {
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date())
  const g = (t) => +p.find((x) => x.type === t).value
  return { h: g('hour') % 24, m: g('minute'), s: g('second') }
}
export const spDate = () => {
  const t = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
export function useNow(timezone = 'America/Sao_Paulo') {
  const [n, setN] = useState(spNow(timezone))
  useEffect(() => { setN(spNow(timezone)); const t = setInterval(() => setN(spNow(timezone)), 1000); return () => clearInterval(t) }, [timezone])
  return n
}

export const LABELS = ['Registrar entrada', 'Iniciar intervalo', 'Retornar do intervalo', 'Registrar saída']
export const DONE = ['Entrada registrada', 'Início do intervalo registrado', 'Retorno do intervalo registrado', 'Saída registrada']
export const SIT = ['Não iniciada', 'Trabalhando', 'Em intervalo', 'Trabalhando', 'Finalizada']
export const BADGE = ['Jornada não iniciada', 'Jornada em andamento', 'Em intervalo', 'Jornada em andamento', 'Jornada finalizada']
export const BADGE_SHORT = ['Não iniciada', 'Em jornada', 'Em intervalo', 'Em jornada', 'Finalizada']
export const stepIndex = (p) => { const i = p.findIndex((x) => !x); return i < 0 ? 4 : i }
