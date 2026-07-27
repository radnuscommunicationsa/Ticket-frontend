'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import api from '@/lib/api'
import { Ticket, Inbox, Settings, CheckCircle2, Lock, Users, Package, Link2, Download, AlertTriangle, BarChart3 } from 'lucide-react'


// ── Install these packages first ──────────────────────────────────
// npm install jspdf jspdf-autotable xlsx
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS: Record<number, string> = {
  1: 'January',  2: 'February', 3: 'March',    4: 'April',
  5: 'May',      6: 'June',     7: 'July',      8: 'August',
  9: 'September',10: 'October', 11: 'November', 12: 'December',
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketStats {
  total: number
  open_c: number
  inprog: number
  resolved: number
  closed: number
}

interface EmployeeReport {
  name: string
  department?: string
  total: number
  open?: number
  resolved?: number
}

interface AssetStats {
  total: number
  available: number
  assigned: number
}

interface ReportData {
  tkt?: TicketStats
  empData?: EmployeeReport[]
  assetData?: AssetStats
}

// ─── Download Functions ───────────────────────────────────────────────────────

function downloadPDF(data: ReportData, month: number, year: number) {
  const doc = new jsPDF()
  const title = `Monthly Report - ${MONTHS[month]} ${year}`

  // Title
  doc.setFontSize(18)
  doc.setTextColor(198, 40, 40)
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

  // Ticket Summary
  doc.setFontSize(13)
  doc.setTextColor(30)
  doc.text('Ticket Summary', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Total', 'Open', 'In Progress', 'Resolved', 'Closed']],
    body: [[
      data.tkt?.total    ?? 0,
      data.tkt?.open_c   ?? 0,
      data.tkt?.inprog   ?? 0,
      data.tkt?.resolved ?? 0,
      data.tkt?.closed   ?? 0,
    ]],
    headStyles: { fillColor: [198, 40, 40] },
  })

  // Employee Activity
  if (data.empData?.length) {
    const afterTicket = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(13)
    doc.setTextColor(30)
    doc.text('Employee Activity', 14, afterTicket)

    autoTable(doc, {
      startY: afterTicket + 4,
      head: [['Employee', 'Department', 'Total', 'Open', 'Resolved']],
      body: data.empData.map(e => [
        e.name, e.department ?? '—', e.total, e.open ?? '—', e.resolved ?? '—',
      ]),
      headStyles: { fillColor: [21, 101, 192] },
    })
  }

  // Asset Overview
  if (data.assetData) {
    const afterEmp = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(13)
    doc.setTextColor(30)
    doc.text('Asset Overview', 14, afterEmp)

    autoTable(doc, {
      startY: afterEmp + 4,
      head: [['Total Assets', 'Available', 'Assigned']],
      body: [[
        data.assetData.total,
        data.assetData.available,
        data.assetData.assigned,
      ]],
      headStyles: { fillColor: [46, 125, 50] },
    })
  }

  doc.save(`report-${MONTHS[month]}-${year}.pdf`)
}

function downloadExcel(data: ReportData, month: number, year: number) {
  const wb = XLSX.utils.book_new()

  // Sheet 1 - Ticket Summary
  const ticketSheet = XLSX.utils.json_to_sheet([{
    Total:           data.tkt?.total    ?? 0,
    Open:            data.tkt?.open_c   ?? 0,
    'In Progress':   data.tkt?.inprog   ?? 0,
    Resolved:        data.tkt?.resolved ?? 0,
    Closed:          data.tkt?.closed   ?? 0,
  }])
  XLSX.utils.book_append_sheet(wb, ticketSheet, 'Ticket Summary')

  // Sheet 2 - Employee Activity
  if (data.empData?.length) {
    const empSheet = XLSX.utils.json_to_sheet(
      data.empData.map(e => ({
        Employee:   e.name,
        Department: e.department ?? '—',
        Total:      e.total,
        Open:       e.open    ?? 0,
        Resolved:   e.resolved ?? 0,
      }))
    )
    XLSX.utils.book_append_sheet(wb, empSheet, 'Employee Activity')
  }

  // Sheet 3 - Asset Overview
  if (data.assetData) {
    const assetSheet = XLSX.utils.json_to_sheet([{
      'Total Assets': data.assetData.total,
      Available:      data.assetData.available,
      Assigned:       data.assetData.assigned,
    }])
    XLSX.utils.book_append_sheet(wb, assetSheet, 'Asset Overview')
  }

  XLSX.writeFile(wb, `report-${MONTHS[month]}-${year}.xlsx`)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  color: string
  accentColor: string
  icon: React.ReactNode
}

function StatCard({ label, value, color, accentColor, icon }: StatCardProps) {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--bg-mid)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: accentColor,
        opacity: 0.8,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
        }}>
          {label}
        </span>
        <span style={{ display: 'flex', opacity: 0.75, color: accentColor }}>{icon}</span>
      </div>
      <div style={{
        fontSize: '2.4rem',
        fontWeight: 900,
        fontFamily: 'IBM Plex Mono, monospace',
        color,
        lineHeight: 1,
      }}>
        {value ?? 0}
      </div>
    </div>
  )
}

function SectionCard({ title, children, count }: {
  title: string
  children: React.ReactNode
  count?: number
}) {
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      marginBottom: '1.5rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(198,40,40,0.04)',
      }}>
        <h2 style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {title}
        </h2>
        {count !== undefined && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(198,40,40,0.12)',
            color: 'var(--red-primary)',
          }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function EmployeeTable({ employees }: { employees: EmployeeReport[] }) {
  if (!employees.length) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontSize: '0.85rem',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
      }}>
        No employee data for this period.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Employee', 'Department', 'Total', 'Open', 'Resolved'].map((h) => (
              <th key={h} style={{
                padding: '10px 20px',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                textAlign: 'left' as const,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-mid)',
                whiteSpace: 'nowrap' as const,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-mid)' }}>
              <td style={{ padding: '12px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30,
                    borderRadius: '50%',
                    background: '#1A237E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {emp.name}
                  </span>
                </div>
              </td>
              <td style={{ padding: '12px 20px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 4,
                  border: '1px solid rgba(198,40,40,0.2)',
                  background: 'rgba(198,40,40,0.04)',
                  color: '#B17373',
                }}>
                  {emp.department || '—'}
                </span>
              </td>
              <td style={{ padding: '12px 20px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: '#C62828',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}>
                  {emp.total ?? 0}
                </span>
              </td>
              <td style={{ padding: '12px 20px', fontWeight: 700, color: '#E65100', fontSize: '0.85rem' }}>
                {emp.open ?? '—'}
              </td>
              <td style={{ padding: '12px 20px', fontWeight: 700, color: '#2E7D32', fontSize: '0.85rem' }}>
                {emp.resolved ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingSkeleton() {
  const skeletonBase: React.CSSProperties = {
    borderRadius: 12,
    background: 'var(--bg-mid)',
    opacity: 0.5,
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: '1.5rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ ...skeletonBase, height: 110 }} />
        ))}
      </div>
      <div style={{ ...skeletonBase, height: 180, marginBottom: '1.5rem' }} />
      <div style={{ ...skeletonBase, height: 120 }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const [year, setYear]       = useState<number>(CURRENT_YEAR)
  const [month, setMonth]     = useState<number>(new Date().getMonth() + 1)
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loaded, setLoaded]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get<ReportData>('/reports', { params: { year, month } })
      setData(res ?? null)
      setLoaded(true)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load report data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [])

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-mid)',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  }

  const ticketCards: StatCardProps[] = [
    { label: 'Total',       value: data?.tkt?.total    ?? 0, color: '#C62828', accentColor: '#C62828', icon: <Ticket size={18}/> },
    { label: 'Open',        value: data?.tkt?.open_c   ?? 0, color: '#E65100', accentColor: '#E65100', icon: <Inbox size={18}/> },
    { label: 'In Progress', value: data?.tkt?.inprog   ?? 0, color: '#1565C0', accentColor: '#1565C0', icon: <Settings size={18}/> },
    { label: 'Resolved',    value: data?.tkt?.resolved ?? 0, color: '#2E7D32', accentColor: '#2E7D32', icon: <CheckCircle2 size={18}/> },
    { label: 'Closed',      value: data?.tkt?.closed   ?? 0, color: '#546E7A', accentColor: '#546E7A', icon: <Lock size={18}/> },
  ]

  const assetCards: StatCardProps[] = [
    { label: 'Total Assets', value: data?.assetData?.total     ?? 0, color: '#C62828', accentColor: '#C62828', icon: <Package size={18}/> },
    { label: 'Available',    value: data?.assetData?.available ?? 0, color: '#2E7D32', accentColor: '#2E7D32', icon: <CheckCircle2 size={18}/> },
    { label: 'Assigned',     value: data?.assetData?.assigned  ?? 0, color: '#1565C0', accentColor: '#1565C0', icon: <Link2 size={18}/> },
  ]

  return (
    <AppLayout role="admin">
      <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: 'sans-serif' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <nav style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--red-primary)',
            marginBottom: 8,
          }}>
            TicketDesk / Reports
          </nav>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'var(--text-main)',
            margin: 0,
          }}>
            Monthly Reports
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            System-wide activity overview by month
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-mid)',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginRight: 4,
          }}>
            Period
          </span>

          <select style={selectStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Object.entries(MONTHS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select style={selectStyle} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--red-primary)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Loading…' : 'Load Report'}
          </button>

          {/* ── Showing label + Download buttons (appear after data loads) ── */}
          {loaded && !loading && data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing:{' '}
                <strong style={{ color: 'var(--text-main)' }}>{MONTHS[month]} {year}</strong>
              </span>

              {/* PDF Download */}
              <button
  onClick={() => downloadPDF(data, month, year)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(198,40,40,0.3)',
    background: 'rgba(198,40,40,0.08)',
    color: '#C62828',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
  }}
>
  <Download size={14}/> PDF
</button>

              {/* Excel Download */}
              <button
  onClick={() => downloadExcel(data, month, year)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(46,125,50,0.3)',
    background: 'rgba(46,125,50,0.08)',
    color: '#2E7D32',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
  }}
>
  <Download size={14}/> Excel
</button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: '1.5rem',
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid rgba(198,40,40,0.3)',
  background: 'rgba(198,40,40,0.08)',
  color: '#C62828',
  fontSize: '0.85rem',
  fontWeight: 500,
}} role="alert">
  <AlertTriangle size={16}/> {error}
</div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Report Content */}
        {!loading && data && (
          <>
            {/* Ticket Summary */}
            <SectionCard title="Ticket Summary">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 16,
                padding: 20,
              }}>
                {ticketCards.map((card) => <StatCard key={card.label} {...card} />)}
              </div>
            </SectionCard>

            {/* Employee Activity */}
            <SectionCard title="Employee Activity" count={data.empData?.length ?? 0}>
              <EmployeeTable employees={data.empData ?? []} />
            </SectionCard>

            {/* Asset Overview */}
            <SectionCard title=" Asset Overview">
              {data.assetData ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  padding: 20,
                }}>
                  {assetCards.map((card) => <StatCard key={card.label} {...card} />)}
                </div>
              ) : (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                }}>
                  No asset data for this period.
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* Initial empty state */}
        {!loading && !data && !error && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: 12,
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}>
            <BarChart3 size={44} strokeWidth={1.5} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }}/>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
              Select a period and click{' '}
              <strong style={{ color: 'var(--text-main)' }}>Load Report</strong>
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  )
}