'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import AppLayout from '@/components/AppLayout'

import {
  PageHeader,
  PriorityBadge,
  StatusBadge,
  DeptBadge,
} from '@/components/ui'

import api from '@/lib/api'

import {
  Ticket,
  MailOpen,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Archive,
} from 'lucide-react'

function BigStatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: any) {
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
        boxShadow: `0 4px 24px ${color}18`,
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform =
          'translateY(-3px)'

        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 32px ${color}30`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform =
          'translateY(0)'

        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 4px 24px ${color}18`
      }}
    >
      {/* Background Circle */}
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

      {/* Icon */}
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

      {/* Value */}
      <div
        style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? '—'}
      </div>

      {/* Label */}
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .get('/tickets/stats')
      .then((r) => {
        setStats(r.data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="DASHBOARD"
        title="IT Support Dashboard"
        subtitle="Welcome back, IT Administrator — here's your system overview"
      />

      {loading && (
        <div
          style={{
            color: 'var(--text-muted)',
            padding: '2rem',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}
        >
          Loading dashboard...
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(198,40,40,0.08)',
            border: '1px solid rgba(198,40,40,0.25)',
            borderRadius: 10,
            padding: '1.2rem 1.6rem',
            color: 'var(--red-primary)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          ⚠️ Could not load stats — make sure backend API is
          running.
        </div>
      )}

      {!loading && stats && (
        <>
          {/* STAT CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
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
              value={stats.in_progress ?? stats.inprog}
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
        </>
      )}
    </AppLayout>
  )
}