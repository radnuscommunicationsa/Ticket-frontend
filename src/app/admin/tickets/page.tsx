'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { RefreshCw } from 'lucide-react'
import { Trash2 as TrashIcon, AlertTriangle } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  open: '#1565c0',
  'in-progress': '#ef6c00',
  resolved: '#2e7d32',
  closed: '#616161',
}

const PRIORITY_COLOR: Record<string, string> = {
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
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'single' | 'bulk', id?: string }>({ show: false, type: 'single' })
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmModal({ show: true, type: 'single', id })
  }

  const confirmSingleDelete = async () => {
    const id = confirmModal.id!
    setConfirmModal({ show: false, type: 'single' })
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

  const handleBulkDelete = () => {
    if (selected.length === 0) return
    setConfirmModal({ show: true, type: 'bulk' })
  }

  const confirmBulkDelete = async () => {
    setConfirmModal({ show: false, type: 'bulk' })
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
        <div style={{ padding: '0.8rem 1.1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
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
                <th style={{ padding: '9px 0.9rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)' }}>
                  <input type="checkbox" checked={tickets.length > 0 && selected.length === tickets.length} onChange={toggleSelectAll} />
                </th>
                {['Ticket No', 'Subject', 'Employee', 'Department', 'Priority', 'Status', 'Created', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '9px 0.9rem', textAlign: 'left', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)', whiteSpace: 'nowrap' }}>
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
                    style={{ borderBottom: '1px solid var(--border-mid)' }}
                  >
                    {/* Checkbox column */}
                    <td style={{ padding: '9px 0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selected.includes(t._id || t.id)} 
                        onChange={() => toggleSelectOne(t._id || t.id)} 
                      />
                    </td>

                    <td style={{ padding: '9px 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--red-primary)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {t.ticket_no}
                    </td>
                    <td style={{ padding: '9px 0.9rem', color: 'var(--text-main)', minWidth: 200, fontSize: '0.8rem' }}>
                      {t.subject}
                    </td>
                    <td style={{ padding: '9px 0.9rem', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {t.emp_name || '—'}
                    </td>
                    <td style={{ padding: '9px 0.9rem', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {t.department || '—'}
                    </td>
                    <td style={{ padding: '9px 0.9rem' }}>
                      <span style={{ background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority], padding: '3px 8px', borderRadius: 20, fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '9px 0.9rem' }}>
                      <span style={{ background: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status], padding: '3px 8px', borderRadius: 20, fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                      {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                    </td>

                    {/* ACTION */}
                    <td style={{ padding: '9px 0.9rem' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => router.push(`/admin/tickets/${t._id || t.id}`)}
                          style={{ padding: '4px 10px', background: 'var(--red-primary)', color: '#fff', border: 'none', borderRadius: 5, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => handleDelete(t._id || t.id, e)}
                          style={{ padding: '4px 10px', background: 'transparent', color: '#c62828', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 5, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
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

      {/* CUSTOM CONFIRM MODAL */}
      {confirmModal.show && (
        <div
          onClick={() => setConfirmModal({ show: false, type: confirmModal.type })}
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
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                {confirmModal.type === 'bulk' ? `Delete ${selected.length} selected ticket(s)?` : 'Delete this ticket?'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setConfirmModal({ show: false, type: confirmModal.type })}
                style={{ flex: 1, padding: '12px', border: 'none', borderRight: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.type === 'bulk' ? confirmBulkDelete : confirmSingleDelete}
                style={{ flex: 1, padding: '12px', border: 'none', background: '#c62828', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <TrashIcon size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}