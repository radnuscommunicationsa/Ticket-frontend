'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, StatCard } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'
import {
  Search,
  Check,
  X,
  Undo2,
  Clock,
  Phone,
  User,
  Laptop,
  Calendar,
  FileText,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react'

/* =========================================================
   TYPES
========================================================= */

type Message = { type: 'success' | 'error'; text: string }

type TakeHomeRequest = {
  _id: string
  employee_id?: { _id?: string; name?: string; emp_id?: string; department?: string } | string
  asset_id?: { _id?: string; asset_code?: string; name?: string; model?: string } | string
  asset_type?: string
  reason: string
  from_date: string
  to_date: string
  emergency_contact?: string
  emergency_phone: string
  status: 'pending' | 'approved_by_manager' | 'approved' | 'rejected' | 'returned'
  notes?: string
  created_at?: string
}

/* =========================================================
   STYLES
========================================================= */

const filterStyle: React.CSSProperties = {
  padding: '8px 10px',
  minWidth: 160,
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.83rem',
  boxSizing: 'border-box',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Manager',
  approved_by_manager: 'Pending IT Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#ef6c00',
  approved_by_manager: '#1565c0',
  approved: '#2e7d32',
  rejected: '#c62828',
  returned: '#616161',
}

/* =========================================================
   HELPERS
========================================================= */

function getEmployeeLabel(req: TakeHomeRequest) {
  if (typeof req.employee_id === 'object' && req.employee_id) {
    const emp = req.employee_id
    return [emp.name, emp.emp_id ? `(${emp.emp_id})` : ''].filter(Boolean).join(' ')
  }
  return 'Unknown Employee'
}

function getAssetLabel(req: TakeHomeRequest) {
  if (typeof req.asset_id === 'object' && req.asset_id) {
    const asset = req.asset_id
    return [asset.asset_code, asset.name].filter(Boolean).join(' — ')
  }
  return req.asset_type || 'Unknown Asset'
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB')
}

/* =========================================================
   NOTES MODAL (Reject / Return with optional notes)
========================================================= */

function NotesActionModal({
  actionLabel,
  actionColor,
  onConfirm,
  onCancel,
}: {
  actionLabel: string
  actionColor: string
  onConfirm: (notes: string) => void
  onCancel: () => void
}) {
  const [notes, setNotes] = useState('')

  return (
    <div style={{ padding: '1rem', maxWidth: 420 }}>
      <label
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          display: 'block',
          marginBottom: 6,
        }}
      >
        Notes (optional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add a note for this action..."
        style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: '1rem' }}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            borderRadius: 5,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(notes)}
          style={{
            padding: '8px 18px',
            borderRadius: 5,
            border: 'none',
            background: actionColor,
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminTakeHomeRequests() {
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<TakeHomeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [msg, setMsg] = useState<Message | null>(null)

  const [statusF, setStatusF] = useState('')
  const [q, setQ] = useState('')

  const [rejectTarget, setRejectTarget] = useState<TakeHomeRequest | null>(null)
  const [returnTarget, setReturnTarget] = useState<TakeHomeRequest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TakeHomeRequest | null>(null)

  /* which request rows are expanded to show full details */
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setUser(getUser())
    load()
  }, [])

  useEffect(() => {
    if (!msg) return
    const timer = setTimeout(() => setMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [msg])

  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const { data } = await api.get('/assets/take-home-requests')
      setRequests(Array.isArray(data?.requests) ? data.requests : [])
      if (isManualRefresh) {
        setMsg({ type: 'success', text: 'Requests refreshed.' })
      }
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Failed to load take-home requests.',
      })
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const userRole = user?.role
  const isSystemAdmin = userRole === 'admin' || userRole === 'system_admin'
  const isManager = userRole === 'manager'

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      pendingIt: requests.filter((r) => r.status === 'approved_by_manager').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }
  }, [requests])

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusF && r.status !== statusF) return false
      if (q.trim()) {
        const search = q.trim().toLowerCase()
        const haystack = [
          getEmployeeLabel(r),
          getAssetLabel(r),
          r.reason,
          r.emergency_phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [requests, statusF, q])

  /* =========================================================
     TOGGLE EXPAND
  ========================================================= */

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /* =========================================================
     ACTIONS
  ========================================================= */

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.patch(`/assets/take-home-requests/${id}/status`, { status, notes })
      setMsg({ type: 'success', text: `Request ${STATUS_LABEL[status] || status}.` })
      await load()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Failed to update request.',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/assets/take-home-requests/${id}`)
      setMsg({ type: 'success', text: 'Request deleted.' })
      await load()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Failed to delete request.',
      })
    }
  }

const handlePrint = (req: TakeHomeRequest) => {
  const employee = getEmployeeLabel(req)
  const asset = getAssetLabel(req)
  const status = STATUS_LABEL[req.status] || req.status
  const statusColor = STATUS_COLOR[req.status] || '#616161'

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Asset Take-Home Form</title>
  <style>
    @page { margin: 0; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11px; 
      color: #000; 
      line-height: 1.45;
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 12mm;
    }
    .box {
      border: 2px solid #000;
      padding: 16px;
      height: 273mm;
    }
    .title {
      text-align: center;
      border-bottom: 2px solid #c62828;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .title h1 {
      font-size: 18px;
      color: #c62828;
      letter-spacing: 1px;
      margin: 0;
    }
    .title p {
      font-size: 10px;
      color: #333;
      margin: 4px 0 0;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #333;
    }
    table.form {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }
    table.form td, table.form th {
      border: 1px solid #000;
      padding: 7px 10px;
      vertical-align: middle;
    }
    table.form th {
      background: #e8e8e8;
      width: 26%;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      text-align: left;
      letter-spacing: 0.3px;
    }
    .section {
      background: #c62828 !important;
      color: #fff !important;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 6px 10px !important;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: bold;
      color: #fff;
      background: ${statusColor};
    }
    .terms {
      border: 1px solid #000;
      padding: 12px;
      margin-bottom: 16px;
      background: #fafafa;
    }
    .terms h4 {
      font-size: 10px;
      color: #c62828;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .terms ol {
      margin: 0;
      padding-left: 20px;
      font-size: 10.5px;
    }
    .terms li {
      margin-bottom: 5px;
    }
    .ack {
      border: 1px solid #000;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 11px;
      background: #fff;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 10px;
    }
    .sign-box {
      flex: 1;
      text-align: center;
      padding: 0 8px;
    }
    .sign-line {
      border-top: 1px solid #000;
      height: 40px;
      margin-bottom: 6px;
    }
    .sign-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 3px;
    }
    .sign-sub {
      font-size: 10px;
      color: #333;
    }
    .footer {
      text-align: center;
      font-size: 8px;
      color: #666;
      border-top: 1px solid #bbb;
      padding-top: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="box">
      <div class="title">
        <h1>ASSET TAKE-HOME REQUEST FORM</h1>
        <p>IT Asset Management Department | TicketDesk</p>
      </div>

      <div class="meta">
        <span>Ref: THR-${req._id.slice(-6).toUpperCase()}</span>
        <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
      </div>

      <table class="form">
        <tr>
          <td colspan="2" class="section">Employee &amp; Asset Details</td>
        </tr>
        <tr>
          <th>Employee Name</th>
          <td><strong>${employee}</strong></td>
        </tr>
        <tr>
          <th>Department</th>
          <td>${(typeof req.employee_id === 'object' && req.employee_id?.department) || '—'}</td>
        </tr>
        <tr>
          <th>Asset Details</th>
          <td><strong>${asset}</strong> &nbsp;|&nbsp; Type: ${req.asset_type || '—'}</td>
        </tr>
        <tr>
          <th>Period</th>
          <td>${fmtDate(req.from_date)} <strong>to</strong> ${fmtDate(req.to_date)}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td><span class="badge">${status}</span></td>
        </tr>
        <tr>
          <th>Emergency Contact</th>
          <td>${req.emergency_contact || '—'} &nbsp;|&nbsp; ${req.emergency_phone}</td>
        </tr>
        <tr>
          <th>Reason / Purpose</th>
          <td>${req.reason}</td>
        </tr>
        ${req.notes ? `
        <tr>
          <th>Admin Notes</th>
          <td style="font-style:italic;color:#444;">${req.notes}</td>
        </tr>
        ` : ''}
      </table>

      <div class="terms">
        <h4>Terms &amp; Responsibilities</h4>
        <ol>
          <li>I am responsible for the safekeeping of this asset and agree to return it by the specified date.</li>
          <li>I will immediately report any loss, theft, or damage to my Manager and IT.</li>
          <li>Misuse or negligence may result in disciplinary action and/or cost recovery.</li>
        </ol>
      </div>

      <div class="ack">
        I, <strong>${employee}</strong>, have read and agree to the above terms. I accept full responsibility for this asset during the take-home period.
      </div>

      <div class="signatures">
        <div class="sign-box">
          <div class="sign-line"></div>
          <div class="sign-label">Employee Signature</div>
          <div class="sign-sub">${employee}</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div class="sign-label">Manager Approval</div>
          <div class="sign-sub">Date: ___________</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div class="sign-label">IT Handover</div>
          <div class="sign-sub">Date: ___________</div>
        </div>
      </div>

      <div class="footer">
        System-generated from TicketDesk IT Portal &nbsp;|&nbsp; Doc ID: ${req._id} &nbsp;|&nbsp; ${new Date().toLocaleString('en-GB')}
      </div>
    </div>
  </div>
</body>
</html>
  `

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 1000)
  }, 600)
}
  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="ASSETS / TAKE HOME"
        title="Take-Home Requests"
        subtitle="Review and approve employee requests to take assets home"
      />

      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard label="Pending Manager" value={stats.pending} sub="Awaiting first approval" color="#ef6c00" />
        <StatCard label="Pending IT" value={stats.pendingIt} sub="Awaiting final approval" color="#1565c0" />
        <StatCard label="Approved" value={stats.approved} sub="Handed over" color="#2e7d32" />
        <StatCard label="Rejected" value={stats.rejected} sub="Not approved" color="#c62828" />
      </div>

      {/* FILTERS */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--bg-card)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 250px', minWidth: 200 }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employee, asset, reason..."
            style={{ ...inputStyle, padding: '8px 12px 8px 32px' }}
          />
        </div>

        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={filterStyle}>
          <option value="">All Status</option>
          <option value="pending">Pending Manager</option>
          <option value="approved_by_manager">Pending IT</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="returned">Returned</option>
        </select>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 5,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-sub)',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginLeft: 'auto',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* TABLE */}
      <div className="card">
        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-mid)',
            fontSize: '0.87rem',
            fontWeight: 600,
          }}
        >
          Requests ({filtered.length})
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading requests...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No take-home requests found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((req) => {
              const isOpen = expanded.has(req._id)

              return (
                <div key={req._id} style={{ borderBottom: '1px solid var(--border-mid)' }}>
                  {/* CLICKABLE SUMMARY ROW — always visible: employee, asset, status */}
                  <div
                    onClick={() => toggleExpand(req._id)}
                    style={{
                      padding: '0.9rem 1.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160 }}>
                        <User size={13} color="var(--text-muted)" />
                        <span style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-main)' }}>
                          {getEmployeeLabel(req)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160 }}>
                        <Laptop size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)', fontFamily: 'IBM Plex Mono' }}>
                          {getAssetLabel(req)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          color: STATUS_COLOR[req.status],
                          background: `${STATUS_COLOR[req.status]}18`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {STATUS_LABEL[req.status] || req.status}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={16} color="var(--text-muted)" />
                      ) : (
                        <ChevronDown size={16} color="var(--text-muted)" />
                      )}
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isOpen && (
                    <div style={{ padding: '0 1.4rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.8rem',
                          padding: '0.7rem 0.9rem',
                          background: 'rgba(198,40,40,0.03)',
                          borderRadius: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                            <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                            Duration
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {fmtDate(req.from_date)} → {fmtDate(req.to_date)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                            <Phone size={11} style={{ display: 'inline', marginRight: 4 }} />
                            Emergency Contact
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {req.emergency_contact || '—'} · {req.emergency_phone}
                          </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                            <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
                            Reason
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{req.reason}</div>
                        </div>

                        {req.notes && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                              Notes
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>{req.notes}</div>
                          </div>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handlePrint(req)}
                          style={actionBtn('#616161', true)}
                        >
                          <Printer size={13} />
                          Print / Download
                        </button>

                        {req.status === 'pending' && (isManager || isSystemAdmin) && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(req._id, 'approved_by_manager')}
                              style={actionBtn('#1565c0')}
                            >
                              <Check size={13} />
                              Manager Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(req)}
                              style={actionBtn('#c62828', true)}
                            >
                              <X size={13} />
                              Reject
                            </button>
                          </>
                        )}

                        {req.status === 'approved_by_manager' && isSystemAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(req._id, 'approved')}
                              style={actionBtn('#2e7d32')}
                            >
                              <ShieldCheck size={13} />
                              Final Approve (IT)
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(req)}
                              style={actionBtn('#c62828', true)}
                            >
                              <X size={13} />
                              Reject
                            </button>
                          </>
                        )}

                        {req.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => setReturnTarget(req)}
                            style={actionBtn('#616161', true)}
                          >
                            <Undo2 size={13} />
                            Mark Returned
                          </button>
                        )}

                        {(req.status === 'rejected' || req.status === 'returned') && isSystemAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(req)}
                            style={actionBtn('#c62828', true)}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectTarget && (
        <Modal open={true} onClose={() => setRejectTarget(null)} title="Reject Request">
          <NotesActionModal
            actionLabel="Reject"
            actionColor="#c62828"
            onCancel={() => setRejectTarget(null)}
            onConfirm={async (notes) => {
              const id = rejectTarget._id
              setRejectTarget(null)
              await updateStatus(id, 'rejected', notes)
            }}
          />
        </Modal>
      )}

      {/* RETURN MODAL */}
      {returnTarget && (
        <Modal open={true} onClose={() => setReturnTarget(null)} title="Mark Asset Returned">
          <NotesActionModal
            actionLabel="Mark Returned"
            actionColor="#616161"
            onCancel={() => setReturnTarget(null)}
            onConfirm={async (notes) => {
              const id = returnTarget._id
              setReturnTarget(null)
              await updateStatus(id, 'returned', notes)
            }}
          />
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title="Delete Request">
          <div style={{ padding: '1rem', maxWidth: 400 }}>
            <div
              style={{
                padding: '0.8rem',
                marginBottom: '1rem',
                borderRadius: 6,
                background: 'rgba(198,40,40,0.08)',
                border: '1px solid rgba(198,40,40,0.2)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              Are you sure you want to permanently delete this request from{' '}
              <strong>{getEmployeeLabel(deleteTarget)}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 5,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteTarget._id
                  setDeleteTarget(null)
                  await handleDelete(id)
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 5,
                  border: 'none',
                  background: '#c62828',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  )
}

/* =========================================================
   BUTTON STYLE HELPER
========================================================= */

function actionBtn(color: string, outline?: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 5,
    border: outline ? `1px solid ${color}` : 'none',
    background: outline ? `${color}10` : color,
    color: outline ? color : '#fff',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
  }
}