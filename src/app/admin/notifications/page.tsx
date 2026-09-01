'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import {
  Bell,
  Ticket,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Home
} from 'lucide-react'

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

    useEffect(() => {
    // ask browser permission once, on first load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    const fetchNotifs = (isFirstLoad: boolean) => {
      api.get('/notifications')
        .then((res) => {
          const data = res.data
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data.notifications)
            ? data.notifications
            : []

          // find notifications that are new since the last fetch (skip on first load)
          if (!isFirstLoad) {
            setNotifs((prevList) => {
              const prevIds = new Set(prevList.map((n: any) => n._id))
              const newOnes = list.filter((n: any) => !prevIds.has(n._id))

              // fire a browser popup for each new ticket notification
              if (newOnes.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
                newOnes.forEach((n: any) => {
                  const notif = new Notification('New Ticket Notification', {
                    body: n.message,
                    icon: '/favicon.ico', // change to your logo path if you have one
                  })
                  notif.onclick = () => {
                    window.focus()
                    notif.close()
                  }
                })
              }

              return list
            })
          } else {
            setNotifs(list)
          }
        })
        .catch((err) => {
          console.error('Notifications error:', err)
          if (isFirstLoad) setNotifs([])
        })
        .finally(() => {
          if (isFirstLoad) setLoading(false)
          api.patch('/notifications/read').catch(() => {})
        })
    }

    fetchNotifs(true) // initial load, no popups

    const interval = setInterval(() => fetchNotifs(false), 15000)

    return () => clearInterval(interval)
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

  const getIcon = (type: string, msg: string) => {
  if (type === 'take_home_request') {
    return (
      <Home
        size={20}
        color="var(--red-primary)"
        strokeWidth={2}
      />
    )
  }

  if (type === 'take_home_status') {
    return (
      <Home
        size={20}
        color="#1565c0"
        strokeWidth={2}
      />
    )
  }

  if (type === 'ticket_created') {
    return (
      <Ticket
        size={20}
        color="var(--red-primary)"
        strokeWidth={2}
      />
    )
  }

  if (type === 'ticket_updated') {
    return (
      <CheckCircle2
        size={20}
        color="#2e7d32"
        strokeWidth={2}
      />
    )
  }

  if (/critical/i.test(msg)) {
    return (
      <AlertOctagon
        size={20}
        color="#b71c1c"
        strokeWidth={2}
      />
    )
  }

  if (/high/i.test(msg)) {
    return (
      <AlertTriangle
        size={20}
        color="#e65100"
        strokeWidth={2}
      />
    )
  }

  return (
    <Bell
      size={20}
      color="var(--text-muted)"
      strokeWidth={2}
    />
  )
}

  return (
    <AppLayout role="admin">
      <PageHeader
  breadcrumb="NOTIFICATIONS"
  title="Admin Notifications"
  subtitle="New tickets and system alerts"
/>

      <div className="card">
        {/* HEADER */}
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
  <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>
    All Notifications ({notifs.length})
  </span>
  {notifs.length > 0 && (
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
  <Bell size={44} color="var(--text-muted)" strokeWidth={1.5} style={{ margin: '0 auto 1rem' }}/>
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