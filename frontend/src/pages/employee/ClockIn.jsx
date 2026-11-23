import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useNow, spDate, stepIndex, workedMin, fmtWork, initialPunch, LABELS, DONE, SIT, BADGE_SHORT } from '../../data/punch'
import { journeyOf } from '../../data/schedule'
import { Badge, Icon, PageHeader } from '../../components/ui'
import Track from '../../components/Track'
import RequestForm from '../../components/RequestForm'
import { hm, mm, pad, sgn, tm } from '../../utils'

export default function ClockIn() {
  const { me, punch, setPunch, journeys, setRecords, log, toast, openModal } = useApp()
  const now = useNow()
  const [flash, setFlash] = useState(null)
  const nowMin = now.h * 60 + now.m
  const sched = journeyOf(me, journeys)
  const idx = stepIndex(punch)
  const worked = workedMin(punch, nowMin)
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 6000); return () => clearTimeout(t) }, [flash])

  const register = () => {
    if (idx > 3) return
    const last = Math.max(0, ...punch.filter(Boolean).map(tm))
    const stamp = mm(Math.max(nowMin, last))
    const np = punch.map((x, i) => (i === idx ? stamp : x))
    setPunch(np)
    setFlash(`${DONE[idx]} às ${stamp}`)
    toast(`${DONE[idx]} às ${stamp}`)
    log(me.n, ['Registrou a entrada', 'Iniciou o intervalo', 'Retornou do intervalo', 'Registrou a saída'][idx], `${stamp} · ${me.j}`, 'clock', 'Sistema')
    const w = workedMin(np, Math.max(nowMin, last)), diff = w - sched.min, done = idx === 3
    const late = np[0] && tm(np[0]) > tm(sched.e) + 10
    setRecords((l) => l.map((r) => (r.n === me.n && r.d !== '2025-06-17' ? { ...r, en: np[0] || '—', iv: np[1] || '—', rt: np[2] || '—', sa: np[3] || '—', t: hm(w), df: done ? sgn(diff) : '—', s: done ? (diff > 10 ? 'Extra' : late ? 'Atraso' : 'Regular') : late ? 'Atraso' : 'Em andamento' } : r)))
  }
  const reset = () => { setPunch(initialPunch(me.id)); setFlash(null); toast('Demonstração reiniciada') }

  const items = LABELS.map((label, i) => ({ label, time: punch[i] || '— —:— —', state: punch[i] ? 'done' : i === idx ? 'cur' : 'pend' }))
  const clock = `${pad(now.h)}:${pad(now.m)}:${pad(now.s)}`

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <PageHeader title="Registro de ponto" desc="Registre cada etapa da sua jornada com segurança."><Badge t={BADGE_SHORT[idx]} /></PageHeader>
      <div className="pn">
        <div style={{ textAlign: 'center', padding: '44px 20px 36px' }}>
          <div className="lb" style={{ fontSize: 9 }}>Horário de Brasília · UTC−03:00</div>
          <div className="clk" style={{ margin: '26px 0 22px' }}>{clock}<span className="blink" /></div>
          <div className="sm">{spDate()}</div>
        </div>
        <div className="kp" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: 0, borderTop: '1px solid var(--b)' }}>
          {[['Situação', SIT[idx]], ['Jornada prevista', sched.label], ['Total trabalhado', fmtWork(worked)]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center', padding: 16 }}><div className="lb" style={{ fontSize: 8 }}>{l}</div><div style={{ fontWeight: 600, marginTop: 10 }}>{v}</div></div>
          ))}
        </div>
        <div className="na" style={{ background: 'var(--s)', padding: '40px 40px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 20, borderTop: '1px solid var(--b)' }}>
          <div>
            <div className="lb" style={{ fontSize: 9 }}>Próxima ação</div>
            <div style={{ fontSize: 26, margin: '14px 0 10px' }}>{idx > 3 ? 'Jornada finalizada' : LABELS[idx]}</div>
            <div className="sm" style={{ fontSize: 10 }}>{idx > 3 ? 'Seus registros de hoje foram concluídos. Bom descanso.' : 'Confirme para registrar o horário atual.'}</div>
          </div>
          {idx <= 3 && (
            <button className="bt" style={{ height: 56, padding: '0 28px', gap: 14, textAlign: 'left' }} onClick={register}>
              <Icon n="clock" /><span><span style={{ display: 'block' }}>{LABELS[idx]}</span><span style={{ display: 'block', fontWeight: 400, fontSize: 9, opacity: 0.7 }}>Registrar agora</span></span>
            </button>
          )}
        </div>
        <div style={{ padding: '24px 28px 28px', borderTop: '1px solid var(--b)' }}>
          {flash && <div className="fx"><Icon n="check" /> {flash}</div>}
          <Track items={items} />
        </div>
      </div>
      <div className="sp" style={{ marginTop: 18, justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
        <span className="sm">Identificou um horário incorreto? <button style={{ textDecoration: 'underline', color: 'var(--t)' }} onClick={() => openModal(<RequestForm />)}>Solicitar correção</button></span>
        <button className="sm" style={{ textDecoration: 'underline' }} onClick={reset}>Reiniciar demonstração</button>
      </div>
    </div>
  )
}
