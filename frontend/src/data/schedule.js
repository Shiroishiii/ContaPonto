import { pad, tm } from '../utils'

export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export const WD = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
export const DEMO_END = new Date(2025, 5, 18) // data de referência dos dados de demonstração
export const MIN_MONTH = { y: 2025, m: 0 }
export const MAX_MONTH = { y: 2025, m: 5 }

// Registros fixos da Marina em junho/2025 (conforme o layout aprovado)
const FIX = {
  18: ['08:02', '12:01', '13:00', '17:47', 'Regular'],
  17: ['07:51', '11:58', '12:58', '17:03', 'Extra'],
  16: ['08:14', '12:10', '13:07', '', 'Incompleto'],
  13: ['08:32', '12:03', '13:02', '17:49', 'Atraso'],
  12: ['08:00', '12:00', '13:00', '17:45', 'Regular'],
}

export const journeyOf = (me, journeys) => {
  const j = journeys.find((x) => x.n === me?.j) || journeys[0]
  return { ...j, min: tm(j.s) - tm(j.e) - (tm(j.r) - tm(j.i)), label: `${j.e} — ${j.s}` }
}

export function monthDays(emp, y, m, sched) {
  const out = []
  const last = new Date(y, m + 1, 0).getDate()
  for (let d = last; d >= 1; d--) {
    const dt = new Date(y, m, d)
    const wd = dt.getDay()
    if (dt > DEMO_END || wd === 0 || wd === 6) continue
    let en, iv, rt, sa, st
    if (emp.id === 1 && y === 2025 && m === 5 && FIX[d]) {
      const f = FIX[d]
      ;[en, iv, rt] = [tm(f[0]), tm(f[1]), tm(f[2])]
      sa = f[3] ? tm(f[3]) : null
      st = f[4]
    } else {
      const seed = emp.id * 31 + d * 7 + m * 3
      en = 475 + (seed % 22)
      iv = 715 + ((seed * 3) % 12)
      rt = iv + 60 + (seed % 4 === 0 ? 5 : 0)
      sa = seed % 17 === 0 ? null : rt + (sched.min - (iv - en)) + (((seed * 5) % 22) - 8)
    }
    const tot = sa == null ? null : iv - en + (sa - rt)
    if (!st) st = sa == null ? 'Incompleto' : en > tm(sched.e) + 12 ? 'Atraso' : tot - sched.min > 10 ? 'Extra' : 'Regular'
    out.push({ date: `${y}-${pad(m + 1)}-${pad(d)}`, d, wd: WD[wd], en, iv, rt, sa, tot, st })
  }
  return out
}

export const monthStats = (days, sched) => {
  const done = days.filter((x) => x.tot != null)
  return { total: done.reduce((a, x) => a + x.tot, 0), saldo: done.reduce((a, x) => a + x.tot - sched.min, 0) }
}

export const recordAt = (emp, iso, sched) => {
  const [y, m, d] = iso.split('-').map(Number)
  return monthDays(emp, y, m - 1, sched).find((x) => x.d === d)
}
