'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import { Bell, CheckCircle2, Lock, Wrench } from 'lucide-react'

export default function EmployeeNotifications() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const r = await api.get('/notifications')

        // ✅ Safe handling (main fix)
        const data = r?.data?.notifications || []
        setNotifs(data)

      } catch (err) {
        console.error('Notification fetch error:', err)
        setNotifs([]) // fallback
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // mark as read (no need to wait)
    api.patch('/notifications/read').catch(() => {})
  }, [])

  const clearAll = async () => {
    if (!confirm('Clear all notifications? This cannot be undone.')) return
    try {
      await api.delete('/notifications/clear')
      setNotifs([])
    } catch (err) {
      console.error('Clear notifications error:', err)
    }
  }

  const getIcon = (msg: string) => {
    if (/resolved/i.test(msg)) return <CheckCircle2 size={20} color="#2e7d32" strokeWidth={2}/>
    if (/closed/i.test(msg)) return <Lock size={20} color="#616161" strokeWidth={2}/>
    if (/progress/i.test(msg)) return <Wrench size={20} color="#e65100" strokeWidth={2}/>
    return <Bell size={20} color="var(--text-muted)" strokeWidth={2}/>
  }

  return (
    <AppLayout role="employee">
      <PageHeader
  breadcrumb="NOTIFICATIONS"
  title="Notifications"
  subtitle="Updates on your support tickets"
/>

      <div className="card">
        <div
  style={{
    padding: '1rem 1.4rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-mid)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}
>
  {/* ✅ Safe length */}
  <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>
    All Notifications ({notifs?.length || 0})
  </span>
  {(notifs?.length || 0) > 0 && (
    <button
      onClick={clearAll}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        color: '#c62828',
        border: '1px solid rgba(198,40,40,0.3)',
        borderRadius: 5,
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
    Clear All
    </button>
  )}
</div>

        <div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading...
            </div>
          ) : (notifs?.length || 0) === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
  <Bell size={44} color="var(--text-muted)" strokeWidth={1.5} style={{ margin: '0 auto 1rem' }}/>
  <div>No notifications yet.</div>
  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
    Ticket updates will appear here.
  </div>
</div>
          ) : (
            notifs.map((n: any, index: number) => (
              <div
                key={n.id || index} // ✅ safe key
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '1rem 1.4rem',
                  borderBottom: '1px solid var(--border-mid)',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ fontSize: '1.3rem', marginTop: 2 }}>
                  {getIcon(n.message || '')}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      marginBottom: 4,
                      lineHeight: 1.5
                    }}
                  >
                    {n.message || 'No message'}
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {n.ticket_no && (
                      <Link
                        href={`/employee/view-ticket/${n.ticket_id}`}
                        style={{
                          color: 'var(--red-primary)',
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          background: 'rgba(198,40,40,0.08)',
                          padding: '2px 8px',
                          borderRadius: 3,
                          border: '1px solid rgba(198,40,40,0.18)'
                        }}
                      >
                        {n.ticket_no}
                      </Link>
                    )}

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString()
                        : 'No date'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}