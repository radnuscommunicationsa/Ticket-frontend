import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
// Priority Badge
export function PriorityBadge({ priority }: { priority: string }) {
  const map: any = {
    critical: { label: 'Critical', color: '#b71c1c', cls: 'priority-critical' },
    high:     { label: 'High',     color: '#e65100', cls: 'priority-high' },
    medium:   { label: 'Medium',   color: '#f57f17', cls: 'priority-medium' },
    low:      { label: 'Low',      color: '#2e7d32', cls: 'priority-low' },
  }
  const p = map[priority] || { label: priority, color: 'var(--text-muted)', cls: 'priority-low' }
  return (
    <span className={p.cls} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.73rem', fontWeight:600, padding:'3px 9px', borderRadius:3 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }} />
      {p.label}
    </span>
  )
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
  return <span style={{ fontSize:'0.71rem', color:'var(--red-primary)', background:'var(--red-glow)', padding:'2px 8px', borderRadius:3, border:'1px solid var(--border)' }}>{dept}</span>
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

export function Alert({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const colors = { success: '#2e7d32', error: '#dc2626', info: 'var(--red-primary)' }
  const bgs    = { success: 'rgba(46,125,50,0.08)', error: 'rgba(220,38,38,0.08)', info: 'var(--red-glow)' }
  const icons  = {
    success: <CheckCircle2 size={17} strokeWidth={2} />,
    error: <AlertCircle size={17} strokeWidth={2} />,
    info: <Info size={17} strokeWidth={2} />,
  }
  return (
    <div style={{
      padding: '10px 16px',
      borderRadius: 6,
      fontSize: '0.85rem',
      marginBottom: '1rem',
      border: `1px solid ${colors[type]}40`,
      background: bgs[type],
      color: colors[type],
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {icons[type]}
      <span>{message}</span>
    </div>
  )
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
import { AlertTriangle, Trash2 } from 'lucide-react'

export function ConfirmModal({
  open,
  title,
  subtitle = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  onCancel,
  onConfirm
}: {
  open: boolean
  title: string
  subtitle?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}
      >
        <div style={{ padding: '1.4rem', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(198,40,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <AlertTriangle size={26} color="#c62828" />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{title}</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '12px', border: 'none', borderRight: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px', border: 'none', background: '#c62828', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Trash2 size={14}/> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}