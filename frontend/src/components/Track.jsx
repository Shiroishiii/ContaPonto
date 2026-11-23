import { Icon } from './ui'

// items: [{ label, time, state: 'done' | 'cur' | 'pend' }]
export default function Track({ items }) {
  return (
    <div className="trk">
      {items.map((x, i) => (
        <div key={i}>
          <span className={'nd ' + x.state}>{x.state === 'done' && <Icon n="check" />}{x.state === 'cur' && <i />}</span>
          <div className="sm" style={{ marginTop: 14, fontSize: 10 }}>{x.label}</div>
          <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{x.time}</div>
        </div>
      ))}
    </div>
  )
}
