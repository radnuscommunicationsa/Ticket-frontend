'use client'

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui'

export type HistoryItem = {
  action: string
  employee_name?: string
  reason?: string
  done_by?: string
  date: string
}

type AssetLite = {
  asset_code: string
  name: string
  category?: string
  status?: string
  assigned_to_name?: string
  assigned_date?: string
}

type Period = {
  name: string
  from: string | null
  to: string | null
  reasonIn?: string
  reasonOut?: string
}

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const daysBetween = (from: string | null, to: string | null) => {
  if (!from) return '—'
  const start = new Date(from).getTime()
  const end = to ? new Date(to).getTime() : Date.now()
  const days = Math.max(0, Math.round((end - start) / 86400000))
  if (days === 0) return 'Same day'
  return days === 1 ? '1 day' : `${days} days`
}

const ACTION_COLOR: Record<string, string> = {
  Assigned: '#1565c0',
  Unassigned: '#e65100',
  Created: '#2e7d32',
  'Status Changed': '#757575',
}

// Used when two events have the exact same timestamp
const ACTION_ORDER: Record<string, number> = {
  Created: 0,
  Assigned: 1,
  'Status Changed': 2,
  Unassigned: 3,
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '0.64rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  background: 'var(--bg-mid)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '9px 10px',
  fontSize: '0.78rem',
  color: 'var(--text-sub)',
  borderBottom: '1px solid var(--border-mid)',
  verticalAlign: 'top',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const emptyBox: React.CSSProperties = {
  padding: '1.4rem',
  textAlign: 'center',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
}

// Accepts [..], { history: [..] }, { data: [..] }, { data: { history: [..] } }
function normalizeHistory(input: unknown): HistoryItem[] {
  if (Array.isArray(input)) return input as HistoryItem[]
  const o = input as any
  if (Array.isArray(o?.history)) return o.history
  if (Array.isArray(o?.data)) return o.data
  if (Array.isArray(o?.data?.history)) return o.data.history
  return []
}

export default function AssetHistoryModal({
  asset,
  history,
  loading,
  onClose,
}: {
  asset: AssetLite
  history: HistoryItem[]
  loading: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<'holders' | 'log'>('holders')

  const items = useMemo(() => normalizeHistory(history), [history])

  /* Build "who had it, from when to when" from the event list */
  const periods = useMemo<Period[]>(() => {
    const events = [...items].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (diff !== 0) return diff
      return (ACTION_ORDER[a.action] ?? 9) - (ACTION_ORDER[b.action] ?? 9)
    })

    const result: Period[] = []

    for (const e of events) {
      if (e.action === 'Assigned') {
        const last = result[result.length - 1]
        if (last && last.to === null) {
          last.to = e.date
          last.reasonOut = 'Reassigned'
        }
        result.push({
          name: e.employee_name || 'Unknown',
          from: e.date,
          to: null,
          reasonIn: e.reason,
        })
      } else if (e.action === 'Unassigned') {
        let open: Period | undefined
        for (let j = result.length - 1; j >= 0; j--) {
          if (result[j].to === null) {
            open = result[j]
            break
          }
        }
        if (open) {
          open.to = e.date
          open.reasonOut = e.reason
        }
      }
    }

    return result
  }, [items])

  const previous = periods.filter((p) => p.to !== null).reverse()
  const currentPeriod = periods.find((p) => p.to === null)

  const holderName = asset.assigned_to_name || null
  const holderSince = currentPeriod?.from || asset.assigned_date || null

  const log = [...items].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (diff !== 0) return diff
    return (ACTION_ORDER[b.action] ?? 9) - (ACTION_ORDER[a.action] ?? 9)
  })

  const tabBtn = (key: 'holders' | 'log', label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      style={{
        padding: '7px 16px',
        borderRadius: 16,
        border: `1px solid ${tab === key ? '#1565c0' : 'var(--border)'}`,
        background: tab === key ? '#1565c0' : 'transparent',
        color: tab === key ? '#fff' : 'var(--text-sub)',
        fontSize: '0.74rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label} ({count})
    </button>
  )

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Asset History – ${asset.asset_code}`}
    >
      <div style={{ width: '100%', maxWidth: 680, boxSizing: 'border-box' }}>
        {/* ASSET + CURRENT HOLDER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 12,
            padding: '12px 14px',
            boxSizing: 'border-box',
            marginBottom: 14,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'rgba(198,40,40,0.04)',
          }}
        >
          <div>
            <div style={labelStyle}>Asset</div>
            <div
              style={{
                marginTop: 3,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              {asset.name}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: 2,
              }}
            >
              {asset.asset_code}
              {asset.category ? ` · ${asset.category}` : ''}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Current Holder</div>
            {holderName ? (
              <>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#1565c0',
                  }}
                >
                  {holderName}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {holderSince
                    ? `Since ${fmtDate(holderSince)} (${daysBetween(
                        holderSince,
                        null
                      )})`
                    : 'Assignment date not recorded'}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#2e7d32',
                  }}
                >
                  Not assigned
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  Status: {asset.status || '—'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {tabBtn('holders', 'Previous Holders', previous.length)}
          {tabBtn('log', 'Activity Log', log.length)}
        </div>

        {/* CONTENT */}
        <div style={{ maxHeight: '48vh', overflow: 'auto' }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Loading...
            </p>
          ) : tab === 'holders' ? (
            previous.length === 0 && !currentPeriod ? (
              <div style={emptyBox}>
                No holders recorded yet.
                <div style={{ fontSize: '0.72rem', marginTop: 4 }}>
                  History is tracked from the day this feature went live.
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Employee</th>
                    <th style={th}>From</th>
                    <th style={th}>To</th>
                    <th style={th}>Used For</th>
                    <th style={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPeriod && (
                    <tr style={{ background: 'rgba(21,101,192,0.06)' }}>
                      <td
                        style={{
                          ...td,
                          fontWeight: 700,
                          color: '#1565c0',
                        }}
                      >
                        {currentPeriod.name} (current)
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {fmtDate(currentPeriod.from)}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>Present</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {daysBetween(currentPeriod.from, null)}
                      </td>
                      <td style={td}>{currentPeriod.reasonIn || '—'}</td>
                    </tr>
                  )}

                  {previous.map((p, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          ...td,
                          fontWeight: 600,
                          color: 'var(--text-main)',
                        }}
                      >
                        {p.name}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {p.from ? fmtDate(p.from) : 'Before tracking'}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {fmtDate(p.to)}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {daysBetween(p.from, p.to)}
                      </td>
                      <td style={td}>{p.reasonOut || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : log.length === 0 ? (
            <div style={emptyBox}>No activity yet.</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 22 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  bottom: 6,
                  width: 2,
                  background: 'var(--border)',
                }}
              />

              {log.map((h, i) => {
                const color = ACTION_COLOR[h.action] || '#757575'
                return (
                  <div
                    key={i}
                    style={{ position: 'relative', paddingBottom: 14 }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: -22,
                        top: 3,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: color,
                        border: '3px solid var(--bg-card, #fff)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div
                      style={{ fontSize: '0.82rem', fontWeight: 600, color }}
                    >
                      {h.action}
                      {h.employee_name ? (
                        <span style={{ color: 'var(--text-main)' }}>
                          {' '}
                          — {h.employee_name}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {fmtDateTime(h.date)}
                      {h.done_by ? ` · by ${h.done_by}` : ''}
                    </div>
                    {h.reason && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-sub)',
                          marginTop: 3,
                        }}
                      >
                        Reason: {h.reason}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CLOSE */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}