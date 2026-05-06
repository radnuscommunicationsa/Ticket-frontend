'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications')
    api.patch('/notifications/read')
  }, [])

  const getIcon = (msg: string) => {
    if (/critical/i.test(msg)) return '🔴'
    if (/high/i.test(msg)) return '🟠'
    if (/resolved/i.test(msg)) return '✅'
    return '🎫'
  }

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="NOTIFICATIONS" title="🔔 Admin Notifications" subtitle="New tickets and system alerts" />
      <div className="card">
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}>
          <span style={{ fontSize:'0.87rem', fontWeight:600 }}>All Notifications ({notifs?.length || 0})</span>
        </div>
        <div style={{ padding:0 }}>
         {loading ? (<div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>
    Loading...
  </div>
) : (notifs?.length || 0) === 0 ? (
  <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
    <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🔔</div>
    <div>No notifications yet.</div>
  </div>
) : (
  notifs.map((n:any) => (
    <div key={n.id}>{n.message}</div>
  ))
)}
        </div>
      </div>
    </AppLayout>
  )
}
