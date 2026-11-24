import { useApp } from '../../context/AppContext'
import { Badge, Icon, PageHeader, UserAvatar } from '../../components/ui'
import { usePhotoPicker } from '../../components/photo'
import { fmtTel, maskCPF, fem } from '../../utils'
export default function MyProfile() {
  const { me } = useApp()
  const { photo, ref, onChange, pick, remove } = usePhotoPicker()
  const admission = me?.admissionDate ? new Date(me.admissionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
  const schedule = me?.schedule
  const sec = (title, desc, children) => <div className="pn pd" style={{ marginBottom: 16 }}><h2>{title}</h2><div className="sm" style={{ fontSize: 10, marginTop: 4 }}>{desc}</div>{children}</div>
  const row = (items) => <div className="fg" style={{ margin: '18px 0' }}>{items.map(([label, value]) => <div key={label}><div className="sm" style={{ fontSize: 10 }}>{label}</div><b style={{ display: 'block', marginTop: 6 }}>{value || '—'}</b></div>)}</div>
  return <>
    <PageHeader title="Meu perfil" desc="Consulte seus dados pessoais e informações de trabalho." />
    <div className="g2 sl" style={{ gridTemplateColumns: '210px 1fr', alignItems: 'start' }}>
      <div className="pn"><div style={{ padding: '24px 16px', textAlign: 'center' }}><div style={{ display: 'inline-block' }}><UserAvatar size={56} /></div><h2 style={{ marginTop: 14 }}>{me?.n}</h2><div className="sm" style={{ margin: '4px 0 12px' }}>{me?.c || 'Funcionário'}</div><Badge t={me?.status === 'ACTIVE' ? (fem(me?.n) ? 'Funcionária ativa' : 'Funcionário ativo') : 'Inativo'} /><div style={{ marginTop: 14 }}><input ref={ref} type="file" accept="image/*" hidden onChange={onChange} /><button className="sm" style={{ textDecoration: 'underline' }} onClick={pick}>{photo ? 'Trocar foto' : 'Adicionar foto'}</button>{photo && <button className="sm" style={{ textDecoration: 'underline', marginLeft: 12 }} onClick={remove}>Remover</button>}</div></div>{[['Matrícula', me?.mat], ['Admissão', admission]].map(([label, value]) => <div key={label} style={{ borderTop: '1px solid var(--b)', padding: 16 }}><div className="lb" style={{ fontSize: 8 }}>{label}</div><b style={{ display: 'block', marginTop: 8 }}>{value || '—'}</b></div>)}</div>
      <div>{sec('Dados pessoais', 'Informações de contato vinculadas à conta.', row([['Nome completo', me?.full], ['CPF', maskCPF(me?.cpf)], ['E-mail', me?.e], ['Telefone', fmtTel(me?.tel)]]))}{sec('Informações profissionais', 'Dados administrados pela sua empresa.', row([['Cargo', me?.c], ['Jornada', schedule?.name || me?.j], ['Horários', schedule?.days?.map((d) => `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.weekday]} ${d.startTime}–${d.endTime}`).join(' · ')]]))}{sec('Segurança da conta', 'Alterações de senha ainda não estão disponíveis pela API. Entre em contato com o administrador da empresa.', <div className="sm" style={{ marginTop: 12 }}>A senha não pode ser alterada por esta tela.</div>)}</div>
    </div>
  </>
}
