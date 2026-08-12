'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'
import {
  Paperclip, FileText, X, Ticket, CheckCircle2, ArrowLeft,
  Monitor, Package, Wifi, Mail, Lock, KeyRound, ShieldAlert, HelpCircle,
  Circle, AlertTriangle, AlertOctagon, Info, Check
} from 'lucide-react'

/* ─── Styles ─── */
const inp = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.83rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
}

const inpFocus = {
  borderColor: 'var(--red-primary)',
  boxShadow: '0 0 0 3px var(--red-glow)'
}

const FG = ({ label, children, full, error }: { label: string, children: React.ReactNode, full?: boolean, error?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : 'auto' }}>
    <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
      {label}
    </label>
    {children}
    {error && <span style={{ fontSize: '0.7rem', color: '#c62828', marginTop: 2 }}>{error}</span>}
  </div>
)

/* ─── Data ─── */
const CATEGORIES = [
  { value: 'Hardware Issue', icon: Monitor, subjectHint: 'Hardware issue with ' },
  { value: 'Software / Application', icon: Package, subjectHint: 'Application problem: ' },
  { value: 'Network / Connectivity', icon: Wifi, subjectHint: 'Network connectivity issue' },
  { value: 'Email / Communication', icon: Mail, subjectHint: 'Email problem with ' },
  { value: 'Access / Permissions', icon: Lock, subjectHint: 'Access request for ' },
  { value: 'Password Reset', icon: KeyRound, subjectHint: 'Password reset request' },
  { value: 'New Equipment Request', icon: Package, subjectHint: 'Equipment request: ' },
  { value: 'Security Incident', icon: ShieldAlert, subjectHint: 'Security incident report' },
  { value: 'Other', icon: HelpCircle, subjectHint: 'IT Support Request' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Informational / request', icon: Circle, color: '#2e7d32' },
  { value: 'medium', label: 'Medium', desc: 'Minor impact', icon: Info, color: '#f59e0b' },
  { value: 'high', label: 'High', desc: 'Major disruption', icon: AlertTriangle, color: '#e65100' },
  { value: 'critical', label: 'Critical', desc: 'Cannot work at all', icon: AlertOctagon, color: '#c62828' },
]

const DRAFT_KEY = 'raise-ticket-draft'

/* ─── Component ─── */
export default function RaiseTicket() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState({ category: '', priority: '', subject: '', description: '', asset: '', contact_pref: 'Email' })
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [myAssets, setMyAssets] = useState<any[]>([])
  const [assetSearch, setAssetSearch] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successTicketNo, setSuccessTicketNo] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  /* Load user + assets + draft */
  useEffect(() => {
    const u = getUser()
    setUser(u)
    setReady(true)

    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm(prev => ({ ...prev, ...parsed.form }))
      } catch { /* ignore */ }
    }

    api.get('/assets/my-assets')
      .then(res => setMyAssets(res.data?.assets || []))
      .catch(() => setMyAssets([]))
  }, [])

  /* Auto-save draft */
  useEffect(() => {
    if (!ready) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form }))
  }, [form, ready])

  /* File preview */
  useEffect(() => {
    if (!file) { setFilePreview(null); return }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setFilePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setFilePreview(null)
    }
  }, [file])

  /* Validation */
  const subjectValid = form.subject.trim().length >= 5
  const descFilled = form.description.trim().length > 0
  const catSelected = !!form.category
  const priSelected = !!form.priority

  const updateForm = useCallback((patch: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...patch }))
  }, [])

  /* Auto-suggest subject on category change */
  const handleCategorySelect = (catValue: string) => {
    const cat = CATEGORIES.find(c => c.value === catValue)
    updateForm({ category: catValue })
    if (cat && !form.subject.trim()) {
      updateForm({ subject: cat.subjectHint })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrorMsg('')

    if (!catSelected || !priSelected) {
      setErrorMsg('Please select an issue category and priority.')
      setLoading(false)
      return
    }
    if (!subjectValid) {
      setErrorMsg('Subject must be at least 5 characters.')
      setTouched(prev => ({ ...prev, subject: true }))
      setLoading(false)
      return
    }
    if (!descFilled) {
      setErrorMsg('Please enter a description.')
      setTouched(prev => ({ ...prev, description: true }))
      setLoading(false)
      return
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be less than 5MB')
      setLoading(false)
      return
    }

    try {
      let payload: any
      let config: any = {}

      if (file) {
        payload = new FormData()
        payload.append('category', form.category)
        payload.append('priority', form.priority)
        payload.append('subject', form.subject)
        payload.append('description', form.description)
        if (form.asset) payload.append('asset', form.asset)
        payload.append('contact_pref', form.contact_pref)
        payload.append('attachment', file)
        config.headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = form
      }

      const { data } = await api.post('/tickets', payload, config)
      setForm({ category: '', priority: '', subject: '', description: '', asset: '', contact_pref: 'Email' })
      setFile(null)
      setTouched({})
      setSuccessTicketNo(data.ticket_no)
      localStorage.removeItem(DRAFT_KEY)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to raise ticket')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  const selectedCat = CATEGORIES.find(c => c.value === form.category)
  const selectedPri = PRIORITIES.find(p => p.value === form.priority)

  const filteredAssets = myAssets.filter((a: any) =>
    `${a.asset_code} ${a.name}`.toLowerCase().includes(assetSearch.toLowerCase())
  )

  return (
    <AppLayout role={user?.role === 'admin' ? 'admin' : 'employee'}>
      <PageHeader breadcrumb="RAISE TICKET" title="Raise IT Support Ticket" subtitle="Submit a new request — our team responds within 4 business hours" />

      {/* ─── Page Container ─── */}
      <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 1rem' }}>

        {/* Your Details */}
        <div className="card" style={{ marginBottom: '0.9rem', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1.8rem', flexWrap: 'wrap' }}>
          {[['Name', user?.name || '—'], ['Employee ID', user?.emp_id || '—'], ['Department', user?.department || user?.dept || '—']].map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <div style={{ width: 1, height: 26, background: 'var(--border)' }} />}
              <div>
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{l}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 600 }}>{v}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 6, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.25)', color: '#c62828', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
            <AlertTriangle size={15} /> {errorMsg}
          </div>
        )}

        {/* Critical Warning */}
        {form.priority === 'critical' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 6, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.25)', color: '#c62828', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
            <AlertOctagon size={15} /> <strong>Critical Priority:</strong> This will immediately alert the on-call engineer and page the IT manager.
          </div>
        )}

        {/* ═════ SINGLE PAGE FORM ═════ */}
        <div className="card">
          <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ticket size={16} color="var(--red-primary)" strokeWidth={2} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Ticket</span>
          </div>

          <div style={{ padding: '1.4rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>

            {/* Category */}
            <FG label="Issue Category *" error={touched.category && !catSelected ? 'Please select a category' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.7rem', marginTop: 4 }}>
                {CATEGORIES.map(c => {
                  const Icon = c.icon
                  const active = form.category === c.value
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => { handleCategorySelect(c.value); setTouched(prev => ({ ...prev, category: true })) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        padding: '1rem 0.6rem', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: active ? '2px solid var(--red-primary)' : '1px solid var(--border)',
                        background: active ? 'var(--red-glow)' : 'var(--bg-input)',
                        transition: 'all 0.15s', transform: active ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      <Icon size={22} color={active ? 'var(--red-primary)' : 'var(--text-muted)'} strokeWidth={1.8} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? 'var(--red-primary)' : 'var(--text-sub)', lineHeight: 1.3 }}>{c.value}</span>
                    </button>
                  )
                })}
              </div>
            </FG>

            {/* Priority */}
            <FG label="Priority *" error={touched.priority && !priSelected ? 'Please select a priority' : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.7rem', marginTop: 4 }}>
                {PRIORITIES.map(p => {
                  const Icon = p.icon
                  const active = form.priority === p.value
                  return (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => { updateForm({ priority: p.value }); setTouched(prev => ({ ...prev, priority: true })) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '0.9rem 0.5rem', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        border: active ? `2px solid ${p.color}` : '1px solid var(--border)',
                        background: active ? `${p.color}15` : 'var(--bg-input)',
                        transition: 'all 0.15s', transform: active ? 'scale(1.02)' : 'scale(1)',
                        borderLeft: active ? `4px solid ${p.color}` : '1px solid var(--border)'
                      }}
                    >
                      <Icon size={20} color={active ? p.color : 'var(--text-muted)'} fill={active && p.value !== 'low' ? p.color : 'none'} strokeWidth={1.8} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? p.color : 'var(--text-sub)' }}>{p.label}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{p.desc}</span>
                    </button>
                  )
                })}
              </div>
            </FG>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Subject */}
            <FG label="Subject / Title *" error={touched.subject && !subjectValid ? 'Minimum 5 characters required' : undefined}>
              <input
                required
                value={form.subject}
                onChange={e => updateForm({ subject: e.target.value })}
                onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                onFocus={() => setFocusedField('subject')}
                onBlurCapture={() => setFocusedField(null)}
                placeholder="Brief description of the issue"
                style={{
                  ...inp,
                  ...(focusedField === 'subject' ? inpFocus : {}),
                  borderColor: touched.subject ? (subjectValid ? '#2e7d32' : '#c62828') : 'var(--border)'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: '0.68rem', color: touched.subject ? (subjectValid ? '#2e7d32' : '#c62828') : 'var(--text-muted)' }}>
                  {touched.subject && (subjectValid ? <><Check size={10} /> Looks good</> : 'Too short')}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{form.subject.length} chars</span>
              </div>
            </FG>

            {/* Description */}
            <FG label="Detailed Description *" error={touched.description && !descFilled ? 'Description is required' : undefined}>
              <textarea
                required
                value={form.description}
                onChange={e => updateForm({ description: e.target.value })}
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                onFocus={() => setFocusedField('description')}
                onBlurCapture={() => setFocusedField(null)}
                placeholder="Describe in detail: what happened, when it started, any error messages..."
                style={{
                  ...inp,
                  minHeight: 130,
                  resize: 'vertical',
                  ...(focusedField === 'description' ? inpFocus : {}),
                  borderColor: touched.description && !descFilled ? '#c62828' : 'var(--border)'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: '0.68rem', color: touched.description && !descFilled ? '#c62828' : 'var(--text-muted)' }}>
                  {touched.description && !descFilled ? 'Please add a description' : ''}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{form.description.length} chars</span>
              </div>
            </FG>

            {/* Asset + Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <FG label="Asset / Device (optional)">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)}
                    style={{ ...inp, marginBottom: 6 }}
                  />
                  <select
                    value={form.asset}
                    onChange={e => updateForm({ asset: e.target.value })}
                    style={inp}
                  >
                    <option value="">— No Asset / General Issue —</option>
                    {filteredAssets.map((a: any) => (
                      <option key={a._id || a.id} value={a.asset_code}>{a.asset_code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </FG>

              <FG label="Preferred Contact">
                <select value={form.contact_pref} onChange={e => updateForm({ contact_pref: e.target.value })} style={inp}>
                  <option>Email</option>
                  <option>Phone</option>
                  <option>In-Person</option>
                </select>
              </FG>
            </div>

            {/* Attachment */}
            <FG label="Attachment (optional) — max 5MB">
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                style={{
                  border: `1.5px dashed ${drag ? 'var(--red-primary)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '1rem', textAlign: 'center', cursor: 'pointer',
                  background: drag ? 'var(--red-glow)' : 'var(--bg-input)',
                  position: 'relative', transition: 'all 0.2s'
                }}
              >
                <input
                  type="file"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xlsx,.zip"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <Paperclip size={22} color="var(--text-muted)" strokeWidth={1.6} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Click to upload or drag & drop</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>JPG, PNG, PDF, DOC, XLSX, ZIP</div>
              </div>

              {file && (
                <div style={{
                  marginTop: 8, padding: '7px 10px', background: 'var(--bg-mid)',
                  borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.78rem',
                  color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  {filePreview ? (
                    <img src={filePreview} alt="preview" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                  ) : (
                    <FileText size={15} color="var(--red-primary)" />
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <X size={15} />
                  </button>
                </div>
              )}
            </FG>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={() => router.push(user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <ArrowLeft size={14} /> Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 22px', borderRadius: 6, border: 'none', background: 'var(--red-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
              >
                <Ticket size={14} /> {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>

          </div>
        </div>

      </div> {/* /page container */}

      {/* ═════ SUCCESS MODAL ═════ */}
      {successTicketNo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '1.6rem', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(46,125,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckCircle2 size={28} color="#2e7d32" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>Ticket Raised Successfully!</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Your ticket <strong style={{ color: 'var(--red-primary)', fontFamily: 'IBM Plex Mono' }}>{successTicketNo}</strong> has been submitted.
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>IT team will respond within 4 business hours.</p>
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setSuccessTicketNo(null); router.push(user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard') }}
                style={{ width: '100%', padding: '13px', border: 'none', background: 'var(--red-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Go to My Tickets
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}