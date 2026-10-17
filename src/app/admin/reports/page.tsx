'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import api from '@/lib/api'
import {
  Ticket, Inbox, Settings, CheckCircle2, Lock, Package, Link2, Download,
  AlertTriangle, BarChart3, Clock, ShieldCheck, AlertCircle, Activity, Wrench,
  Star, Hourglass, CalendarClock, Archive,
} from 'lucide-react'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
  7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December',
}

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const CURRENT_MONTH = NOW.getMonth() + 1
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

const isFuture = (m: number, y: number) => y === CURRENT_YEAR && m > CURRENT_MONTH

/* =========================================================
   TYPES  (every new field is OPTIONAL, so the page still
   works with the current backend)
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

interface PrevMonthStats {
  total: number
  resolved: number
  closed: number
  pending?: number
  slaCompliance?: number
  avgResolutionTime?: number
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

interface StaffReport {
  name: string
  assigned: number
  resolved: number
  avgResolutionTime?: number
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

interface AssetExtra {
  warrantyExpiring?: number
  idle?: number
  oldAssets?: number
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

interface CategoryReport {
  category: string
  total: number
}

interface SlaBreachedTicket {
  ticketNo?: string
  title: string
  department?: string
  assignedTo?: string
  hoursOver?: number
}

interface AgingStats {
  gt3d?: number
  gt7d?: number
  gt14d?: number
}

interface FeedbackStats {
  avgRating?: number
  count?: number
}

interface ReportData {
  tkt?: TicketStats
  prevMonth?: PrevMonthStats
  empData?: EmployeeReport[]
  staffData?: StaffReport[]
  assetData?: AssetStats
  assetExtra?: AssetExtra
  departmentData?: DepartmentReport[]
  priorityData?: PriorityReport
  monthlyTrend?: MonthlyTrend[]
  categoryData?: CategoryReport[]
  slaBreachedTickets?: SlaBreachedTicket[]
  aging?: AgingStats
  feedback?: FeedbackStats
}

interface Period {
  month: number
  year: number
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

/* Resolution = resolved + closed (a closed ticket was resolved first) */
const resolutionPct = (resolved: number, closed: number, total: number) =>
  percentage(num(resolved) + num(closed), total)

const formatHours = (hours: number): string => {
  if (!hours) return '0 hrs'
  if (hours < 1) return `${Math.round(hours * 60)} mins`
  if (hours < 24) return `${hours.toFixed(1)} hrs`
  return `${(hours / 24).toFixed(1)} days`
}

const prevPeriod = (p: Period): Period =>
  p.month === 1 ? { month: 12, year: p.year - 1 } : { month: p.month - 1, year: p.year }

interface Trend {
  text: string
  good: boolean | null
}

/* % change for counts */
function deltaPct(cur: number, prev: number | undefined, lowerBetter: boolean, label: string): Trend | undefined {
  if (prev === undefined || prev === null) return undefined
  if (!prev) return cur ? { text: `▲ new vs ${label}`, good: lowerBetter ? false : true } : undefined
  const d = Math.round(((cur - prev) / prev) * 100)
  if (d === 0) return { text: `● same as ${label}`, good: null }
  return { text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}% vs ${label}`, good: lowerBetter ? d < 0 : d > 0 }
}

/* point change for rates */
function deltaPts(cur: number, prev: number | undefined, label: string): Trend | undefined {
  if (prev === undefined || prev === null) return undefined
  const d = Math.round(cur - prev)
  if (d === 0) return { text: `● same as ${label}`, good: null }
  return { text: `${d > 0 ? '▲' : '▼'} ${Math.abs(d)} pts vs ${label}`, good: d > 0 }
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}

/* =========================================================
   PDF EXPORT
========================================================= */

function downloadPDF(data: ReportData, period: Period) {
  const { month, year } = period
  const doc = new jsPDF()

  const tkt = data.tkt ?? { total: 0, open: 0, inprog: 0, resolved: 0, closed: 0 }
  const asset = data.assetData

  const pending = tkt.pending ?? num(tkt.open_c ?? tkt.open) + num(tkt.inprog)
  const resolutionRate = tkt.resolutionRate ?? resolutionPct(tkt.resolved, tkt.closed, tkt.total)
  const closureRate = tkt.closureRate ?? percentage(tkt.closed, tkt.total)

  doc.setFontSize(20)
  doc.setTextColor(30)
  doc.text(`IT Management Report - ${MONTHS[month]} ${year}`, 14, 20)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

  doc.setFontSize(13)
  doc.setTextColor(30)
  doc.text('IT KPI Summary', 14, 40)

  autoTable(doc, {
    startY: 44,
    head: [['Tickets', 'Pending', 'Resolution %', 'Closure %', 'SLA %', 'SLA Breached', 'Avg Resolution']],
    body: [[
      tkt.total, pending, `${resolutionRate}%`, `${closureRate}%`,
      `${num(tkt.slaCompliance)}%`, num(tkt.slaBreached), formatHours(num(tkt.avgResolutionTime)),
    ]],
    headStyles: { fillColor: [198, 40, 40] },
  })

  let y = (doc as any).lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.text('Ticket Status', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Total', 'Open', 'In Progress', 'Resolved', 'Closed']],
    body: [[tkt.total, num(tkt.open_c ?? tkt.open), tkt.inprog, tkt.resolved, tkt.closed]],
    headStyles: { fillColor: [21, 101, 192] },
  })

  y = (doc as any).lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.text('Priority Analysis', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Critical', 'High', 'Medium', 'Low']],
    body: [[
      num(data.priorityData?.critical ?? tkt.critical),
      num(data.priorityData?.high ?? tkt.high),
      num(data.priorityData?.medium ?? tkt.medium),
      num(data.priorityData?.low ?? tkt.low),
    ]],
    headStyles: { fillColor: [230, 81, 0] },
  })

  /* Helper: each optional section on its own page */
  const page = (title: string, head: string[], body: (string | number)[][], color: [number, number, number]) => {
    doc.addPage()
    doc.setFontSize(13)
    doc.setTextColor(30)
    doc.text(title, 14, 20)
    autoTable(doc, { startY: 25, head: [head], body, headStyles: { fillColor: color } })
  }

  if (data.monthlyTrend?.length) {
    page('Monthly Trend', ['Month', 'Total', 'Resolved', 'Closed'],
      data.monthlyTrend.map((m) => [m.month, m.total, m.resolved, m.closed]), [21, 101, 192])
  }

  if (data.categoryData?.length) {
    page('Tickets by Category', ['Category', 'Tickets', 'Share'],
      data.categoryData.map((c) => [c.category, c.total, `${percentage(c.total, tkt.total)}%`]), [0, 131, 143])
  }

  if (data.aging) {
    page('Ticket Aging (open tickets)', ['> 3 days', '> 7 days', '> 14 days'],
      [[num(data.aging.gt3d), num(data.aging.gt7d), num(data.aging.gt14d)]], [230, 81, 0])
  }

  if (data.slaBreachedTickets?.length) {
    page('SLA Breached Tickets', ['Ticket', 'Title', 'Department', 'Assigned To', 'Hours Over'],
      data.slaBreachedTickets.map((t) => [
        t.ticketNo ?? '—', t.title, t.department ?? '—', t.assignedTo ?? '—', num(t.hoursOver),
      ]), [183, 28, 28])
  }

  if (data.staffData?.length) {
    page('IT Staff Performance', ['Staff', 'Assigned', 'Resolved', 'Resolution %', 'Avg Time'],
      data.staffData.map((s) => [
        s.name, s.assigned, s.resolved, `${percentage(s.resolved, s.assigned)}%`, formatHours(num(s.avgResolutionTime)),
      ]), [96, 125, 139])
  }

  if (data.empData?.length) {
    page('Employee Activity', ['Employee', 'Department', 'Total', 'Open', 'In Progress', 'Resolved', 'Closed'],
      data.empData.map((e) => [
        e.name, e.department ?? '—', e.total, e.open ?? 0, e.inProgress ?? 0, e.resolved ?? 0, e.closed ?? 0,
      ]), [63, 81, 181])
  }

  if (data.departmentData?.length) {
    page('Department-wise IT Support', ['Department', 'Total', 'Open', 'In Progress', 'Resolved', 'Closed'],
      data.departmentData.map((d) => [
        d.department, d.total, d.open ?? 0, d.inProgress ?? 0, d.resolved ?? 0, d.closed ?? 0,
      ]), [123, 31, 162])
  }

  if (asset) {
    page('Asset Snapshot (as of report generation)',
      ['Total', 'Assigned', 'Available', 'Working', 'Not in Use', 'Under Repair', 'Damaged'],
      [[
        asset.total, asset.assigned, asset.available, asset.working ?? 0,
        asset.notInUse ?? 0, asset.underRepair ?? 0, asset.damaged ?? 0,
      ]], [46, 125, 50])

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Laptops', 'CPU', 'Monitors', 'Printers', 'Accessories']],
      body: [[
        asset.laptops ?? 0, asset.desktops ?? 0, asset.monitors ?? 0, asset.printers ?? 0, asset.accessories ?? 0,
      ]],
      headStyles: { fillColor: [46, 125, 50] },
    })
  }

  doc.save(`IT-Report-${MONTHS[month]}-${year}.pdf`)
}

/* =========================================================
   EXCEL EXPORT  (percentages are real numbers now)
========================================================= */

function downloadExcel(data: ReportData, period: Period) {
  const { month, year } = period
  const wb = XLSX.utils.book_new()

  const tkt = data.tkt ?? { total: 0, open: 0, inprog: 0, resolved: 0, closed: 0 }

  const pending = tkt.pending ?? num(tkt.open_c ?? tkt.open) + num(tkt.inprog)
  const resolutionRate = tkt.resolutionRate ?? resolutionPct(tkt.resolved, tkt.closed, tkt.total)
  const closureRate = tkt.closureRate ?? percentage(tkt.closed, tkt.total)

  const add = (rows: any[], name: string) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name)

  add([{
    Month: MONTHS[month],
    Year: year,
    'Total Tickets': tkt.total,
    Open: num(tkt.open_c ?? tkt.open),
    'In Progress': tkt.inprog,
    Resolved: tkt.resolved,
    Closed: tkt.closed,
    Pending: pending,
    'Resolution %': resolutionRate,
    'Closure %': closureRate,
    'SLA Compliance %': num(tkt.slaCompliance),
    'SLA Breached': num(tkt.slaBreached),
    'Avg Resolution (hrs)': Number(num(tkt.avgResolutionTime).toFixed(2)),
  }], 'IT KPI')

  add([{
    Total: tkt.total,
    Open: num(tkt.open_c ?? tkt.open),
    'In Progress': tkt.inprog,
    Resolved: tkt.resolved,
    Closed: tkt.closed,
    Pending: pending,
    Critical: num(data.priorityData?.critical ?? tkt.critical),
    High: num(data.priorityData?.high ?? tkt.high),
    Medium: num(data.priorityData?.medium ?? tkt.medium),
    Low: num(data.priorityData?.low ?? tkt.low),
  }], 'Ticket Summary')

  if (data.prevMonth) {
    const p = data.prevMonth
    add([{
      Metric: 'Total Tickets', 'This Month': tkt.total, 'Previous Month': p.total,
    }, {
      Metric: 'Resolved', 'This Month': tkt.resolved, 'Previous Month': p.resolved,
    }, {
      Metric: 'Closed', 'This Month': tkt.closed, 'Previous Month': p.closed,
    }, {
      Metric: 'SLA Compliance %', 'This Month': num(tkt.slaCompliance), 'Previous Month': num(p.slaCompliance),
    }, {
      Metric: 'Avg Resolution (hrs)', 'This Month': Number(num(tkt.avgResolutionTime).toFixed(2)),
      'Previous Month': Number(num(p.avgResolutionTime).toFixed(2)),
    }], 'Vs Previous Month')
  }

  if (data.monthlyTrend?.length) add(data.monthlyTrend, 'Monthly Trend')

  if (data.categoryData?.length) {
    add(data.categoryData.map((c) => ({
      Category: c.category, Tickets: c.total, 'Share %': percentage(c.total, tkt.total),
    })), 'Category')
  }

  if (data.aging) {
    add([{
      '> 3 days': num(data.aging.gt3d), '> 7 days': num(data.aging.gt7d), '> 14 days': num(data.aging.gt14d),
    }], 'Aging')
  }

  if (data.slaBreachedTickets?.length) {
    add(data.slaBreachedTickets.map((t) => ({
      Ticket: t.ticketNo ?? '', Title: t.title, Department: t.department ?? '',
      'Assigned To': t.assignedTo ?? '', 'Hours Over SLA': num(t.hoursOver),
    })), 'SLA Breached')
  }

  if (data.staffData?.length) {
    add(data.staffData.map((s) => ({
      Staff: s.name, Assigned: s.assigned, Resolved: s.resolved,
      'Resolution %': percentage(s.resolved, s.assigned),
      'Avg Resolution (hrs)': Number(num(s.avgResolutionTime).toFixed(2)),
    })), 'IT Staff')
  }

  if (data.empData?.length) {
    add(data.empData.map((e) => ({
      Employee: e.name,
      Department: e.department ?? '—',
      Total: e.total,
      Open: e.open ?? 0,
      'In Progress': e.inProgress ?? 0,
      Resolved: e.resolved ?? 0,
      Closed: e.closed ?? 0,
      'Resolution %': e.resolutionRate ?? resolutionPct(e.resolved ?? 0, e.closed ?? 0, e.total),
    })), 'Employee Activity')
  }

  if (data.departmentData?.length) {
    add(data.departmentData.map((d) => ({
      Department: d.department, Total: d.total, Open: d.open ?? 0,
      'In Progress': d.inProgress ?? 0, Resolved: d.resolved ?? 0, Closed: d.closed ?? 0,
    })), 'Department')
  }

  if (data.assetData) {
    const a = data.assetData
    add([{
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
      'Warranty Expiring (90d)': data.assetExtra?.warrantyExpiring ?? 0,
      'Idle 90+ days': data.assetExtra?.idle ?? 0,
      'Older than 3 yrs': data.assetExtra?.oldAssets ?? 0,
    }], 'Asset Snapshot')
  }

  XLSX.writeFile(wb, `IT-Report-${MONTHS[month]}-${year}.xlsx`)
}

/* =========================================================
   UI PARTS
========================================================= */

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accentColor?: string
  subtitle?: string
  trend?: Trend
  onClick?: () => void
}

function StatCard({ label, value, icon, accentColor = '#C62828', subtitle, trend, onClick }: StatCardProps) {
  const [hovered, setHovered] = useState(false)
  const isMobile = useIsMobile()

  const trendColor = trend?.good === true ? '#2E7D32' : trend?.good === false ? '#C62828' : 'var(--text-muted)'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-mid)',
        padding: isMobile ? 12 : 18,
        cursor: onClick ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 22px ${accentColor}30` : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minWidth: 0,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: isMobile ? '0.58rem' : '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: isMobile ? '0.06em' : '0.1em',
            color: 'var(--text-muted)',
            minWidth: 0,
          }}
        >
          {label}
        </span>
        <span style={{ color: accentColor, opacity: 0.8, flexShrink: 0, display: 'flex' }}>{icon}</span>
      </div>

      <div
        style={{
          marginTop: isMobile ? 8 : 14,
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 900,
          color: accentColor,
          lineHeight: 1.1,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>

      {trend && (
        <div style={{ marginTop: 6, fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 700, color: trendColor }}>
          {trend.text}
        </div>
      )}

      {subtitle && (
        <div style={{ marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </div>
  )
}

function SectionCard({
  title, children, count, note,
}: { title: string; children: React.ReactNode; count?: number; note?: string }) {
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: isMobile ? '1rem' : '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: isMobile ? '11px 14px' : '13px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(198,40,40,0.04)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</h2>
          {note && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{note}</div>}
        </div>

        {count !== undefined && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 20,
              background: 'rgba(198,40,40,0.12)',
              color: 'var(--red-primary)',
              flexShrink: 0,
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

function ProgressBar({
  value, label, color, onClick,
}: { value: number; label: string; color: string; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '6px 8px',
        margin: '0 -8px 8px',
        borderRadius: 8,
        background: hovered ? `${color}0c` : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6, fontSize: '0.75rem', fontWeight: 600 }}>
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 20, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${safeValue}%`, height: '100%', background: color, borderRadius: 20, transition: 'width .3s ease' }} />
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 35, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{text}</div>
}

/* One table component: real table on desktop, cards on mobile.
   First column = card title, other columns = small stat grid. */
interface Column<T> {
  label: string
  render: (row: T) => React.ReactNode
}

function DataTable<T,>({
  columns, rows, onRowClick, empty,
}: { columns: Column<T>[]; rows: T[]; onRowClick?: (row: T) => void; empty: string }) {
  const isMobile = useIsMobile()

  if (!rows.length) return <Empty text={empty} />

  if (isMobile) {
    const [first, ...rest] = columns
    return (
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, cursor: onRowClick ? 'pointer' : 'default' }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, wordBreak: 'break-word' }}>
              {first.render(row)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))', gap: 8 }}>
              {rest.map((c) => (
                <div key={c.label} style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>{c.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.render(row)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.label}
                style={{
                  padding: '10px 15px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700,
                  color: 'var(--text-muted)', background: 'var(--bg-mid)',
                  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default', borderBottom: '1px solid var(--border-mid)' }}
              onMouseEnter={(e) => onRowClick && (e.currentTarget.style.background = 'rgba(198,40,40,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {columns.map((c, ci) => (
                <td key={c.label} style={{ padding: '12px 15px', fontSize: '0.82rem', fontWeight: ci === 0 ? 700 : 400 }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Grouped bar chart (pure SVG, no library) */
function TrendChart({ data }: { data: MonthlyTrend[] }) {
  const W = 600, H = 230
  const pad = { l: 34, r: 8, t: 14, b: 30 }
  const max = Math.max(1, ...data.flatMap((d) => [d.total, d.resolved, d.closed]))
  const gw = (W - pad.l - pad.r) / data.length
  const bw = Math.min(16, gw / 4)
  const ch = H - pad.t - pad.b

  const series: [keyof MonthlyTrend, string, string][] = [
    ['total', '#1565C0', 'Total'],
    ['resolved', '#2E7D32', 'Resolved'],
    ['closed', '#546E7A', 'Closed'],
  ]

  return (
    <div style={{ padding: 14 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.5, 1].map((t) => {
          const yy = pad.t + ch - ch * t
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 6} y={yy + 3} fontSize={10} textAnchor="end" fill="var(--text-muted)">
                {Math.round(max * t)}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const cx = pad.l + gw * i + gw / 2
          return (
            <g key={i}>
              {series.map(([key, color], si) => {
                const v = num(d[key])
                const h = (v / max) * ch
                const x = cx + (si - 1) * (bw + 2) - bw / 2
                return <rect key={key} x={x} y={pad.t + ch - h} width={bw} height={h} rx={2} fill={color} />
              })}
              <text x={cx} y={H - 10} fontSize={10} textAnchor="middle" fill="var(--text-muted)">
                {d.month.length > 6 ? d.month.slice(0, 3) : d.month}
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        {series.map(([key, color, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminReports() {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const [month, setMonth] = useState<number>(CURRENT_MONTH)
  /* the period the DISPLAYED data belongs to (exports + links use this,
     not the dropdown, so title and data always match) */
  const [loadedPeriod, setLoadedPeriod] = useState<Period>({ month: CURRENT_MONTH, year: CURRENT_YEAR })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: res } = await api.get<ReportData>('/reports', { params: { year, month } })
      setData(res ?? null)
      setLoadedPeriod({ month, year })
      setLoaded(true)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load report data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [])

  const changeYear = (y: number) => {
    setYear(y)
    if (isFuture(month, y)) setMonth(CURRENT_MONTH)
  }

  /* NAVIGATION: tickets links carry the report month/year */

  const goToTickets = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({
      ...params,
      month: String(loadedPeriod.month),
      year: String(loadedPeriod.year),
    }).toString()
    router.push(`/admin/tickets?${qs}`)
  }

  const goToAssets = (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    router.push(`/admin/assets${qs ? `?${qs}` : ''}`)
  }

  /* CALCULATIONS */

  const tkt = data?.tkt
  const prev = data?.prevMonth
  const totalTickets = num(tkt?.total)
  const openTickets = num(tkt?.open_c ?? tkt?.open)
  const inProgress = num(tkt?.inprog)
  const resolved = num(tkt?.resolved)
  const closed = num(tkt?.closed)
  const pending = tkt?.pending ?? openTickets + inProgress
  const resolutionRate = tkt?.resolutionRate ?? resolutionPct(resolved, closed, totalTickets)
  const closureRate = tkt?.closureRate ?? percentage(closed, totalTickets)
  const slaCompliance = num(tkt?.slaCompliance)
  const slaBreached = num(tkt?.slaBreached)
  const avgResolution = num(tkt?.avgResolutionTime)

  const asset = data?.assetData
  const assetUtilization = asset?.total ? percentage(asset.assigned, asset.total) : 0

  const priority = data?.priorityData ?? {
    critical: num(tkt?.critical),
    high: num(tkt?.high),
    medium: num(tkt?.medium),
    low: num(tkt?.low),
  }

  const pp = prevPeriod(loadedPeriod)
  const prevLabel = MONTHS[pp.month].slice(0, 3)

  const prevResolutionRate = prev ? resolutionPct(prev.resolved, prev.closed, prev.total) : undefined
  const prevPending = prev?.pending

  const trendTotal = prev ? deltaPct(totalTickets, prev.total, false, prevLabel) : undefined
  const trendPending = prevPending !== undefined ? deltaPct(pending, prevPending, true, prevLabel) : undefined
  const trendResolution = deltaPts(resolutionRate, prevResolutionRate, prevLabel)
  const trendSla = prev ? deltaPts(slaCompliance, prev.slaCompliance, prevLabel) : undefined
  const trendAvg = prev ? deltaPct(avgResolution, prev.avgResolutionTime, true, prevLabel) : undefined

  const topCategory = data?.categoryData?.length
    ? [...data.categoryData].sort((a, b) => b.total - a.total)[0]
    : undefined

  /* Auto insights for the Management Summary */
  const insights: string[] = []
  if (prev && prev.total) {
    const d = Math.round(((totalTickets - prev.total) / prev.total) * 100)
    if (d !== 0) insights.push(`Ticket volume ${d > 0 ? 'increased' : 'decreased'} by ${Math.abs(d)}% compared to ${MONTHS[pp.month]}.`)
  }
  if (prevResolutionRate !== undefined && Math.round(resolutionRate - prevResolutionRate) !== 0) {
    const d = Math.round(resolutionRate - prevResolutionRate)
    insights.push(`Resolution rate ${d > 0 ? 'improved' : 'dropped'} by ${Math.abs(d)} points vs ${MONTHS[pp.month]}.`)
  }
  if (topCategory) insights.push(`${topCategory.category} was the most common issue type (${topCategory.total} tickets).`)
  if (slaBreached > 0) insights.push(`${slaBreached} ticket${slaBreached > 1 ? 's' : ''} breached SLA this month.`)
  if (num(data?.aging?.gt7d) > 0) insights.push(`${num(data?.aging?.gt7d)} open ticket(s) are older than 7 days and need attention.`)
  if (num(priority.critical) > 0) insights.push(`${priority.critical} critical priority ticket(s) were raised.`)

  /* RESPONSIVE STYLE TOKENS */

  const iconSize = isMobile ? 15 : 18

  const statGrid = (minPx: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(auto-fit,minmax(${minPx}px,1fr))`,
    gap: isMobile ? 10 : 14,
    padding: isMobile ? 12 : 20,
  })

  const selectStyle: React.CSSProperties = {
    padding: isMobile ? '10px 12px' : '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-mid)',
    color: 'var(--text-main)',
    width: isMobile ? '100%' : undefined,
    minWidth: 0,
  }

  const exportBtn = (rgb: string, color: string): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    alignItems: 'center',
    padding: isMobile ? '10px' : '8px 14px',
    borderRadius: 8,
    border: `1px solid rgba(${rgb},.3)`,
    background: `rgba(${rgb},.08)`,
    color,
    fontWeight: 700,
    cursor: 'pointer',
  })

  const loadedLabel = `${MONTHS[loadedPeriod.month]} ${loadedPeriod.year}`
  const dirty = loaded && (loadedPeriod.month !== month || loadedPeriod.year !== year)

  return (
    <AppLayout role="admin">
      <div style={{ padding: isMobile ? 0 : '0.5rem', background: 'transparent', overflowX: 'hidden' }}>
        {/* HEADER */}

        <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
          <div
            style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--red-primary)', marginBottom: 8,
            }}
          >
            TicketDesk / Reports
          </div>

          <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.9rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
            IT Management Report
          </h1>

          <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginTop: 5 }}>
            System-wide IT support, asset and performance overview
          </p>
        </div>

        {/* FILTER BAR */}

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 10,
            padding: isMobile ? '12px 14px' : '12px 16px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-mid)',
            marginBottom: isMobile ? '1rem' : '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REPORT PERIOD</strong>

          <div style={{ display: isMobile ? 'grid' : 'contents', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
              {Object.entries(MONTHS).map(([key, value]) => (
                <option key={key} value={key} disabled={isFuture(Number(key), year)}>
                  {value}
                </option>
              ))}
            </select>

            <select value={year} onChange={(e) => changeYear(Number(e.target.value))} style={selectStyle}>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: isMobile ? '10px 20px' : '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--red-primary)',
              color: '#fff',
              fontWeight: 700,
              width: isMobile ? '100%' : undefined,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : dirty ? 'Load Selected Period' : 'Load Report'}
          </button>

          {loaded && data && (
            <div
              style={{
                marginLeft: isMobile ? 0 : 'auto',
                display: isMobile ? 'grid' : 'flex',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {!isMobile && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Showing {loadedLabel}
                </span>
              )}

              <button onClick={() => downloadPDF(data, loadedPeriod)} style={exportBtn('198,40,40', '#C62828')}>
                <Download size={14} /> PDF
              </button>

              <button onClick={() => downloadExcel(data, loadedPeriod)} style={exportBtn('46,125,50', '#2E7D32')}>
                <Download size={14} /> Excel
              </button>
            </div>
          )}
        </div>

        {/* shows when dropdown differs from the data on screen */}
        {dirty && !loading && (
          <div
            style={{
              padding: '10px 14px', marginBottom: 16, borderRadius: 8, fontSize: '0.8rem',
              color: '#E65100', background: 'rgba(230,81,0,.08)', border: '1px solid rgba(230,81,0,.3)',
            }}
          >
            Showing {loadedLabel}. Click <strong>Load Selected Period</strong> to update.
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 14, marginBottom: 20, borderRadius: 8, color: '#C62828',
              background: 'rgba(198,40,40,.08)', border: '1px solid rgba(198,40,40,.3)', fontSize: '0.85rem',
            }}
          >
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>Loading report...</div>
        )}

        {/* REPORT */}

        {!loading && data && (
          <>
            {/* KPI */}

            <SectionCard title={`IT KPI Overview - ${loadedLabel}`}>
              <div style={statGrid(180)}>
                <StatCard
                  label="Total Tickets" value={totalTickets} trend={trendTotal}
                  icon={<Ticket size={iconSize} />}
                  onClick={() => goToTickets()}
                />
                <StatCard
                  label="Pending" value={pending} accentColor="#E65100" trend={trendPending}
                  icon={<AlertCircle size={iconSize} />}
                  onClick={() => goToTickets({ status: 'pending' })}
                />
                <StatCard
                  label="Resolution Rate" value={`${resolutionRate}%`} accentColor="#2E7D32" trend={trendResolution}
                  icon={<CheckCircle2 size={iconSize} />}
                  onClick={() => goToTickets({ status: 'resolved' })}
                />
                <StatCard
                  label="Closure Rate" value={`${closureRate}%`} accentColor="#1565C0"
                  icon={<Lock size={iconSize} />}
                  onClick={() => goToTickets({ status: 'closed' })}
                />
                <StatCard
                  label="SLA Compliance" value={`${slaCompliance}%`} accentColor="#6A1B9A" trend={trendSla}
                  subtitle={slaBreached ? `${slaBreached} breached` : undefined}
                  icon={<ShieldCheck size={iconSize} />}
                />
                <StatCard
                  label="Avg Resolution" value={formatHours(avgResolution)} accentColor="#00838F" trend={trendAvg}
                  icon={<Clock size={iconSize} />}
                />
                {data.feedback?.avgRating !== undefined && (
                  <StatCard
                    label="Avg Rating" value={`${num(data.feedback.avgRating).toFixed(1)} / 5`} accentColor="#F9A825"
                    subtitle={data.feedback.count ? `${data.feedback.count} feedback` : undefined}
                    icon={<Star size={iconSize} />}
                  />
                )}
              </div>
            </SectionCard>

            {/* TICKET STATUS */}

            <SectionCard title="Ticket Status">
              <div style={statGrid(160)}>
                <StatCard
                  label="Open" value={openTickets} accentColor="#E65100"
                  icon={<Inbox size={iconSize} />}
                  onClick={() => goToTickets({ status: 'open' })}
                />
                <StatCard
                  label="In Progress" value={inProgress} accentColor="#1565C0"
                  icon={<Settings size={iconSize} />}
                  onClick={() => goToTickets({ status: 'in-progress' })}
                />
                <StatCard
                  label="Resolved" value={resolved} accentColor="#2E7D32"
                  icon={<CheckCircle2 size={iconSize} />}
                  onClick={() => goToTickets({ status: 'resolved' })}
                />
                <StatCard
                  label="Closed" value={closed} accentColor="#546E7A"
                  icon={<Lock size={iconSize} />}
                  onClick={() => goToTickets({ status: 'closed' })}
                />
              </div>
            </SectionCard>

            {/* PRIORITY */}

            <SectionCard title="Priority Analysis">
              <div style={{ padding: isMobile ? 14 : 20 }}>
                <ProgressBar label={`Critical (${priority.critical})`} value={percentage(priority.critical, totalTickets)} color="#B71C1C" onClick={() => goToTickets({ priority: 'critical' })} />
                <ProgressBar label={`High (${priority.high})`} value={percentage(priority.high, totalTickets)} color="#E65100" onClick={() => goToTickets({ priority: 'high' })} />
                <ProgressBar label={`Medium (${priority.medium})`} value={percentage(priority.medium, totalTickets)} color="#F9A825" onClick={() => goToTickets({ priority: 'medium' })} />
                <ProgressBar label={`Low (${priority.low})`} value={percentage(priority.low, totalTickets)} color="#2E7D32" onClick={() => goToTickets({ priority: 'low' })} />
              </div>
            </SectionCard>

            {/* MONTHLY TREND */}

            {!!data.monthlyTrend?.length && (
              <SectionCard title="Monthly Trend" note="Last months: total vs resolved vs closed">
                <TrendChart data={data.monthlyTrend} />
              </SectionCard>
            )}

            {/* CATEGORY */}

            {!!data.categoryData?.length && (
              <SectionCard title="Tickets by Category" count={data.categoryData.length}>
                <div style={{ padding: isMobile ? 14 : 20 }}>
                  {[...data.categoryData].sort((a, b) => b.total - a.total).map((c) => (
                    <ProgressBar
                      key={c.category}
                      label={`${c.category} (${c.total})`}
                      value={percentage(c.total, totalTickets)}
                      color="#00838F"
                      onClick={() => goToTickets({ category: c.category })}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* AGING */}

            {data.aging && (
              <SectionCard title="Ticket Aging" note="Tickets still open for longer than">
                <div style={statGrid(160)}>
                  <StatCard label="> 3 days" value={num(data.aging.gt3d)} accentColor="#F9A825" icon={<Hourglass size={iconSize} />} onClick={() => goToTickets({ status: 'pending', age: '3' })} />
                  <StatCard label="> 7 days" value={num(data.aging.gt7d)} accentColor="#E65100" icon={<CalendarClock size={iconSize} />} onClick={() => goToTickets({ status: 'pending', age: '7' })} />
                  <StatCard label="> 14 days" value={num(data.aging.gt14d)} accentColor="#B71C1C" icon={<AlertTriangle size={iconSize} />} onClick={() => goToTickets({ status: 'pending', age: '14' })} />
                </div>
              </SectionCard>
            )}

            {/* SLA BREACHED */}

            {!!data.slaBreachedTickets?.length && (
              <SectionCard title="SLA Breached Tickets" count={data.slaBreachedTickets.length}>
                <DataTable
                  rows={data.slaBreachedTickets}
                  empty="No SLA breaches."
                  onRowClick={(t) => t.ticketNo && goToTickets({ search: t.ticketNo })}
                  columns={[
                    { label: 'Ticket', render: (t) => `${t.ticketNo ? t.ticketNo + ' · ' : ''}${t.title}` },
                    { label: 'Department', render: (t) => t.department ?? '—' },
                    { label: 'Assigned To', render: (t) => t.assignedTo ?? '—' },
                    { label: 'Hours Over', render: (t) => <span style={{ color: '#B71C1C' }}>{num(t.hoursOver)}h</span> },
                  ]}
                />
              </SectionCard>
            )}

            {/* DEPARTMENT */}

            <SectionCard title="Department-wise IT Support" count={data.departmentData?.length ?? 0}>
              <DataTable
                rows={data.departmentData ?? []}
                empty="No department data available."
                onRowClick={(d) => goToTickets({ department: d.department })}
                columns={[
                  { label: 'Department', render: (d) => d.department },
                  { label: 'Total', render: (d) => d.total },
                  { label: 'Open', render: (d) => d.open ?? 0 },
                  { label: 'In Progress', render: (d) => d.inProgress ?? 0 },
                  { label: 'Resolved', render: (d) => d.resolved ?? 0 },
                  { label: 'Closed', render: (d) => d.closed ?? 0 },
                ]}
              />
            </SectionCard>

            {/* IT STAFF */}

            {!!data.staffData?.length && (
              <SectionCard title="IT Staff Performance" count={data.staffData.length} note="Tickets handled by IT staff">
                <DataTable
                  rows={data.staffData}
                  empty="No staff data."
                  columns={[
                    { label: 'Staff', render: (s) => s.name },
                    { label: 'Assigned', render: (s) => s.assigned },
                    { label: 'Resolved', render: (s) => s.resolved },
                    {
                      label: 'Resolution %',
                      render: (s) => {
                        const r = percentage(s.resolved, s.assigned)
                        return <span style={{ color: r >= 80 ? '#2E7D32' : '#E65100', fontWeight: 700 }}>{r}%</span>
                      },
                    },
                    { label: 'Avg Time', render: (s) => formatHours(num(s.avgResolutionTime)) },
                  ]}
                />
              </SectionCard>
            )}

            {/* EMPLOYEE */}

            <SectionCard title="Employee Activity" count={data.empData?.length ?? 0} note="Tickets raised by employees">
              <DataTable
                rows={data.empData ?? []}
                empty="No employee data for this period."
                columns={[
                  { label: 'Employee', render: (e) => e.name },
                  { label: 'Department', render: (e) => e.department ?? '—' },
                  { label: 'Total', render: (e) => e.total },
                  { label: 'Open', render: (e) => e.open ?? 0 },
                  { label: 'In Progress', render: (e) => e.inProgress ?? 0 },
                  { label: 'Resolved', render: (e) => e.resolved ?? 0 },
                  { label: 'Closed', render: (e) => e.closed ?? 0 },
                  {
                    label: 'Resolution %',
                    render: (e) => {
                      const r = e.resolutionRate ?? resolutionPct(e.resolved ?? 0, e.closed ?? 0, e.total)
                      return <span style={{ color: r >= 80 ? '#2E7D32' : '#E65100', fontWeight: 700 }}>{r}%</span>
                    },
                  },
                ]}
              />
            </SectionCard>

            {/* ASSETS */}

            <SectionCard title="IT Asset Snapshot" note="Current inventory as of today (not filtered by month)">
              {asset ? (
                <>
                  <div style={statGrid(170)}>
                    <StatCard label="Total Assets" value={asset.total} icon={<Package size={iconSize} />} onClick={() => goToAssets()} />
                    <StatCard label="Assigned" value={asset.assigned} accentColor="#1565C0" icon={<Link2 size={iconSize} />} onClick={() => goToAssets({ status: 'Assigned' })} />
                    <StatCard label="Available" value={asset.available} accentColor="#2E7D32" icon={<CheckCircle2 size={iconSize} />} onClick={() => goToAssets({ status: 'Available' })} />
                    <StatCard label="Working" value={asset.working ?? 0} accentColor="#00838F" icon={<Activity size={iconSize} />} />
                    <StatCard label="Under Repair" value={asset.underRepair ?? 0} accentColor="#E65100" icon={<Wrench size={iconSize} />} onClick={() => goToAssets({ status: 'Under Repair' })} />
                    <StatCard label="Damaged" value={asset.damaged ?? 0} accentColor="#B71C1C" icon={<AlertTriangle size={iconSize} />} onClick={() => goToAssets({ status: 'Damaged' })} />
                    {data.assetExtra?.warrantyExpiring !== undefined && (
                      <StatCard label="Warranty Ending (90d)" value={data.assetExtra.warrantyExpiring} accentColor="#F9A825" icon={<ShieldCheck size={iconSize} />} onClick={() => goToAssets({ warranty: 'expiring' })} />
                    )}
                    {data.assetExtra?.idle !== undefined && (
                      <StatCard label="Idle 90+ Days" value={data.assetExtra.idle} accentColor="#546E7A" icon={<Archive size={iconSize} />} onClick={() => goToAssets({ idle: '90' })} />
                    )}
                    {data.assetExtra?.oldAssets !== undefined && (
                      <StatCard label="Older Than 3 Yrs" value={data.assetExtra.oldAssets} accentColor="#6A1B9A" icon={<Clock size={iconSize} />} onClick={() => goToAssets({ age: '3' })} />
                    )}
                  </div>

                  <div style={{ padding: isMobile ? '0 14px 14px' : '0 20px 20px' }}>
                    <ProgressBar
                      label={`Asset Utilization - ${asset.assigned} / ${asset.total}`}
                      value={assetUtilization}
                      color="#1565C0"
                      onClick={() => goToAssets({ status: 'Assigned' })}
                    />
                  </div>

                  <div
                    style={{
                      padding: isMobile ? '0 12px 14px' : '0 20px 20px',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit,minmax(130px,1fr))',
                      gap: 10,
                    }}
                  >
                    {[
                      ['Laptops', asset.laptops, 'Laptop'],
                      ['CPU', asset.desktops, 'CPU'],
                      ['Monitors', asset.monitors, 'Monitor'],
                      ['Printers', asset.printers, 'Printer'],
                      ['Accessories', asset.accessories, null],
                    ].map(([label, value, categoryValue]) => (
                      <div
                        key={String(label)}
                        onClick={categoryValue ? () => goToAssets({ category: String(categoryValue) }) : undefined}
                        style={{
                          padding: isMobile ? 12 : 14,
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          cursor: categoryValue ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                        <div style={{ marginTop: 5, fontSize: '1.3rem', fontWeight: 800 }}>{num(value)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Empty text="No asset data available." />
              )}
            </SectionCard>

            {/* MANAGEMENT SUMMARY */}

            <SectionCard title="Management Summary">
              <div
                style={{
                  padding: isMobile ? 14 : 20,
                  lineHeight: 1.7,
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'var(--text-main)',
                }}
              >
                During <strong>{loadedLabel}</strong>, a total of <strong>{totalTickets}</strong> IT tickets were
                recorded. <strong>{resolved}</strong> tickets were resolved and <strong>{pending}</strong> tickets
                remain pending. The current ticket resolution rate is <strong>{resolutionRate}%</strong> and closure
                rate is <strong>{closureRate}%</strong>.
                {asset && (
                  <>
                    {' '}The IT inventory currently contains <strong>{asset.total}</strong> assets, with{' '}
                    <strong>{asset.assigned}</strong> assigned to employees.
                  </>
                )}

                {insights.length > 0 && (
                  <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                    {insights.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          </>
        )}

        {/* EMPTY */}

        {!loading && !data && !error && (
          <div
            style={{
              padding: 60, textAlign: 'center', borderRadius: 12,
              border: '1px solid var(--border)', color: 'var(--text-muted)',
            }}
          >
            <BarChart3 size={44} style={{ marginBottom: 12 }} />
            <p>
              Select a period and click <strong>Load Report</strong>
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}