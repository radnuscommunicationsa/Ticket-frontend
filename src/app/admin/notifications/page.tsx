'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications')
      .then((res) => {
        const data = res.data
        // handle both { notifications: [] } and plain []
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.notifications)
          ? data.notifications
          : []
        setNotifs(list)
      })
      .catch((err) => {
        console.error('Notifications error:', err)
        setNotifs([])
      })
      .finally(() => {
        setLoading(false)
        // mark as read after fetching
        api.patch('/notifications/read').catch(() => {})
      })
  }, [])

  const getIcon = (type: string, msg: string) => {
    if (type === 'ticket_created') return '🎫'
    if (type === 'ticket_updated') return '✅'
    if (/critical/i.test(msg)) return '🔴'
    if (/high/i.test(msg)) return '🟠'
    return '🔔'
  }

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="NOTIFICATIONS"
        title="🔔 Admin Notifications"
        subtitle="New tickets and system alerts"
      />

      <div className="card">
        {/* HEADER */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-mid)',
          }}
        >
          <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>
            All Notifications ({notifs.length})
          </span>
        </div>

        {/* BODY */}
        {loading ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            Loading...
          </div>
        ) : notifs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔔</div>
            <div>No notifications yet.</div>
          </div>
        ) : (
          notifs.map((n: any) => (
            <div
              key={n._id || n.id}
              style={{
                padding: '1rem 1.4rem',
                borderBottom: '1px solid var(--border-mid)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.8rem',
                background: n.is_read
                  ? 'transparent'
                  : 'rgba(198,40,40,0.04)',
              }}
            >
              {/* ICON */}
              <span style={{ fontSize: '1.4rem', marginTop: 2 }}>
                {getIcon(n.type, n.message)}
              </span>

              {/* MESSAGE */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: n.is_read ? 400 : 600,
                    color: 'var(--text-main)',
                  }}
                >
                  {n.message}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              {/* UNREAD DOT */}
              {!n.is_read && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#c62828',
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}