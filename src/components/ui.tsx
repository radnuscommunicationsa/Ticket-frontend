// Priority Badge
export function PriorityBadge({ priority }: { priority: string }) {
  const map: any = {
    critical: { label: '🔴 Critical', cls: 'priority-critical' },
    high:     { label: '🟠 High',     cls: 'priority-high' },
    medium:   { label: '🟡 Medium',   cls: 'priority-medium' },
    low:      { label: '🟢 Low',      cls: 'priority-low' },
  }
  const p = map[priority] || { label: priority, cls: 'priority-low' }
  return <span className={p.cls} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.73rem', fontWeight:600, padding:'3px 8px', borderRadius:3 }}>{p.label}</span>
}

// Status Badge
export function StatusBadge({ status }: { status: string }) {
  const map: any = {
    'open':        { label: 'Open',        cls: 'status-open' },
    'in-progress': { label: 'In Progress', cls: 'status-in-progress' },
    'resolved':    { label: 'Resolved',    cls: 'status-resolved' },
    'closed':      { label: 'Closed',      cls: 'status-closed' },
  }
  const s = map[status] || { label: status, cls: 'status-open' }
  return <span className={s.cls} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.73rem', fontWeight:600, padding:'3px 9px', borderRadius:12 }}>
    <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
    {s.label}
  </span>
}

// Dept Badge
export function DeptBadge({ dept }: { dept: string }) {
  return <span style={{ fontSize:'0.71rem', color:'var(--red-primary)', background:'rgba(198,40,40,0.08)', padding:'2px 8px', borderRadius:3, border:'1px solid rgba(198,40,40,0.18)' }}>{dept}</span>
}

// Stat Card
export function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return <div className="card" style={{ padding:'1.2rem 1.4rem', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color }} />
    <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:'2rem', fontWeight:700, fontFamily:'IBM Plex Mono', color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginTop:6 }}>{sub}</div>}
  </div>
}

// Alert
export function Alert({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const colors = { success: '#2e7d32', error: '#c62828', info: 'var(--red-primary)' }
  const bgs    = { success: 'rgba(46,125,50,0.08)', error: 'rgba(198,40,40,0.08)', info: 'rgba(198,40,40,0.06)' }
  return <div style={{ padding:'12px 16px', borderRadius:6, fontSize:'0.85rem', marginBottom:'1rem', border:`1px solid ${colors[type]}40`, background:bgs[type], color:colors[type] }}>
    {type === 'success' ? '✅' : '⚠️'} {message}
  </div>
}

// Page Header
export function PageHeader({ breadcrumb, title, subtitle }: { breadcrumb: string; title: string; subtitle?: string }) {
  return <div style={{ marginBottom:'1.8rem' }}>
    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'IBM Plex Mono', marginBottom:6 }}>
      TICKETDESK / <span style={{ color:'var(--red-primary)' }}>{breadcrumb}</span>
    </div>
    <h1 style={{ fontSize:'1.45rem', fontWeight:700, color:'var(--text-main)' }}>{title}</h1>
    {subtitle && <p style={{ color:'var(--text-sub)', fontSize:'0.84rem', marginTop:4 }}>{subtitle}</p>}
  </div>
}

// Modal
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return <div onClick={onClose} style={{ display:'flex', position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
    <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ padding:'1.1rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg-mid)', zIndex:1 }}>
        <h3 style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-main)' }}>{title}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
      </div>
      <div style={{ padding:'1.4rem' }}>{children}</div>
    </div>
  </div>
}
