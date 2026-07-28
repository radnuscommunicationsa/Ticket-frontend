'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { RefreshCw } from 'lucide-react'

const STATUS_COLOR: any = {
  open: '#1565c0',
  'in-progress': '#ef6c00',
  resolved: '#2e7d32',
  closed: '#616161',
}

const PRIORITY_COLOR: any = {
  low: '#2e7d32',
  medium: '#ef6c00',
  high: '#c62828',
  critical: '#b71c1c',
}

export default function AdminTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<any>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadTickets = async () => {
    try {
      setLoading(true)
      setMsg(null)
      const res = await api.get('/tickets')
      const data = Array.isArray(res.data) ? res.data : []
      setTickets(data)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load tickets' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    setRefreshing(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    try {
      await api.delete(`/tickets/${id}`)
      setMsg({ type: 'success', text: 'Ticket deleted successfully.' })
      loadTickets()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete ticket' })
    }
  }
const toggleSelectAll = () => {
    if (selected.length === tickets.length) {
      setSelected([])
    } else {
      setSelected(tickets.map((t: any) => t._id || t.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) return
    if (!confirm(`Delete ${selected.length} selected ticket(s)? This cannot be undone.`)) return
    try {
      await Promise.all(selected.map(id => api.delete(`/tickets/${id}`)))
      setMsg({ type: 'success', text: `${selected.length} ticket(s) deleted successfully.` })
      setSelected([])
      loadTickets()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete tickets' })
    }
  }

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="TICKETS" title="All Tickets" subtitle="Manage all employee support tickets" />

      {msg && <Alert type={msg.type} message={msg.text} />}

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* HEADER */}
        <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Tickets ({tickets.length})</span>
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {selected.length > 0 && (
      <button
        onClick={handleBulkDelete}
        style={{ padding: '6px 14px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
      >
      Delete Selected ({selected.length})
      </button>
    )}
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      title="Refresh list"
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-card)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer' }}
    >
      <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/> Refresh
    </button>
  </div>
</div>

        {/* TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
  <tr>
    <th style={{ padding: '12px 1rem', borderBottom: '1px solid var(--border)', background: 'rgba(198,40,40,0.04)' }}>
      <input type="checkbox" checked={tickets.length > 0 && selected.length === tickets.length} onChange={toggleSelectAll} />
    </th>
    {['Ticket No', 'Subject', 'Employee', 'Department', 'Priority', 'Status', 'Created', 'Action'].map((h) => (
      <th key={h} style={{ padding: '12px 1rem', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'rgba(198,40,40,0.04)', whiteSpace: 'nowrap' }}>
        {h}
      </th>
    ))}
  </tr>
</thead>

            <tbody>
              {loading ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tickets...</td></tr> 
              ) : tickets.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</td></tr>  
              ) : (
                tickets.map((t: any) => (
                  <tr key={t.id || t._id}
  onClick={() => router.push(`/admin/tickets/${t._id || t.id}`)}
  style={{ borderBottom: '1px solid var(--border-mid)', cursor: 'pointer', transition: 'background 0.15s' }}
  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,40,40,0.04)')}
  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
>
  <td style={{ padding: '12px 1rem' }} onClick={e => e.stopPropagation()}>
    <input type="checkbox" checked={selected.includes(t._id || t.id)} onChange={() => toggleSelectOne(t._id || t.id)} />
  </td>
 {/* TICKET NO */}
                    <td style={{ padding: '12px 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--red-primary)', whiteSpace: 'nowrap' }}>
                      {t.ticket_no}
                    </td>
                    {/* SUBJECT */}
                    <td style={{ padding: '12px 1rem', color: 'var(--text-main)', minWidth: 220 }}>
                      {t.subject}
                    </td>

                    {/* EMPLOYEE */}
                    <td style={{ padding: '12px 1rem', whiteSpace: 'nowrap' }}>
                      {t.emp_name || '—'}
                    </td>

                    {/* DEPARTMENT */}
                    <td style={{ padding: '12px 1rem', whiteSpace: 'nowrap' }}>
                      {t.department || '—'}
                    </td>

                    {/* PRIORITY */}
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{ background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority], padding: '4px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {t.priority}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{ background: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status], padding: '4px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {t.status}
                      </span>
                    </td>

                    {/* CREATED */}
                    <td style={{ padding: '12px 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                    </td>

                    {/* ACTION */}
            <td style={{ padding: '12px 1rem' }} onClick={e => e.stopPropagation()}>
  <div style={{ display: 'flex', gap: 6 }}>
    <button
      onClick={() => router.push(`/admin/tickets/${t._id || t.id}`)}
      style={{ padding: '5px 12px', background: 'var(--red-primary)', color: '#fff', border: 'none', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
    >
      View
    </button>
    <button
      onClick={(e) => handleDelete(t._id || t.id, e)}
      style={{ padding: '5px 12px', background: 'transparent', color: '#c62828', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
    >
      Delete
    </button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}