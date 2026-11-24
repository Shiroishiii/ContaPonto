import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useNow, LABELS, DONE, SIT, BADGE_SHORT } from '../../data/punch'
import { getWorkday } from '../../services/reportService'
import { createTimeRecord } from '../../services/timeRecordService'
import { Badge, Icon, PageHeader } from '../../components/ui'
import Track from '../../components/Track'
import RequestForm from '../../components/RequestForm'
import { pad } from '../../utils'

const TYPES = ['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT']
const todayDate = (timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
const timeOf = (value, timezone) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : null

export default function ClockIn() {
  const { me, user, token, today, records, refreshData, toast, openModal } = useApp()
  const timezone = user?.company?.timezone || 'America/Sao_Paulo'
  const now = useNow(timezone)
  const [workday, setWorkday] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')
  useEffect(() => {
    if (!me?.id || !token) return
    let active = true
    getWorkday(me.id, todayDate(timezone), token).then((result) => { if (active) setWorkday(result) }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [me?.id, token, today, timezone])
  const nextType = today?.nextType || workday?.nextType
  const idx = nextType ? TYPES.indexOf(nextType) : 4
  const ordered = [...records].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
  const items = LABELS.map((label, i) => ({ label, time: timeOf(ordered[i]?.recordedAt, timezone) || '— —:— —', state: ordered[i] ? 'done' : i === idx ? 'cur' : 'pend' }))
  const register = async () => {
    if (!nextType || busy) return
    setBusy(true); setError('')
    try {
      const created = await createTimeRecord(nextType, token)
      await refreshData()
      const doneIndex = TYPES.indexOf(nextType)
      setFlash(`${DONE[doneIndex]} às ${timeOf(created.recordedAt)}`)
      toast('Ponto registrado')
      if (me?.id) setWorkday(await getWorkday(me.id, todayDate(timezone), token))
    } catch (e) { setError(e.message); toast(e.message); await refreshData() }
    finally { setBusy(false) }
  }
  const schedule = workday?.schedule
  const actionIndex = Math.max(0, Math.min(4, idx))
  const clock = `${pad(now.h)}:${pad(now.m)}:${pad(now.s)}`
  return <div style={{ maxWidth: 840, margin: '0 auto' }}>
    <PageHeader title="Registro de ponto" desc="Registre cada etapa da sua jornada com segurança."><Badge t={BADGE_SHORT[actionIndex]} /></PageHeader>
    <div className="pn">
      <div style={{ textAlign: 'center', padding: '44px 20px 36px' }}><div className="lb" style={{ fontSize: 9 }}>Horário oficial · {timezone}</div><div className="clk" style={{ margin: '26px 0 22px' }}>{clock}<span className="blink" /></div><div className="sm">{new Date().toLocaleDateString('pt-BR', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
      <div className="kp" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: 0, borderTop: '1px solid var(--b)' }}>
        {[['Situação', idx === 4 ? 'Jornada finalizada ou não prevista' : SIT[actionIndex]], ['Jornada prevista', schedule ? `${schedule.startTime}–${schedule.endTime}` : 'Sem jornada cadastrada'], ['Total trabalhado', workday?.summary?.workedHours || '—']].map(([label, value]) => <div key={label} style={{ textAlign: 'center', padding: 16 }}><div className="lb" style={{ fontSize: 8 }}>{label}</div><div style={{ fontWeight: 600, marginTop: 10 }}>{value}</div></div>)}
      </div>
      <div className="na" style={{ background: 'var(--s)', padding: '40px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 20, borderTop: '1px solid var(--b)' }}>
        <div><div className="lb" style={{ fontSize: 9 }}>Próxima ação</div><div style={{ fontSize: 26, margin: '14px 0 10px' }}>{nextType ? LABELS[idx] : 'Nenhum registro pendente'}</div><div className="sm" style={{ fontSize: 10 }}>{nextType ? 'O servidor registrará o horário oficial.' : 'A sequência de hoje foi concluída ou não há jornada para hoje.'}</div></div>
        {nextType && <button className="bt" disabled={busy} style={{ height: 56, padding: '0 28px', gap: 14, textAlign: 'left' }} onClick={register}><Icon n="clock" /><span><span style={{ display: 'block' }}>{busy ? 'Registrando…' : LABELS[idx]}</span><span style={{ display: 'block', fontWeight: 400, fontSize: 9, opacity: 0.7 }}>Registrar agora</span></span></button>}
      </div>
      <div style={{ padding: '24px 28px 28px', borderTop: '1px solid var(--b)' }}>{error && <div className="er">{error}</div>}{flash && <div className="fx"><Icon n="check" /> {flash}</div>}<Track items={items} /></div>
    </div>
    <div className="sp" style={{ marginTop: 18, justifyContent: 'center' }}><span className="sm">Identificou um horário incorreto? <button style={{ textDecoration: 'underline', color: 'var(--t)' }} onClick={() => openModal(<RequestForm />)}>Solicitar correção</button></span></div>
  </div>
}
