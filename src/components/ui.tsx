'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle, Trash2 } from 'lucide-react'

/* =========================================================
   PRIORITY BADGE
========================================================= */
export function PriorityBadge({ priority }: { priority: string }) {
  const map: any = {
    critical: { label: 'Critical', color: '#b71c1c', cls: 'priority-critical' },
    high:     { label: 'High',     color: '#e65100', cls: 'priority-high' },
    medium:   { label: 'Medium',   color: '#f57f17', cls: 'priority-medium' },
    low:      { label: 'Low',      color: '#2e7d32', cls: 'priority-low' },
  }
  const p = map[priority] || { label: priority, color: 'var(--text-muted)', cls: 'priority-low' }
  return (
    <span className={p.cls} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.75rem', fontWeight:600, padding:'4px 10px', borderRadius:6 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:p.color, display:'inline-block', boxShadow: `0 0 0 2px ${p.color}20` }} />
      {p.label}
    </span>
  )
}

/* =========================================================
   STATUS BADGE
========================================================= */
export function StatusBadge({ status }: { status: string }) {
  const map: any = {
    'open':        { label: 'Open',        cls: 'status-open' },
    'in-progress': { label: 'In Progress', cls: 'status-in-progress' },
    'resolved':    { label: 'Resolved',    cls: 'status-resolved' },
    'closed':      { label: 'Closed',      cls: 'status-closed' },
  }
  const s = map[status] || { label: status, cls: 'status-open' }
  return <span className={s.cls} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.75rem', fontWeight:600, padding:'4px 10px', borderRadius:14 }}>
    <span style={{ width:7, height:7, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
    {s.label}
  </span>
}

/* =========================================================
   DEPT BADGE
========================================================= */
export function DeptBadge({ dept }: { dept: string }) {
  return <span style={{ fontSize:'0.73rem', color:'var(--red-primary)', background:'var(--red-glow)', padding:'3px 10px', borderRadius:6, border:'1px solid var(--red-primary)', fontWeight: 600 }}>{dept}</span>
}

/* =========================================================
   STAT CARD
========================================================= */
export function StatCard({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string
  value: number | string
  sub?: string
  color: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '1.4rem 1.6rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 32px ${color}30` : 'var(--shadow)',
        transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease',
      }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
      <div style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:10, fontWeight: 700 }}>{label}</div>
      <div className="mono" style={{ fontSize:'2.2rem', fontWeight:700, color, lineHeight:1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

/* =========================================================
   ALERT (Toast)
========================================================= */
export function Alert({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [message])

  const colors = { success: '#2e7d32', error: '#dc2626', info: 'var(--red-primary)' }
  const bgs    = { success: 'rgba(46,125,50,0.1)', error: 'rgba(220,38,38,0.1)', info: 'var(--red-glow)' }
  const icons  = {
    success: <CheckCircle2 size={18} strokeWidth={2.5} />,
    error: <AlertCircle size={18} strokeWidth={2.5} />,
    info: <Info size={18} strokeWidth={2.5} />,
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 1000,
        minWidth: 300,
        maxWidth: 400,
        padding: '14px 18px',
        borderRadius: 10,
        fontSize: '0.86rem',
        border: `1px solid ${colors[type]}50`,
        background: 'var(--bg-card)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
        color: colors[type],
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(30px)',
        transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <span style={{ background: bgs[type], borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icons[type]}
      </span>
      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{message}</span>
    </div>
  )
}

/* =========================================================
   PAGE HEADER
========================================================= */
export function PageHeader({ breadcrumb, title, subtitle }: { breadcrumb: string; title: string; subtitle?: string }) {
  return <div style={{ marginBottom:'2rem' }}>
    <div className="mono" style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginBottom:8, letterSpacing: '0.06em', fontWeight: 600 }}>
      TICKETDESK / <span style={{ color:'var(--red-primary)' }}>{breadcrumb}</span>
    </div>
    <h1 style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--text-main)' }}>{title}</h1>
    {subtitle && <p style={{ color:'var(--text-sub)', fontSize:'0.88rem', marginTop:6 }}>{subtitle}</p>}
  </div>
}

/* =========================================================
   MODAL
========================================================= */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true))
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', onKey)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('keydown', onKey)
      }
    } else {
      setMounted(false)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 500,
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        }}
      >
        <div style={{ padding:'1.3rem 1.6rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg-card)', zIndex:1 }}>
          <h3 style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--text-main)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background:'var(--bg-mid)', border:'none', cursor:'pointer', color:'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, transition: 'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-mid)'}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:'1.6rem' }}>{children}</div>
      </div>
    </div>
  )
}

/* =========================================================
   CONFIRM MODAL
========================================================= */
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setMounted(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          transform: mounted ? 'scale(1)' : 'scale(0.94)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ padding: '1.6rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(220,38,38,0.2)' }}>
            <AlertTriangle size={28} color="#dc2626" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '14px', border: 'none', borderRight: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mid)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '14px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
          >
            <Trash2 size={16}/> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}