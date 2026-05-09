'use client'

import { useState, useEffect } from 'react'
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
}: {
  icon: any
  label: string
  value: number
  sub: string
  color: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${color}33`,
        borderRadius: 16,
        padding: '1.6rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 8px 32px ${color}30`
          : `0 4px 24px ${color}18`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          width: 54,
          height: 54,
          borderRadius: 14,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={30} color={color} strokeWidth={1.8} />
      </div>

      <div
        style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? 0}
      </div>

      <div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  open: '#3B82F6',
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

  // ─────────────────────────────────────────────────────────────
  // LOAD DATA
  // ─────────────────────────────────────────────────────────────
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

  // ✅ SAFE SORT
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
          {/* STAT CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.1rem',
              marginBottom: '1.8rem',
            }}
          >
            <BigStatCard
              icon={Ticket}
              label="Total Tickets"
              value={stats.total}
              sub="All time"
              color="#c62828"
            />

            <BigStatCard
              icon={MailOpen}
              label="Open"
              value={stats.open}
              sub="Awaiting assignment"
              color="#e65100"
            />

            <BigStatCard
              icon={AlertTriangle}
              label="Critical Open"
              value={stats.critical}
              sub="Needs immediate action"
              color="#b71c1c"
            />

            <BigStatCard
              icon={Settings}
              label="In Progress"
              value={stats.in_progress}
              sub="Being worked on"
              color="#1565c0"
            />

            <BigStatCard
              icon={CheckCircle2}
              label="Resolved"
              value={stats.resolved}
              sub="Successfully closed"
              color="#2e7d32"
            />

            <BigStatCard
              icon={Archive}
              label="Closed"
              value={stats.closed}
              sub="Archived"
              color="#37474f"
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
                  color: 'var(--primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View All →
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
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
                          background: 'var(--bg)',
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
                        <td style={{ padding: '10px 1rem' }}>
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

                        <td style={{ padding: '10px 1rem' }}>
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