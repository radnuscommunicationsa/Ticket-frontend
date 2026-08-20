'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import {
  Ticket,
  MailOpen,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Archive,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function BigStatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: any
  label: string
  value: number
  sub: string
  color: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="stat-card-item"
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${color}33`,
        borderRadius: 12,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        boxShadow: hovered
          ? `0 8px 32px ${color}30`
          : `0 4px 24px ${color}18`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `${color}12`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: `${color}08`,
        }}
      />

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>

      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? 0}
      </div>

      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '0.66rem',
          color: 'var(--text-muted)',
          marginTop: 1,
        }}
      >
        {sub}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COLORS — Purple theme palette
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  open: '#7c3aed',
  'in-progress': '#F59E0B',
  resolved: '#10B981',
  closed: '#64748B',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
}

const Badge = ({
  text,
  color,
}: {
  text: string
  color: string
}) => (
  <span
    style={{
      background: `${color}18`,
      color,
      fontSize: '0.68rem',
      fontWeight: 700,
      padding: '3px 9px',
      borderRadius: 20,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
)

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<any[]>([])

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    critical: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })

  useEffect(() => {
    api.get('/tickets/stats')
      .then((res) => {
        const data = res.data
        setStats({
          total:       data.total       ?? 0,
          open:        data.open        ?? 0,
          critical:    data.critical    ?? 0,
          in_progress: data.in_progress ?? 0,
          resolved:    data.resolved    ?? 0,
          closed:      data.closed      ?? 0,
        })
        setTickets(data.recent_tickets ?? [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('API Error:', err)
        setTickets([])
        setLoading(false)
      })
  }, [])

  const recentTickets = Array.isArray(tickets)
    ? [...tickets]
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 5)
    : []

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="DASHBOARD"
        title="IT Support Dashboard"
        subtitle="Welcome back, IT Administrator — here's your system overview"
      />

      {loading ? (
        <div
          style={{
            color: 'var(--text-muted)',
            padding: '3rem',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}
        >
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* STAT CARDS — purple family palette, each card a distinct shade */}
          <div
            className="stats-grid"
            style={{
              marginBottom: '1.4rem',
            }}
          >
            <BigStatCard
              icon={Ticket}
              label="Total Tickets"
              value={stats.total}
              sub="All time"
              color="#7c3aed"
              onClick={() => router.push('/admin/tickets')}
            />

            <BigStatCard
              icon={MailOpen}
              label="Open"
              value={stats.open}
              sub="Awaiting assignment"
              color="#a855f7"
              onClick={() => router.push('/admin/tickets?status=open')}
            />

            <BigStatCard
              icon={AlertTriangle}
              label="Critical Open"
              value={stats.critical}
              sub="Needs immediate action"
              color="#e11d48"
              onClick={() => router.push('/admin/tickets?status=open&priority=critical')}
            />

            <BigStatCard
              icon={Settings}
              label="In Progress"
              value={stats.in_progress}
              sub="Being worked on"
              color="#f59e0b"
              onClick={() => router.push('/admin/tickets?status=in-progress')}
            />

            <BigStatCard
              icon={CheckCircle2}
              label="Resolved"
              value={stats.resolved}
              sub="Successfully closed"
              color="#10b981"
              onClick={() => router.push('/admin/tickets?status=resolved')}
            />

            <BigStatCard
              icon={Archive}
              label="Closed"
              value={stats.closed}
              sub="Archived"
              color="#6366f1"
              onClick={() => router.push('/admin/tickets?status=closed')}
            />
          </div>

          {/* RECENT TICKETS */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.4rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--text-main)',
                }}
              >
                Recent Tickets
              </span>

              <Link
                href="/admin/tickets"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--red-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View All →
              </Link>
            </div>

            {/* DESKTOP: full table */}
            <div className="desktop-table-wrap" style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Ticket ID',
                      'Subject',
                      'Employee',
                      'Department',
                      'Priority',
                      'Status',
                      'Created',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '9px 1rem',
                          textAlign: 'left',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                          background: 'var(--bg-mid)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    recentTickets.map((t: any) => (
                      <tr
                        key={t._id}
                        style={{
                          borderBottom: '1px solid var(--border-mid)',
                        }}
                      >
                        <td style={{ padding: '10px 1rem', fontFamily: 'IBM Plex Mono', color: 'var(--red-primary)', fontWeight: 600 }}>
                          {t.ticket_no}
                        </td>

                        <td style={{ padding: '10px 1rem' }}>
                          {t.subject}
                        </td>

                        <td style={{ padding: '10px 1rem' }}>
                          {t.emp_name || 'Unknown'}
                        </td>

                        <td style={{ padding: '10px 1rem' }}>
                          {t.department || 'N/A'}
                        </td>

                        <td style={{ padding: '10px 1rem' }}>
                          <Badge
                            text={t.priority}
                            color={PRIORITY_COLOR[t.priority] ?? '#64748B'}
                          />
                        </td>

                        <td style={{ padding: '10px 1rem' }}>
                          <Badge
                            text={STATUS_LABEL[t.status] ?? t.status}
                            color={STATUS_COLOR[t.status] ?? '#64748B'}
                          />
                        </td>

                        <td style={{ padding: '10px 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {t.created_at
                            ? new Date(t.created_at).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE: stacked card list */}
            <div className="mobile-ticket-list" style={{ display: 'none', flexDirection: 'column', padding: '0.6rem' }}>
              {recentTickets.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No tickets found
                </div>
              ) : (
                recentTickets.map((t: any) => (
                  <div
                    key={t._id}
                    style={{
                      border: '1px solid var(--border-mid)',
                      borderRadius: 10,
                      padding: '0.8rem 0.9rem',
                      marginBottom: '0.6rem',
                      background: 'var(--bg-mid)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', color: 'var(--red-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                        {t.ticket_no}
                      </span>
                      <Badge text={STATUS_LABEL[t.status] ?? t.status} color={STATUS_COLOR[t.status] ?? '#64748B'} />
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                      {t.subject}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <span>{t.emp_name || 'Unknown'}</span>
                      <span>·</span>
                      <span>{t.department || 'N/A'}</span>
                      <Badge text={t.priority} color={PRIORITY_COLOR[t.priority] ?? '#64748B'} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '0.75rem 1.4rem',
                borderTop: '1px solid var(--border)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              Showing {recentTickets.length} recent tickets
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}