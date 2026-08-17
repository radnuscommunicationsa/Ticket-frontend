'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Clock, User, Info, Circle, Paperclip, Download, MessageSquare, Send, FileEdit, Star } from 'lucide-react'

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
  const [comments, setComments] = useState<any[]>([])
  const [status, setStatus] = useState('open')
  const [note, setNote] = useState('')
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  
  const loadTicket = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/tickets/${id}`)
      setTicket(data)
      setLogs(data.logs || [])
      setComments(data.comments || [])
      setStatus(data.status || 'open')
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load ticket' })
    } finally {
      setLoading(false)
    }
  }

  // ✅ Silent refresh - no loading spinner, page-la flash aagathu
  const refreshTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`)
      setTicket(data)
      setLogs(data.logs || [])
      setComments(data.comments || [])
      setStatus(data.status || 'open')
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { if (id) loadTicket() }, [id])

  const updateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.patch(`/tickets/${id}`, { status, note })
      setMsg({ type: 'success', text: 'Ticket updated successfully' })
      await refreshTicket()
      setNote('')
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      setSending(true)
      await api.post(`/tickets/${id}/comment`, { message: commentText.trim() })
      setCommentText('')
      await refreshTicket()
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to send comment' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <AppLayout role="admin"><div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Loading...</div></AppLayout>
  if (!ticket) return <AppLayout role="admin"><div style={{ padding: '1.5rem', color: '#c62828' }}>Ticket not found</div></AppLayout>

  const att = ticket?.attachment
  const attUrl = att ? `${API_URL}/uploads/${att}` : null
  const isImg = att && /\.(jpg|jpeg|png|gif|webp)$/i.test(att)

  const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>{children}</div>
    </div>
  )

  return (
  <AppLayout role="admin">
    {/* HEADER */}
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 5 }}>
        <Link href="/admin/tickets" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Tickets</Link>
        {' / '}{ticket.ticket_no}
      </div>
      <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{ticket.subject}</h1>
    </div>

    {msg && <Alert type={msg.type} message={msg.text} />}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>

      {/* ========== LEFT COLUMN ========== */}
      <div>
        {/* DETAILS */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)' }}>
            <strong style={{ fontSize: '0.85rem' }}>Ticket Details</strong>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <Field label="ID">{ticket.ticket_no || 'N/A'}</Field>
              <Field label="Category">{ticket.category || 'N/A'}</Field>
              <Field label="Status"><StatusBadge status={ticket.status || 'open'} /></Field>
              <Field label="Priority"><PriorityBadge priority={ticket.priority || 'low'} /></Field>
              <Field label="Created">{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}</Field>
              <Field label="Updated">{ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'N/A'}</Field>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '0.9rem 0' }} />

            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Description</div>
            <div style={{ background: 'var(--bg-input)', padding: '0.8rem', borderRadius: 6, whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
              {ticket.description || 'No description'}
            </div>
          </div>
        </div>

        {/* ATTACHMENT */}
        {att && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={14}/> Attachment</strong>
            </div>
            <div style={{ padding: '0.9rem 1rem' }}>
              {isImg ? (
                <img src={attUrl!} alt="attachment" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 6 }} />
              ) : (
                <a href={attUrl!} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red-primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                  <Download size={14}/> Download File
                </a>
              )}
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={14}/> Activity / Updates</strong>
          </div>
          <div style={{ padding: '0.9rem 1rem' }}>
            {logs.length > 0 ? (
              logs.map((log: any, i: number) => (
                <div key={i} style={{ marginBottom: '0.7rem', padding: '0.6rem', background: 'var(--bg-mid)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <strong style={{ color: 'var(--red-primary)', textTransform: 'uppercase', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Circle size={10} fill="currentColor" />{log.status}
                    </strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />{log.date ? new Date(log.date).toLocaleString() : '—'}
                    </span>
                  </div>
                  {log.note && <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{log.note}</div>}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} />by {log.by || 'IT Support'}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} />No updates yet.
              </p>
            )}
          </div>
        </div>

        {/* COMMENTS THREAD */}
        <div className="card">
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={14}/> Comments ({comments.length})</strong>
          </div>
          <div style={{ padding: '0.9rem 1rem' }}>
            {comments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1rem', maxHeight: 320, overflowY: 'auto' }}>
                {comments.map((c: any, i: number) => {
                  const isAdmin = c.by_role === 'admin'
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: isAdmin ? 'var(--red-primary)' : 'var(--bg-mid)',
                        color: isAdmin ? '#fff' : 'var(--text-main)',
                      }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85, marginBottom: 3 }}>
                          {c.by || (isAdmin ? 'IT Support' : 'Employee')}
                        </div>
                        <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.message}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={sendComment} style={{ display: 'flex', gap: 8 }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a reply..."
                style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '0.82rem' }}
              />
              <button type="submit" disabled={sending || !commentText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--red-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, opacity: sending || !commentText.trim() ? 0.6 : 1 }}>
                <Send size={14}/> {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========== RIGHT SIDEBAR ========== */}
      <div>
        {/* EMPLOYEE */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.85rem' }}>Employee</strong>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{ticket.emp_name || 'Unknown'}</div>
            <div style={{ marginBottom: 8 }}><DeptBadge dept={ticket.department || 'N/A'} /></div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 5 }}>{ticket.emp_email}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ticket.phone}</div>
          </div>
        </div>

        {/* UPDATE STATUS */}
        <div className="card">
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.85rem' }}>Update Status</strong>
          </div>
          <div style={{ padding: '1rem' }}>
            <form onSubmit={updateStatus}>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', marginBottom: '0.8rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add note..."
                style={{ width: '100%', minHeight: 75, padding: '8px 10px', marginBottom: '0.8rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />

              <button type="submit" disabled={saving} style={{ width: '100%', padding: '9px', background: 'var(--red-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Updating...' : 'Update Ticket'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    {/* ========== FEEDBACK (FULL WIDTH BELOW) ========== */}
    {ticket.feedback?.submitted_at && (
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{
          padding: '0.8rem 1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-mid)'
        }}>
          <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><FileEdit size={14}/> Customer Feedback</strong>
          </div>

        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Rating</div>
            <div style={{ display: 'flex', gap: 2 }}>
  {[1, 2, 3, 4, 5].map(i => (
    <Star
      key={i}
      size={18}
      fill={i <= ticket.feedback.rating ? '#f59e0b' : 'none'}
      color={i <= ticket.feedback.rating ? '#f59e0b' : 'var(--border)'}
    />
  ))}
</div>
          </div>

          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Comment</div>
            <div style={{ background: 'var(--bg-input)', padding: '0.8rem', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
              {ticket.feedback.comment || 'No comment provided'}
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} />
            Submitted: {new Date(ticket.feedback.submitted_at).toLocaleString()}
          </div>
        </div>
      </div>
    )}
  </AppLayout>
)
}