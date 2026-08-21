'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'

import {
  ArrowLeft,
  Home,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Send,
  User,
  Phone,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  History,
  RefreshCw,
} from 'lucide-react'

/* =========================================================
   INPUT STYLES
========================================================= */

const inp: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.83rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

/* =========================================================
   FORM GROUP
========================================================= */

const FG = ({
  label,
  children,
  full,
  error,
  hint,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
  error?: string
  hint?: string
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      gridColumn: full ? '1/-1' : 'auto',
    }}
  >
    <label
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
      }}
    >
      {label}
    </label>

    {children}

    {error && (
      <span style={{ fontSize: '0.7rem', color: '#c62828', marginTop: 2 }}>
        {error}
      </span>
    )}

    {hint && !error && (
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
        {hint}
      </span>
    )}
  </div>
)

/* =========================================================
   ASSET TYPES
========================================================= */

const ASSET_TYPES = [
  { value: 'laptop', label: 'Laptop', icon: Laptop, desc: 'Company laptop / notebook' },
  { value: 'mobile', label: 'Mobile Phone', icon: Smartphone, desc: 'Company mobile device' },
  { value: 'tablet', label: 'Tablet / iPad', icon: Tablet, desc: 'Company tablet device' },
  { value: 'monitor', label: 'Monitor / Peripherals', icon: Monitor, desc: 'External display, keyboard, mouse' },
  { value: 'other', label: 'Other IT Equipment', icon: Briefcase, desc: 'Any other IT asset' },
]


/* =========================================================
   ASSET TYPE KEYWORDS (robust matching)
========================================================= */

const TYPE_KEYWORDS: Record<string, string[]> = {
  laptop: ['laptop', 'notebook', 'computer', 'macbook'],
  mobile: ['mobile', 'phone', 'smartphone', 'cell', 'iphone', 'android', 'device'],
  tablet: ['tablet', 'ipad', 'tab'],
  monitor: ['monitor', 'display', 'screen', 'peripheral', 'keyboard', 'mouse', 'desktop'],
  other: [],
}

function assetMatchesType(asset: any, typeValue: string): boolean {
  const assetType = (asset.type || asset.category || asset.asset_type || '').toLowerCase()
  if (typeValue === 'other') {
    const allKnown = Object.values(TYPE_KEYWORDS)
      .flat()
      .filter((k) => k !== 'other')
    return !allKnown.some((k) => assetType.includes(k))
  }
  const keywords = TYPE_KEYWORDS[typeValue] || [typeValue]
  return keywords.some((k) => assetType.includes(k))
}
/* =========================================================
   REQUEST STATUS CONFIG
========================================================= */

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Manager Approval',
  approved_by_manager: 'Pending IT Approval',
  approved: 'Approved — Ready',
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

const STATUS_STEP: Record<string, number> = {
  pending: 1,
  approved_by_manager: 2,
  approved: 3,
  rejected: -1,
  returned: 4,
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB')
}

function getAssetLabel(req: any) {
  if (typeof req.asset_id === 'object' && req.asset_id) {
    return [req.asset_id.asset_code, req.asset_id.name].filter(Boolean).join(' — ')
  }
  return req.asset_type || 'Asset'
}

/* =========================================================
   MY REQUESTS SECTION (status tracking)
========================================================= */

function MyRequestsSection() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const load = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/assets/take-home-requests/my')
      setRequests(Array.isArray(data?.requests) ? data.requests : [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: '1.2rem' }}>
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          padding: '0.9rem 1.2rem',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          background: 'var(--bg-mid)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="var(--red-primary)" strokeWidth={2} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            My Requests ({requests.length})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              load(true)
            }}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          {collapsed ? (
            <ChevronDown size={16} color="var(--text-muted)" />
          ) : (
            <ChevronUp size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {requests.map((req) => {
            const isOpen = expandedIds.has(req._id)
            const step = STATUS_STEP[req.status] ?? 0

            return (
              <div key={req._id} style={{ borderBottom: '1px solid var(--border-mid)' }}>
                <div
                  onClick={() => toggleExpand(req._id)}
                  style={{
                    padding: '0.8rem 1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    cursor: 'pointer',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Laptop size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>
                      {getAssetLabel(req)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {fmtDate(req.from_date)} → {fmtDate(req.to_date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
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
                      <ChevronUp size={14} color="var(--text-muted)" />
                    ) : (
                      <ChevronDown size={14} color="var(--text-muted)" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {step > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.5rem 0' }}>
                        {['Submitted', 'Manager Approval', 'IT Approval', 'Returned'].map((label, idx) => {
                          const stepNum = idx + 1
                          const reached = step >= stepNum || (stepNum === 1)
                          const isCurrent = step === stepNum
                          return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: idx < 3 ? 1 : 0 }}>
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: reached ? STATUS_COLOR[req.status] : 'var(--border)',
                                  color: reached ? '#fff' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  border: isCurrent ? '2px solid var(--red-primary)' : 'none',
                                }}
                                title={label}
                              >
                                {stepNum}
                              </div>
                              {idx < 3 && (
                                <div
                                  style={{
                                    flex: 1,
                                    height: 2,
                                    background: step > stepNum ? STATUS_COLOR[req.status] : 'var(--border)',
                                    margin: '0 4px',
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.7rem',
                        padding: '0.7rem 0.9rem',
                        background: 'rgba(198,40,40,0.03)',
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                          <FileText size={10} style={{ display: 'inline', marginRight: 4 }} />
                          Reason
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{req.reason}</div>
                      </div>

                      {req.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                            Admin / Manager Notes
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>{req.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
    </div>
  )
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AssetTakeHomeRequest() {
  const router = useRouter()

  /* USER */
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  /* FORM — asset_types (multi-select array) and asset_ids (multi-select array) */
  const [form, setForm] = useState({
    asset_types: [] as string[],
    asset_ids: [] as string[],
    reason: '',
    from_date: '',
    to_date: '',
    emergency_contact: '',
    emergency_phone: '',
    acknowledgement: false,
  })

  /* UI */
  const [loading, setLoading] = useState(false)

  /* ASSETS */
  const [myAssets, setMyAssets] = useState<any[]>([])
  const [assetSearch, setAssetSearch] = useState('')

  /* MESSAGES */
  const [errorMsg, setErrorMsg] = useState('')
  const [successCount, setSuccessCount] = useState<number | null>(null)

  /* VALIDATION */
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /* refresh key to force MyRequestsSection to reload after a new submit */
  const [historyKey, setHistoryKey] = useState(0)

  /* =========================================================
     LOAD USER + ASSETS
  ========================================================= */

  useEffect(() => {
    const u = getUser()
    setUser(u)
    setReady(true)

    api
      .get('/assets/my-assets')
      .then((res) => {
        setMyAssets(res.data?.assets || [])
      })
      .catch(() => {
        setMyAssets([])
      })
  }, [])

  /* =========================================================
     SUCCESS MODAL — LOCK BODY SCROLL
  ========================================================= */

  useEffect(() => {
    if (successCount !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [successCount])

  /* =========================================================
     HELPERS
  ========================================================= */

  const updateForm = useCallback((patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setErrorMsg('')
  }, [])

  /* Toggle a type on/off (multi-select) instead of switching to a single type.
     When a type is removed, any selected assets that only matched that
     type are dropped from the selection so the list stays consistent. */
    const handleTypeToggle = (type: string) => {
    setForm((prev) => {
      const isActive = prev.asset_types.includes(type)
      const nextTypes = isActive
        ? prev.asset_types.filter((t) => t !== type)
        : [...prev.asset_types, type]

      const stillMatches = (a: any) => {
        if (nextTypes.length === 0) return false
        return nextTypes.some((t) => assetMatchesType(a, t))
      }

      const nextAssetIds = prev.asset_ids.filter((id) => {
        const asset = myAssets.find((a) => (a._id || a.id) === id)
        return asset ? stillMatches(asset) : false
      })

      return { ...prev, asset_types: nextTypes, asset_ids: nextAssetIds }
    })
    setTouched((prev) => ({ ...prev, asset_types: true }))
    setErrorMsg('')
  }

  const toggleAsset = (id: string) => {
    setForm((prev) => {
      const exists = prev.asset_ids.includes(id)
      return {
        ...prev,
        asset_ids: exists
          ? prev.asset_ids.filter((a) => a !== id)
          : [...prev.asset_ids, id],
      }
    })
    setTouched((prev) => ({ ...prev, asset_ids: true }))
    setErrorMsg('')
  }

  /* Figure out which selected type an asset belongs to, for the
     per-request asset_type field the backend expects. */
    const resolveAssetType = (asset: any): string => {
    const match = form.asset_types.find((t) => assetMatchesType(asset, t))
    return match || 'other'
  }
  /* =========================================================
     VALIDATION
  ========================================================= */

  const typeSelected = form.asset_types.length > 0
  const assetSelected = form.asset_ids.length > 0
  const reasonValid = form.reason.trim().length > 0
  const fromValid = !!form.from_date
  const toValid = !!form.to_date
  const datesValid =
    fromValid && toValid ? new Date(form.from_date) <= new Date(form.to_date) : true
  const phoneValid = form.emergency_phone.trim().length >= 8
  const ackChecked = form.acknowledgement

  /* =========================================================
     FILTERED ASSETS — matches ANY of the selected types
  ========================================================= */

    const filteredAssets = myAssets
    .filter((a: any) => {
      if (form.asset_types.length === 0) return false
      return form.asset_types.some((t) => assetMatchesType(a, t))
    })
    .filter((a: any) =>
      `${a.asset_code || ''} ${a.name || ''} ${a.model || ''}`
        .toLowerCase()
        .includes(assetSearch.toLowerCase())
    )

  /* =========================================================
     SUBMIT — loops through each selected asset and creates
     one take-home request per asset (backend endpoint still
     accepts a single asset_id, so we call it once per asset)
  ========================================================= */

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    setErrorMsg('')

    if (!typeSelected) {
      setErrorMsg('Please select at least one asset type.')
      setTouched((prev) => ({ ...prev, asset_types: true }))
      setLoading(false)
      return
    }

    if (!assetSelected) {
      setErrorMsg('Please select at least one asset from your assigned list.')
      setTouched((prev) => ({ ...prev, asset_ids: true }))
      setLoading(false)
      return
    }

    if (!reasonValid) {
      setErrorMsg('Please provide a reason.')
      setTouched((prev) => ({ ...prev, reason: true }))
      setLoading(false)
      return
    }

    if (!fromValid || !toValid) {
      setErrorMsg('Please select both from and to dates.')
      setTouched((prev) => ({ ...prev, from_date: true, to_date: true }))
      setLoading(false)
      return
    }

    if (!datesValid) {
      setErrorMsg('Return date must be after or same as take-home date.')
      setLoading(false)
      return
    }

    if (!phoneValid) {
      setErrorMsg('Please provide a valid emergency contact number.')
      setTouched((prev) => ({ ...prev, emergency_phone: true }))
      setLoading(false)
      return
    }

    if (!ackChecked) {
      setErrorMsg('Please acknowledge the terms before submitting.')
      setLoading(false)
      return
    }

    try {
      const baseFields = {
        reason: form.reason.trim(),
        from_date: form.from_date,
        to_date: form.to_date,
        emergency_contact: form.emergency_contact.trim() || user?.name,
        emergency_phone: form.emergency_phone.trim(),
      }

      const results = await Promise.allSettled(
        form.asset_ids.map((asset_id) => {
          const asset = myAssets.find((a: any) => (a._id || a.id) === asset_id)
          const asset_type = asset ? resolveAssetType(asset) : 'other'
          return api.post('/assets/take-home-requests', {
            ...baseFields,
            asset_id,
            asset_type,
          })
        })
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.length - succeeded

      if (succeeded === 0) {
        const firstError = results.find(
          (r): r is PromiseRejectedResult => r.status === 'rejected'
        )
        setErrorMsg(
          firstError?.reason?.response?.data?.error ||
          'Failed to submit request(s). Please try again.'
        )
        setLoading(false)
        return
      }

      setSuccessCount(succeeded)
      if (failed > 0) {
        setErrorMsg(
          `${failed} of ${results.length} asset request(s) could not be submitted (already pending or unavailable).`
        )
      }
      setHistoryKey((k) => k + 1)

      setForm((prev) => ({ ...prev, asset_ids: [] }))
    } catch (err: any) {
      console.error('TAKE HOME REQUEST ERROR:', err)
      setErrorMsg(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  if (!ready) return null

  const today = new Date().toISOString().split('T')[0]

  return (
    <AppLayout role="employee">
      <PageHeader
        breadcrumb="ASSETS / TAKE HOME"
        title="Request Asset for Home Use"
        subtitle="Submit a request to take your assigned IT equipment home for remote work"
      />

      <div
        style={{
          width: '100%',
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 1rem',
          boxSizing: 'border-box',
        }}
      >
        {/* MY REQUESTS — STATUS TRACKING */}
        <MyRequestsSection key={historyKey} />

        {/* USER DETAILS */}
        <div
          className="card"
          style={{
            marginBottom: '0.9rem',
            padding: '0.9rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.8rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            ['Name', user?.name || '—'],
            ['Employee ID', user?.emp_id || '—'],
            ['Department', user?.department || user?.dept || '—'],
          ].map(([label, value], index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {index > 0 && (
                <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
              )}
              <div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(198,40,40,0.08)',
              border: '1px solid rgba(198,40,40,0.25)',
              color: '#c62828',
              fontSize: '0.82rem',
              marginBottom: '0.9rem',
            }}
          >
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM CARD */}
        <div className="card">
          {/* HEADER */}
          <div
            style={{
              padding: '0.9rem 1.2rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-mid)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Home size={16} color="var(--red-primary)" strokeWidth={2} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Take-Home Request</span>
          </div>

          <div style={{ padding: '1.4rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
            {/* ASSET TYPE(S) — MULTI-SELECT TOGGLE BUTTONS */}
            <FG
              label={`Asset Type(s) * ${form.asset_types.length > 0 ? `(${form.asset_types.length} selected)` : ''}`}
              error={touched.asset_types && !typeSelected ? 'Please select at least one asset type' : undefined}
              hint="You can select more than one type, e.g. Laptop and Mobile Phone together."
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.7rem',
                  marginTop: 4,
                }}
              >
                {ASSET_TYPES.map((type) => {
                  const Icon = type.icon
                  const active = form.asset_types.includes(type.value)

                  return (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => handleTypeToggle(type.value)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.9rem 0.5rem',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'center',
                        position: 'relative',
                        border: active
                          ? '2px solid var(--red-primary)'
                          : '1px solid var(--border)',
                        background: active ? 'var(--red-glow)' : 'var(--bg-input)',
                        transition: 'all 0.15s',
                        transform: active ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      {active && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'var(--red-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <Icon
                        size={22}
                        color={active ? 'var(--red-primary)' : 'var(--text-muted)'}
                        strokeWidth={1.8}
                      />
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: active ? 'var(--red-primary)' : 'var(--text-sub)',
                        }}
                      >
                        {type.label}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        {type.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </FG>

            {/* SELECT ASSET(S) — MULTI-SELECT CHECKBOX LIST */}
            <FG
              label={`Select Your Asset(s) * ${form.asset_ids.length > 0 ? `(${form.asset_ids.length} selected)` : ''}`}
              error={touched.asset_ids && !assetSelected ? 'Please select at least one asset' : undefined}
              hint={
                filteredAssets.length === 0 && typeSelected
                  ? 'No assigned assets found for the selected type(s). Contact IT if you need an asset assigned.'
                  : undefined
              }
            >
              <input
                type="text"
                placeholder="Search your assigned assets..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                style={{ ...inp, marginBottom: 6 }}
                disabled={!typeSelected}
              />

              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  maxHeight: 220,
                  overflowY: 'auto',
                  opacity: !typeSelected ? 0.5 : 1,
                  pointerEvents: !typeSelected ? 'none' : 'auto',
                  background: 'var(--bg-input)',
                }}
              >
                {filteredAssets.length === 0 ? (
                  <div style={{ padding: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {typeSelected ? 'No matching assets.' : 'Select an asset type above first.'}
                  </div>
                ) : (
                  filteredAssets.map((a: any) => {
                    const id = a._id || a.id
                    const checked = form.asset_ids.includes(id)
                    return (
                      <label
                        key={id}
                        onClick={() => toggleAsset(id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderBottom: '1px solid var(--border-mid)',
                          cursor: 'pointer',
                          background: checked ? 'var(--red-glow)' : 'transparent',
                          transition: 'background 0.12s',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: checked ? '2px solid var(--red-primary)' : '2px solid var(--border)',
                            background: checked ? 'var(--red-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          <strong style={{ fontFamily: 'IBM Plex Mono', color: 'var(--red-primary)' }}>
                            {a.asset_code}
                          </strong>{' '}
                          — {a.name} {a.model ? `(${a.model})` : ''}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </FG>

            {/* DURATION */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <FG
                label="From Date *"
                error={
                  touched.from_date && !fromValid
                    ? 'Required'
                    : touched.from_date && touched.to_date && !datesValid
                      ? 'Invalid date range'
                      : undefined
                }
              >
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    min={today}
                    value={form.from_date}
                    onChange={(e) => updateForm({ from_date: e.target.value })}
                    onBlur={() => setTouched((prev) => ({ ...prev, from_date: true }))}
                    style={inp}
                  />
                  <Calendar
                    size={14}
                    color="var(--text-muted)"
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </FG>

              <FG
                label="Expected Return Date *"
                error={
                  touched.to_date && !toValid
                    ? 'Required'
                    : touched.from_date && touched.to_date && !datesValid
                      ? 'Must be after from date'
                      : undefined
                }
              >
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    min={form.from_date || today}
                    value={form.to_date}
                    onChange={(e) => updateForm({ to_date: e.target.value })}
                    onBlur={() => setTouched((prev) => ({ ...prev, to_date: true }))}
                    style={inp}
                  />
                  <Calendar
                    size={14}
                    color="var(--text-muted)"
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </FG>
            </div>

            {/* REASON — no minimum character requirement */}
            <FG
              label="Reason / Purpose *"
              error={
                touched.reason && !reasonValid
                  ? 'Please provide a reason'
                  : undefined
              }
            >
              <textarea
                value={form.reason}
                onChange={(e) => updateForm({ reason: e.target.value })}
                onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
                placeholder="Explain why you need this asset at home (e.g., remote work project, WFH mandate, client visit prep...)"
                style={{
                  ...inp,
                  minHeight: 100,
                  resize: 'vertical',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: 2,
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {form.reason.length} chars
                </span>
              </div>
            </FG>

            {/* EMERGENCY CONTACT */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              <FG label="Emergency Contact Name">
                <div style={{ position: 'relative' }}>
                  <User
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={form.emergency_contact}
                    onChange={(e) => updateForm({ emergency_contact: e.target.value })}
                    placeholder="Contact person while at home"
                    style={{ ...inp, paddingLeft: 32 }}
                  />
                </div>
              </FG>

              <FG
                label="Emergency Phone *"
                error={
                  touched.emergency_phone && !phoneValid
                    ? 'Valid phone number required'
                    : undefined
                }
              >
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={14}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="tel"
                    value={form.emergency_phone}
                    onChange={(e) => updateForm({ emergency_phone: e.target.value })}
                    onBlur={() => setTouched((prev) => ({ ...prev, emergency_phone: true }))}
                    placeholder="Reachable phone number"
                    style={{ ...inp, paddingLeft: 32 }}
                  />
                </div>
              </FG>
            </div>

            {/* ACKNOWLEDGEMENT */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 8,
                background: 'var(--bg-mid)',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <button
                type="button"
                onClick={() => updateForm({ acknowledgement: !form.acknowledgement })}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: form.acknowledgement
                    ? '2px solid var(--red-primary)'
                    : '2px solid var(--border)',
                  background: form.acknowledgement ? 'var(--red-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: 2,
                  transition: 'all 0.15s',
                }}
              >
                {form.acknowledgement && <Check size={12} color="#fff" strokeWidth={3} />}
              </button>

              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: 2,
                  }}
                >
                  Terms & Responsibility
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  I acknowledge that I am responsible for the safekeeping of this company asset
                  while it is in my possession. I agree to return it by the specified date, report
                  any damage immediately, and understand that misuse or loss may result in
                  disciplinary action or recovery of costs.
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'space-between',
                marginTop: '0.4rem',
                paddingTop: '0.6rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => router.push('/employee/my-assets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} />
                Back to Assets
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 22px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--red-primary)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Send size={14} />
                {loading
                  ? 'Submitting...'
                  : form.asset_ids.length > 1
                    ? `Submit ${form.asset_ids.length} Requests`
                    : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {successCount !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              width: '100%',
              maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.6rem', textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(46,125,50,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={28} color="#2e7d32" />
              </div>

              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: 6,
                }}
              >
                {successCount > 1 ? `${successCount} Requests Submitted!` : 'Request Submitted!'}
              </h3>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                {successCount > 1
                  ? `Your ${successCount} asset requests have`
                  : 'Your request has'}{' '}
                been sent for approval.
              </p>

              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-mid)',
                  borderRadius: 8,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Approval Timeline
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                  Manager approval: <strong>1-2 business days</strong>
                  <br />
                  IT handover: <strong>After manager approval</strong>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setSuccessCount(null)
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  border: 'none',
                  background: 'var(--red-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                View My Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}