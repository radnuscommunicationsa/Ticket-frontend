'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Clock, User, Info, Circle } from 'lucide-react' // Import icons

import AppLayout from '@/components/AppLayout'
import {
  PriorityBadge,
  StatusBadge,
  DeptBadge,
  Alert
} from '@/components/ui'

import api from '@/lib/api'

export default function TicketDetail() {

  const params = useParams()
  const router = useRouter()

  const id = params?.id

  const [ticket, setTicket] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState('open')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [msg, setMsg] = useState<{
    type: 'success' | 'error',
    text: string
  } | null>(null)

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000'

  // =========================
  // LOAD TICKET
  // =========================
  const loadTicket = async () => {

    try {

      setLoading(true)

      const { data } = await api.get(`/tickets/${id}`)

      console.log(data)

      setTicket(data)
      setLogs(data.logs || [])
      setStatus(data.status || 'open')

    } catch (err) {

      console.log(err)

      setMsg({
        type: 'error',
        text: 'Failed to load ticket'
      })

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    if (id) {
      loadTicket()
    }

  }, [id])

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    try {

      setSaving(true)

     await api.patch(`/tickets/${id}`, {
  status,
  note
})

      setMsg({
        type: 'success',
        text: 'Ticket updated successfully'
      })

      loadTicket()
      setNote('')

    } catch (err: any) {

      console.log(err)

      setMsg({
        type: 'error',
        text:
          err?.response?.data?.error ||
          'Update failed'
      })

    } finally {

      setSaving(false)
    }
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <AppLayout role="admin">
        <div style={{ padding: '2rem' }}>
          Loading...
        </div>
      </AppLayout>
    )
  }

  // =========================
  // NO TICKET
  // =========================
  if (!ticket) {
    return (
      <AppLayout role="admin">
        <div style={{ padding: '2rem', color: 'red' }}>
          Ticket not found
        </div>
      </AppLayout>
    )
  }

  const att = ticket?.attachment

  const attUrl = att
    ? `${API_URL}/uploads/${att}`
    : null

  const isImg =
    att &&
    /\.(jpg|jpeg|png|gif|webp)$/i.test(att)

  return (

    <AppLayout role="admin">

      {/* HEADER */}

      <div style={{ marginBottom: '1.5rem' }}>

        <div
          style={{
            fontSize: '0.75rem',
            color: 'gray',
            marginBottom: 8
          }}
        >
          <Link
            href="/admin/tickets"
            style={{
              textDecoration: 'none',
              color: 'gray'
            }}
          >
            Tickets
          </Link>

          {' / '}

          {ticket.ticket_no}
        </div>

        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 700
          }}
        >
          {ticket.subject}
        </h1>

      </div>

      {msg && (
        <Alert
          type={msg.type}
          message={msg.text}
        />
      )}

      {/* MAIN */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '1.5rem'
        }}
      >

        {/* LEFT */}

        <div>

          {/* DETAILS */}

          <div
            className="card"
            style={{ marginBottom: '1.5rem' }}
          >

            <div
              style={{
                padding: '1rem',
                borderBottom:
                  '1px solid var(--border)'
              }}
            >
              <strong>Ticket Details</strong>
            </div>

            <div style={{ padding: '1rem' }}>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '1rem'
                }}
              >

                <div>
                  <div>ID</div>
                  <strong>
                    {ticket.ticket_no || 'N/A'}
                  </strong>
                </div>

                <div>
                  <div>Category</div>
                  <strong>
                    {ticket.category || 'N/A'}
                  </strong>
                </div>

                <div>
                  <div>Status</div>

                  <StatusBadge
                    status={
                      ticket.status || 'open'
                    }
                  />
                </div>

                <div>
                  <div>Priority</div>

                  <PriorityBadge
                    priority={
                      ticket.priority || 'low'
                    }
                  />
                </div>

                <div>
                  <div>Created</div>

                  <strong>
                    {
                      ticket.created_at
                        ? new Date(
                            ticket.created_at
                          ).toLocaleString()
                        : 'N/A'
                    }
                  </strong>
                </div>

                <div>
                  <div>Updated</div>

                  <strong>
                    {
                      ticket.updated_at
                        ? new Date(
                            ticket.updated_at
                          ).toLocaleString()
                        : 'N/A'
                    }
                  </strong>
                </div>

              </div>

              <hr style={{ margin: '1rem 0' }} />

              <div>
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 600
                  }}
                >
                  Description
                </div>

                <div
                  style={{
                    background:
                      'var(--bg-input)',
                    padding: '1rem',
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {ticket.description || 'No description'}
                </div>
              </div>

            </div>

          </div>

          {/* ATTACHMENT */}

          {att && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <strong>Attachment</strong>
              </div>
              <div style={{ padding: '1rem' }}>
                {isImg ? (
                  <img src={attUrl!} alt="attachment" style={{ width: '100%', borderRadius: 8 }} />
                ) : (
                  <a href={attUrl!} target="_blank" style={{ color: 'red' }}>Download File</a>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY / UPDATES - WITH LUCIDE ICONS */}
          <div className="card">
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} />
                Activity / Updates
              </strong>
            </div>
            <div style={{ padding: '1rem' }}>
              {logs.length > 0 ? (
                logs.map((log: any, i: number) => (
                  <div key={i} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-mid)', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--red-primary)', textTransform: 'uppercase', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Circle size={14} fill="currentColor" />
                        {log.status}
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(log.date || log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                      {log.note}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={12} />
                      by {log.by || 'IT Support'}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} />
                  No updates yet. The IT team will update this ticket shortly.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT */}

        <div>

          {/* EMPLOYEE */}

          <div
            className="card"
            style={{ marginBottom: '1.5rem' }}
          >

            <div
              style={{
                padding: '1rem',
                borderBottom:
                  '1px solid var(--border)'
              }}
            >
              <strong>Employee</strong>
            </div>

            <div style={{ padding: '1rem' }}>

              <div
                style={{
                  marginBottom: 10
                }}
              >
                <strong>
                  {ticket.emp_name || 'Unknown'}
                </strong>
              </div>

              <div style={{ marginBottom: 8 }}>
                <DeptBadge
                  dept={
                    ticket.department || 'N/A'
                  }
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                {ticket.emp_email}
              </div>

              <div>
                {ticket.phone}
              </div>

            </div>

          </div>

          {/* UPDATE */}

          <div className="card">

            <div
              style={{
                padding: '1rem',
                borderBottom:
                  '1px solid var(--border)'
              }}
            >
              <strong>Update Status</strong>
            </div>

            <div style={{ padding: '1rem' }}>

              <form onSubmit={updateStatus}>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: 10,
                    marginBottom: '1rem'
                  }}
                >
                  <option value="open">
                    Open
                  </option>

                  <option value="in-progress">
                    In Progress
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>

                  <option value="closed">
                    Closed
                  </option>

                </select>

                <textarea
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  placeholder="Add note..."
                  style={{
                    width: '100%',
                    minHeight: 90,
                    padding: 10,
                    marginBottom: '1rem'
                  }}
                />

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#c62828',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  {
                    saving
                      ? 'Updating...'
                      : 'Update Ticket'
                  }
                </button>

              </form>

            </div>

          </div>

        </div>

      </div>

    </AppLayout>
  )
}