'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import { 
  Laptop, Monitor, Smartphone, Printer, Keyboard, Mouse, Package,
  Cpu, Server, Wifi, Tablet, Router, BatteryCharging, Cable, Zap
} from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  Available: '#2e7d32',
  Assigned: '#1565c0',
  'Under Repair': '#ef6c00',
  Damaged: '#c62828',
  Retired: '#616161',
}

// ✅ FIXED: All categories mapped — no more emoji fallback
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Laptop: <Laptop size={20} strokeWidth={1.8} />,
  CPU: <Cpu size={20} strokeWidth={1.8} />,
  Monitor: <Monitor size={20} strokeWidth={1.8} />,
  Keyboard: <Keyboard size={20} strokeWidth={1.8} />,
  Mouse: <Mouse size={20} strokeWidth={1.8} />,
  Printer: <Printer size={20} strokeWidth={1.8} />,
  Phone: <Smartphone size={20} strokeWidth={1.8} />,
  Server: <Server size={20} strokeWidth={1.8} />,
  'Network Device': <Wifi size={20} strokeWidth={1.8} />,
  Tablet: <Tablet size={20} strokeWidth={1.8} />,
  Router: <Router size={20} strokeWidth={1.8} />,
  UPS: <BatteryCharging size={20} strokeWidth={1.8} />,
  Cable: <Cable size={20} strokeWidth={1.8} />,
  Other: <Package size={20} strokeWidth={1.8} />,
}

export default function MyAssets() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<any>(null)

  useEffect(() => {
    api.get('/assets/my-assets')
      .then(r => setAssets(r.data?.assets || []))
      .catch(err => setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load assets' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout role="employee">
      <PageHeader breadcrumb="MY ASSETS" title="My Assets" subtitle="View all IT assets assigned to you" />

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: '1rem', background: '#ffebee', color: '#c62828', fontSize: '0.85rem' }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Assigned', value: assets.length, color: '#1565c0' },
          { label: 'Active', value: assets.filter(a => a.status === 'Assigned').length, color: '#2e7d32' },
          { label: 'Under Repair', value: assets.filter(a => a.status === 'Under Repair').length, color: '#ef6c00' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.2rem 1.4rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>No Assets Assigned</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You have no IT assets assigned to you currently.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {assets.map((a: any) => (
            <div key={a._id} className="card" style={{ overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--red-primary)', display: 'flex', alignItems: 'center' }}>
                  {CATEGORY_ICON[a.category] || <Package size={20} strokeWidth={1.8} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{a.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.asset_code}</div>
                </div>
                <span style={{ marginLeft: 'auto', background: `${STATUS_COLOR[a.status]}20`, color: STATUS_COLOR[a.status], padding: '3px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {a.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1rem 1.4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {[
                    ['Brand', a.brand || '—'],
                    ['Model', a.model || '—'],
                    ['Category', a.category || '—'],
                    ['Assigned Date', a.assigned_date ? new Date(a.assigned_date).toLocaleDateString() : '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}