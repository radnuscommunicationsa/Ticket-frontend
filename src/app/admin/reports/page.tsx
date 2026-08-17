'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import api from '@/lib/api'
import {
  Ticket,
  Inbox,
  Settings,
  CheckCircle2,
  Lock,
  Package,
  Link2,
  Download,
  AlertTriangle,
  BarChart3,
  Clock,
  Target,
  ShieldCheck,
  AlertCircle,
  Activity,
  Users,
  Wrench,
  TrendingUp,
} from 'lucide-react'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [
  CURRENT_YEAR,
  CURRENT_YEAR - 1,
  CURRENT_YEAR - 2,
]

/* =========================================================
   TYPES
========================================================= */

interface TicketStats {
  total: number
  open: number
  open_c?: number
  inprog: number
  resolved: number
  closed: number

  pending?: number
  critical?: number
  high?: number
  medium?: number
  low?: number

  resolutionRate?: number
  closureRate?: number
  slaCompliance?: number
  avgResolutionTime?: number
  slaBreached?: number
}

interface EmployeeReport {
  name: string
  department?: string
  total: number
  open?: number
  inProgress?: number
  resolved?: number
  closed?: number
  resolutionRate?: number
}

interface AssetStats {
  total: number
  available: number
  assigned: number

  working?: number
  notInUse?: number
  underRepair?: number
  damaged?: number
  missing?: number

  laptops?: number
  desktops?: number
  monitors?: number
  printers?: number
  accessories?: number
}

interface DepartmentReport {
  department: string
  total: number
  open?: number
  inProgress?: number
  resolved?: number
  closed?: number
}

interface PriorityReport {
  critical: number
  high: number
  medium: number
  low: number
}

interface MonthlyTrend {
  month: string
  total: number
  resolved: number
  closed: number
}

interface ReportData {
  tkt?: TicketStats
  empData?: EmployeeReport[]
  assetData?: AssetStats
  departmentData?: DepartmentReport[]
  priorityData?: PriorityReport
  monthlyTrend?: MonthlyTrend[]
}

/* =========================================================
   HELPERS
========================================================= */

const num = (value: any): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const percentage = (value: number, total: number): number => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const formatHours = (hours: number): string => {
  if (!hours) return '0 hrs'

  if (hours < 1) {
    return `${Math.round(hours * 60)} mins`
  }

  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`
  }

  return `${(hours / 24).toFixed(1)} days`
}

/* =========================================================
   PDF EXPORT
========================================================= */

function downloadPDF(
  data: ReportData,
  month: number,
  year: number
) {
  const doc = new jsPDF()

  const tkt = data.tkt ?? {
    total: 0,
    open: 0,
    inprog: 0,
    resolved: 0,
    closed: 0,
  }

  const asset = data.assetData

  const pending =
    tkt.pending ??
    num(tkt.open_c ?? tkt.open) + num(tkt.inprog)

  const resolutionRate =
    tkt.resolutionRate ??
    percentage(tkt.resolved, tkt.total)

  const closureRate =
    tkt.closureRate ??
    percentage(tkt.closed, tkt.total)

  doc.setFontSize(20)
  doc.setTextColor(30)
  doc.text(
    `IT Management Report - ${MONTHS[month]} ${year}`,
    14,
    20
  )

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    28
  )

  /* KPI */

  doc.setFontSize(13)
  doc.setTextColor(30)
  doc.text('IT KPI Summary', 14, 40)

  autoTable(doc, {
    startY: 44,
    head: [[
      'Tickets',
      'Pending',
      'Resolution %',
      'Closure %',
      'SLA %',
      'Avg Resolution',
    ]],
    body: [[
      tkt.total,
      pending,
      `${resolutionRate}%`,
      `${closureRate}%`,
      `${num(tkt.slaCompliance)}%`,
      formatHours(num(tkt.avgResolutionTime)),
    ]],
    headStyles: {
      fillColor: [198, 40, 40],
    },
  })

  /* Ticket Summary */

  let y = (doc as any).lastAutoTable.finalY + 12

  doc.setFontSize(13)
  doc.text('Ticket Status', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [[
      'Total',
      'Open',
      'In Progress',
      'Resolved',
      'Closed',
    ]],
    body: [[
      tkt.total,
      num(tkt.open_c ?? tkt.open),
      tkt.inprog,
      tkt.resolved,
      tkt.closed,
    ]],
    headStyles: {
      fillColor: [21, 101, 192],
    },
  })

  /* Priority */

  y = (doc as any).lastAutoTable.finalY + 12

  doc.setFontSize(13)
  doc.text('Priority Analysis', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [[
      'Critical',
      'High',
      'Medium',
      'Low',
    ]],
    body: [[
      num(data.priorityData?.critical ?? tkt.critical),
      num(data.priorityData?.high ?? tkt.high),
      num(data.priorityData?.medium ?? tkt.medium),
      num(data.priorityData?.low ?? tkt.low),
    ]],
    headStyles: {
      fillColor: [230, 81, 0],
    },
  })

  /* Employee */

  if (data.empData?.length) {
    doc.addPage()

    doc.setFontSize(13)
    doc.text('Employee Activity', 14, 20)

    autoTable(doc, {
      startY: 25,
      head: [[
        'Employee',
        'Department',
        'Total',
        'Open',
        'In Progress',
        'Resolved',
        'Closed',
      ]],
      body: data.empData.map((e) => [
        e.name,
        e.department ?? '—',
        e.total,
        e.open ?? 0,
        e.inProgress ?? 0,
        e.resolved ?? 0,
        e.closed ?? 0,
      ]),
      headStyles: {
        fillColor: [63, 81, 181],
      },
    })
  }

  /* Department */

  if (data.departmentData?.length) {
    doc.addPage()

    doc.setFontSize(13)
    doc.text('Department-wise IT Support', 14, 20)

    autoTable(doc, {
      startY: 25,
      head: [[
        'Department',
        'Total',
        'Open',
        'In Progress',
        'Resolved',
        'Closed',
      ]],
      body: data.departmentData.map((d) => [
        d.department,
        d.total,
        d.open ?? 0,
        d.inProgress ?? 0,
        d.resolved ?? 0,
        d.closed ?? 0,
      ]),
      headStyles: {
        fillColor: [123, 31, 162],
      },
    })
  }

  /* Assets */

  if (asset) {
    doc.addPage()

    doc.setFontSize(13)
    doc.text('Asset Overview', 14, 20)

    autoTable(doc, {
      startY: 25,
      head: [[
        'Total',
        'Assigned',
        'Available',
        'Working',
        'Not in Use',
        'Under Repair',
        'Damaged',
      ]],
      body: [[
        asset.total,
        asset.assigned,
        asset.available,
        asset.working ?? 0,
        asset.notInUse ?? 0,
        asset.underRepair ?? 0,
        asset.damaged ?? 0,
      ]],
      headStyles: {
        fillColor: [46, 125, 50],
      },
    })
  }

  doc.save(
    `IT-Report-${MONTHS[month]}-${year}.pdf`
  )
}

/* =========================================================
   EXCEL EXPORT
========================================================= */

function downloadExcel(
  data: ReportData,
  month: number,
  year: number
) {
  const wb = XLSX.utils.book_new()

  const tkt = data.tkt ?? {
    total: 0,
    open: 0,
    inprog: 0,
    resolved: 0,
    closed: 0,
  }

  const pending =
    tkt.pending ??
    num(tkt.open_c ?? tkt.open) + num(tkt.inprog)

  const resolutionRate =
    tkt.resolutionRate ??
    percentage(tkt.resolved, tkt.total)

  const closureRate =
    tkt.closureRate ??
    percentage(tkt.closed, tkt.total)

  /* Sheet 1 - KPI */

  const kpiSheet = XLSX.utils.json_to_sheet([
    {
      Month: MONTHS[month],
      Year: year,
      'Total Tickets': tkt.total,
      Open: num(tkt.open_c ?? tkt.open),
      'In Progress': tkt.inprog,
      Resolved: tkt.resolved,
      Closed: tkt.closed,
      Pending: pending,
      'Resolution %': `${resolutionRate}%`,
      'Closure %': `${closureRate}%`,
      'SLA Compliance': `${num(tkt.slaCompliance)}%`,
      'SLA Breached': num(tkt.slaBreached),
      'Avg Resolution Time':
        formatHours(num(tkt.avgResolutionTime)),
    },
  ])

  XLSX.utils.book_append_sheet(
    wb,
    kpiSheet,
    'IT KPI'
  )

  /* Sheet 2 - Ticket Summary */

  const ticketSheet = XLSX.utils.json_to_sheet([
    {
      Total: tkt.total,
      Open: num(tkt.open_c ?? tkt.open),
      'In Progress': tkt.inprog,
      Resolved: tkt.resolved,
      Closed: tkt.closed,
      Pending: pending,
      Critical: num(tkt.critical),
      High: num(tkt.high),
      Medium: num(tkt.medium),
      Low: num(tkt.low),
    },
  ])

  XLSX.utils.book_append_sheet(
    wb,
    ticketSheet,
    'Ticket Summary'
  )

  /* Sheet 3 - Employees */

  if (data.empData?.length) {
    const empSheet = XLSX.utils.json_to_sheet(
      data.empData.map((e) => ({
        Employee: e.name,
        Department: e.department ?? '—',
        Total: e.total,
        Open: e.open ?? 0,
        'In Progress': e.inProgress ?? 0,
        Resolved: e.resolved ?? 0,
        Closed: e.closed ?? 0,
        'Resolution %':
          e.resolutionRate ??
          percentage(
            e.resolved ?? 0,
            e.total
          ),
      }))
    )

    XLSX.utils.book_append_sheet(
      wb,
      empSheet,
      'Employee Activity'
    )
  }

  /* Sheet 4 - Department */

  if (data.departmentData?.length) {
    const departmentSheet =
      XLSX.utils.json_to_sheet(
        data.departmentData.map((d) => ({
          Department: d.department,
          Total: d.total,
          Open: d.open ?? 0,
          'In Progress': d.inProgress ?? 0,
          Resolved: d.resolved ?? 0,
          Closed: d.closed ?? 0,
        }))
      )

    XLSX.utils.book_append_sheet(
      wb,
      departmentSheet,
      'Department'
    )
  }

  /* Sheet 5 - Assets */

  if (data.assetData) {
    const a = data.assetData

    const assetSheet = XLSX.utils.json_to_sheet([
      {
        'Total Assets': a.total,
        Assigned: a.assigned,
        Available: a.available,
        Working: a.working ?? 0,
        'Not in Use': a.notInUse ?? 0,
        'Under Repair': a.underRepair ?? 0,
        Damaged: a.damaged ?? 0,
        Missing: a.missing ?? 0,
        Laptops: a.laptops ?? 0,
        Desktops: a.desktops ?? 0,
        Monitors: a.monitors ?? 0,
        Printers: a.printers ?? 0,
        Accessories: a.accessories ?? 0,
      },
    ])

    XLSX.utils.book_append_sheet(
      wb,
      assetSheet,
      'Asset Overview'
    )
  }

  /* Sheet 6 - Monthly Trend */

  if (data.monthlyTrend?.length) {
    const trendSheet = XLSX.utils.json_to_sheet(
      data.monthlyTrend
    )

    XLSX.utils.book_append_sheet(
      wb,
      trendSheet,
      'Monthly Trend'
    )
  }

  XLSX.writeFile(
    wb,
    `IT-Report-${MONTHS[month]}-${year}.xlsx`
  )
}

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accentColor?: string
  subtitle?: string
}

function StatCard({
  label,
  value,
  icon,
  accentColor = '#C62828',
  subtitle,
}: StatCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-mid)',
        padding: 18,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: accentColor,
            opacity: 0.8,
          }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: '2rem',
          fontWeight: 900,
          fontFamily: 'IBM Plex Mono, monospace',
          color: accentColor,
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 5,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SECTION
========================================================= */

function SectionCard({
  title,
  children,
  count,
}: {
  title: string
  children: React.ReactNode
  count?: number
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(198,40,40,0.04)',
        }}
      >
        <h2
          style={{
            fontSize: '0.87rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: 0,
          }}
        >
          {title}
        </h2>

        {count !== undefined && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 20,
              background: 'rgba(198,40,40,0.12)',
              color: 'var(--red-primary)',
            }}
          >
            {count}
          </span>
        )}
      </div>

      {children}
    </div>
  )
}

/* =========================================================
   PROGRESS BAR
========================================================= */

function ProgressBar({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: string
}) {
  const safeValue = Math.min(
    100,
    Math.max(0, value)
  )

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 20,
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: '100%',
            background: color,
            borderRadius: 20,
            transition: 'width .3s ease',
          }}
        />
      </div>
    </div>
  )
}

/* =========================================================
   EMPLOYEE TABLE
========================================================= */

function EmployeeTable({
  employees,
}: {
  employees: EmployeeReport[]
}) {
  if (!employees.length) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        No employee data for this period.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            {[
              'Employee',
              'Department',
              'Total',
              'Open',
              'In Progress',
              'Resolved',
              'Closed',
              'Resolution %',
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 15px',
                  textAlign: 'left',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-mid)',
                  borderBottom:
                    '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {employees.map((emp, index) => {
            const rate =
              emp.resolutionRate ??
              percentage(
                emp.resolved ?? 0,
                emp.total
              )

            return (
              <tr
                key={`${emp.name}-${index}`}
                style={{
                  borderBottom:
                    '1px solid var(--border-mid)',
                }}
              >
                <td style={{ padding: '12px 15px' }}>
                  <strong
                    style={{
                      fontSize: '0.82rem',
                    }}
                  >
                    {emp.name}
                  </strong>
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.department ?? '—'}
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.total}
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.open ?? 0}
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.inProgress ?? 0}
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.resolved ?? 0}
                </td>

                <td style={{ padding: '12px 15px' }}>
                  {emp.closed ?? 0}
                </td>

                <td
                  style={{
                    padding: '12px 15px',
                    fontWeight: 700,
                    color:
                      rate >= 80
                        ? '#2E7D32'
                        : '#E65100',
                  }}
                >
                  {rate}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminReports() {
  const [year, setYear] =
    useState<number>(CURRENT_YEAR)

  const [month, setMonth] =
    useState<number>(
      new Date().getMonth() + 1
    )

  const [data, setData] =
    useState<ReportData | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [loaded, setLoaded] =
    useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: res } =
        await api.get<ReportData>(
          '/reports',
          {
            params: {
              year,
              month,
            },
          }
        )

      setData(res ?? null)
      setLoaded(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          'Failed to load report data.'
      )
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [])

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const tkt = data?.tkt

  const totalTickets = num(tkt?.total)

  const openTickets = num(
    tkt?.open_c ?? tkt?.open
  )

  const inProgress = num(tkt?.inprog)

  const resolved = num(tkt?.resolved)

  const closed = num(tkt?.closed)

  const pending =
    tkt?.pending ??
    openTickets + inProgress

  const resolutionRate =
    tkt?.resolutionRate ??
    percentage(
      resolved,
      totalTickets
    )

  const closureRate =
    tkt?.closureRate ??
    percentage(
      closed,
      totalTickets
    )

  const slaCompliance =
    num(tkt?.slaCompliance)

  const avgResolution =
    num(tkt?.avgResolutionTime)

  const asset = data?.assetData

  const assetUtilization =
    asset?.total
      ? percentage(
          asset.assigned,
          asset.total
        )
      : 0

  const priority =
    data?.priorityData ?? {
      critical: num(tkt?.critical),
      high: num(tkt?.high),
      medium: num(tkt?.medium),
      low: num(tkt?.low),
    }

  return (
    <AppLayout role="admin">
      <div
        style={{
          padding: '2rem',
          minHeight: '100vh',
          background: 'var(--bg-main)',
          fontFamily: 'sans-serif',
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--red-primary)',
              marginBottom: 8,
            }}
          >
            TicketDesk / Reports
          </div>

          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              margin: 0,
            }}
          >
            IT Management Report
          </h1>

          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: 5,
            }}
          >
            System-wide IT support, asset and
            performance overview
          </p>
        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-mid)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <strong
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            REPORT PERIOD
          </strong>

          <select
            value={month}
            onChange={(e) =>
              setMonth(
                Number(e.target.value)
              )
            }
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border:
                '1px solid var(--border)',
              background: 'var(--bg-mid)',
              color: 'var(--text-main)',
            }}
          >
            {Object.entries(MONTHS).map(
              ([key, value]) => (
                <option
                  key={key}
                  value={key}
                >
                  {value}
                </option>
              )
            )}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setYear(
                Number(e.target.value)
              )
            }
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border:
                '1px solid var(--border)',
              background: 'var(--bg-mid)',
              color: 'var(--text-main)',
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background:
                'var(--red-primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {loading
              ? 'Loading...'
              : 'Load Report'}
          </button>

          {loaded && data && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                {MONTHS[month]} {year}
              </span>

              <button
                onClick={() =>
                  downloadPDF(
                    data,
                    month,
                    year
                  )
                }
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  padding:
                    '8px 14px',
                  borderRadius: 8,
                  border:
                    '1px solid rgba(198,40,40,.3)',
                  background:
                    'rgba(198,40,40,.08)',
                  color: '#C62828',
                  fontWeight: 700,
                }}
              >
                <Download size={14} />
                PDF
              </button>

              <button
                onClick={() =>
                  downloadExcel(
                    data,
                    month,
                    year
                  )
                }
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  padding:
                    '8px 14px',
                  borderRadius: 8,
                  border:
                    '1px solid rgba(46,125,50,.3)',
                  background:
                    'rgba(46,125,50,.08)',
                  color: '#2E7D32',
                  fontWeight: 700,
                }}
              >
                <Download size={14} />
                Excel
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              padding: 14,
              marginBottom: 20,
              borderRadius: 8,
              color: '#C62828',
              background:
                'rgba(198,40,40,.08)',
              border:
                '1px solid rgba(198,40,40,.3)',
            }}
          >
            <AlertTriangle
              size={16}
              style={{
                verticalAlign: 'middle',
                marginRight: 8,
              }}
            />
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div
            style={{
              padding: 50,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            Loading report...
          </div>
        )}

        {/* =================================================
            REPORT
        ================================================= */}

        {!loading && data && (
          <>

            {/* KPI */}

            <SectionCard title="IT KPI Overview">

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(180px,1fr))',
                  gap: 14,
                  padding: 20,
                }}
              >
                <StatCard
                  label="Total Tickets"
                  value={totalTickets}
                  icon={<Ticket size={18} />}
                />

                <StatCard
                  label="Pending"
                  value={pending}
                  accentColor="#E65100"
                  icon={
                    <AlertCircle
                      size={18}
                    />
                  }
                />

                <StatCard
                  label="Resolution Rate"
                  value={`${resolutionRate}%`}
                  accentColor="#2E7D32"
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                />

                <StatCard
                  label="Closure Rate"
                  value={`${closureRate}%`}
                  accentColor="#1565C0"
                  icon={<Lock size={18} />}
                />

                <StatCard
                  label="SLA Compliance"
                  value={`${slaCompliance}%`}
                  accentColor="#6A1B9A"
                  icon={
                    <ShieldCheck
                      size={18}
                    />
                  }
                />

                <StatCard
                  label="Avg Resolution"
                  value={formatHours(
                    avgResolution
                  )}
                  accentColor="#00838F"
                  icon={
                    <Clock size={18} />
                  }
                />
              </div>

            </SectionCard>

            {/* TICKET STATUS */}

            <SectionCard title="Ticket Status">

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(160px,1fr))',
                  gap: 14,
                  padding: 20,
                }}
              >
                <StatCard
                  label="Open"
                  value={openTickets}
                  accentColor="#E65100"
                  icon={<Inbox size={18} />}
                />

                <StatCard
                  label="In Progress"
                  value={inProgress}
                  accentColor="#1565C0"
                  icon={
                    <Settings
                      size={18}
                    />
                  }
                />

                <StatCard
                  label="Resolved"
                  value={resolved}
                  accentColor="#2E7D32"
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                />

                <StatCard
                  label="Closed"
                  value={closed}
                  accentColor="#546E7A"
                  icon={<Lock size={18} />}
                />
              </div>

            </SectionCard>

            {/* PRIORITY */}

            <SectionCard title="Priority Analysis">

              <div
                style={{
                  padding: 20,
                }}
              >
                <ProgressBar
                  label={`Critical (${priority.critical})`}
                  value={percentage(
                    priority.critical,
                    totalTickets
                  )}
                  color="#B71C1C"
                />

                <ProgressBar
                  label={`High (${priority.high})`}
                  value={percentage(
                    priority.high,
                    totalTickets
                  )}
                  color="#E65100"
                />

                <ProgressBar
                  label={`Medium (${priority.medium})`}
                  value={percentage(
                    priority.medium,
                    totalTickets
                  )}
                  color="#F9A825"
                />

                <ProgressBar
                  label={`Low (${priority.low})`}
                  value={percentage(
                    priority.low,
                    totalTickets
                  )}
                  color="#2E7D32"
                />
              </div>

            </SectionCard>

            {/* DEPARTMENT */}

            <SectionCard
              title="Department-wise IT Support"
              count={
                data.departmentData
                  ?.length ?? 0
              }
            >

              {data.departmentData?.length ? (
                <div
                  style={{
                    overflowX: 'auto',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse:
                        'collapse',
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          'Department',
                          'Total',
                          'Open',
                          'In Progress',
                          'Resolved',
                          'Closed',
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: 12,
                              textAlign:
                                'left',
                              fontSize:
                                '0.65rem',
                              color:
                                'var(--text-muted)',
                              borderBottom:
                                '1px solid var(--border)',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {data.departmentData.map(
                        (d, i) => (
                          <tr key={i}>
                            <td
                              style={{
                                padding: 12,
                                fontWeight: 700,
                              }}
                            >
                              {d.department}
                            </td>

                            <td style={{ padding: 12 }}>
                              {d.total}
                            </td>

                            <td style={{ padding: 12 }}>
                              {d.open ?? 0}
                            </td>

                            <td style={{ padding: 12 }}>
                              {d.inProgress ?? 0}
                            </td>

                            <td style={{ padding: 12 }}>
                              {d.resolved ?? 0}
                            </td>

                            <td style={{ padding: 12 }}>
                              {d.closed ?? 0}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    padding: 35,
                    textAlign: 'center',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  No department data available.
                </div>
              )}

            </SectionCard>

            {/* EMPLOYEE */}

            <SectionCard
              title="Employee Activity"
              count={
                data.empData?.length ?? 0
              }
            >
              <EmployeeTable
                employees={
                  data.empData ?? []
                }
              />
            </SectionCard>

            {/* ASSETS */}

            <SectionCard title="IT Asset Overview">

              {asset ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit,minmax(170px,1fr))',
                      gap: 14,
                      padding: 20,
                    }}
                  >
                    <StatCard
                      label="Total Assets"
                      value={asset.total}
                      icon={
                        <Package
                          size={18}
                        />
                      }
                    />

                    <StatCard
                      label="Assigned"
                      value={asset.assigned}
                      accentColor="#1565C0"
                      icon={
                        <Link2
                          size={18}
                        />
                      }
                    />

                    <StatCard
                      label="Available"
                      value={asset.available}
                      accentColor="#2E7D32"
                      icon={
                        <CheckCircle2
                          size={18}
                        />
                      }
                    />

                    <StatCard
                      label="Working"
                      value={asset.working ?? 0}
                      accentColor="#00838F"
                      icon={
                        <Activity
                          size={18}
                        />
                      }
                    />

                    <StatCard
                      label="Under Repair"
                      value={
                        asset.underRepair ??
                        0
                      }
                      accentColor="#E65100"
                      icon={
                        <Wrench
                          size={18}
                        />
                      }
                    />

                    <StatCard
                      label="Damaged"
                      value={
                        asset.damaged ?? 0
                      }
                      accentColor="#B71C1C"
                      icon={
                        <AlertTriangle
                          size={18}
                        />
                      }
                    />
                  </div>

                  <div
                    style={{
                      padding:
                        '0 20px 20px',
                    }}
                  >
                    <ProgressBar
                      label={`Asset Utilization - ${asset.assigned} / ${asset.total}`}
                      value={
                        assetUtilization
                      }
                      color="#1565C0"
                    />
                  </div>

                  {/* Asset Categories */}

                  <div
                    style={{
                      padding:
                        '0 20px 20px',
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit,minmax(130px,1fr))',
                      gap: 10,
                    }}
                  >
                    {[
                      [
                        'Laptops',
                        asset.laptops,
                      ],
                      [
                        'CPU',
                        asset.desktops,
                      ],
                      [
                        'Monitors',
                        asset.monitors,
                      ],
                      [
                        'Printers',
                        asset.printers,
                      ],
                      [
                        'Accessories',
                        asset.accessories,
                      ],
                    ].map(
                      ([label, value]) => (
                        <div
                          key={String(label)}
                          style={{
                            padding: 14,
                            border:
                              '1px solid var(--border)',
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                '0.65rem',
                              color:
                                'var(--text-muted)',
                              textTransform:
                                'uppercase',
                            }}
                          >
                            {label}
                          </div>

                          <div
                            style={{
                              marginTop: 5,
                              fontSize:
                                '1.3rem',
                              fontWeight: 800,
                            }}
                          >
                            {num(value)}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                </>
              ) : (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  No asset data available.
                </div>
              )}

            </SectionCard>

            {/* MANAGEMENT SUMMARY */}

            <SectionCard title="Management Summary">

              <div
                style={{
                  padding: 20,
                  lineHeight: 1.7,
                  fontSize: '0.85rem',
                  color:
                    'var(--text-main)',
                }}
              >
                During{' '}
                <strong>
                  {MONTHS[month]} {year}
                </strong>
                , a total of{' '}
                <strong>
                  {totalTickets}
                </strong>{' '}
                IT tickets were recorded.

                {' '}

                <strong>
                  {resolved}
                </strong>{' '}
                tickets were resolved and{' '}
                <strong>
                  {pending}
                </strong>{' '}
                tickets remain pending.

                {' '}

                The current ticket resolution
                rate is{' '}
                <strong>
                  {resolutionRate}%
                </strong>{' '}
                and closure rate is{' '}
                <strong>
                  {closureRate}%
                </strong>
                .

                {asset && (
                  <>
                    {' '}
                    The IT inventory currently
                    contains{' '}
                    <strong>
                      {asset.total}
                    </strong>{' '}
                    assets, with{' '}
                    <strong>
                      {asset.assigned}
                    </strong>{' '}
                    assigned to employees.
                  </>
                )}
              </div>

            </SectionCard>

          </>
        )}

        {/* EMPTY */}

        {!loading &&
          !data &&
          !error && (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                borderRadius: 12,
                border:
                  '1px solid var(--border)',
                color:
                  'var(--text-muted)',
              }}
            >
              <BarChart3
                size={44}
                style={{
                  marginBottom: 12,
                }}
              />

              <p>
                Select a period and click{' '}
                <strong>
                  Load Report
                </strong>
              </p>
            </div>
          )}

      </div>
    </AppLayout>
  )
}