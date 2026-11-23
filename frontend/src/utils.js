export const pad = (n) => String(n).padStart(2, '0')
export const mm = (m) => pad((m / 60) | 0) + ':' + pad(m % 60)
export const hm = (m) => pad((Math.abs(m) / 60) | 0) + 'h' + pad(Math.abs(m) % 60)
export const ini = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('')
export const slug = (n) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ /g, '.')
export const tm = (s) => { const [a, b] = s.split(':'); return a * 60 + +b }
export const carga = (j) => hm(tm(j.s) - tm(j.e) - (tm(j.r) - tm(j.i)))
export const okm = (e) => /^\S+@\S+\.\S+$/.test(e)
export const nowLabel = () => 'Hoje, ' + new Date().toTimeString().slice(0, 5)
export const brDate = (d) => d.split('-').reverse().join('/')
export const onlyDigits = (v, max) => v.replace(/\D/g, '').slice(0, max)
export function validCPF(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false
  const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return dv(9) === +c[9] && dv(10) === +c[10]
}
export const fmtCPF = (c = '') => c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
export const fmtTel = (t = '') => (t.length === 11 ? t.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : t.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3'))
export const MON3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONF = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const fmtShort = (iso) => { const [y, m, d] = iso.split('-'); return `${d} ${MON3[+m - 1]} ${y}` }
export const longDay = (s) => { const [d, m] = s.split(' '); return `${+d} de ${MONF[MON3.indexOf(m)] || m}` }
export const maskCPF = (c = '') => (c ? `•••.${c.slice(3, 6)}.•••-${c.slice(9)}` : '—')
export const sgn = (m) => (m < 0 ? '-' : '+') + hm(m)
export const fem = (n = '') => /a$/i.test(n.split(' ')[0])
