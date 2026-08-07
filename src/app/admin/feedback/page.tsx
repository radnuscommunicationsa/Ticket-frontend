'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { Star, MessageSquareText, TrendingUp } from 'lucide-react'

const StarRow = ({ rating, size = 14 }: { rating: number, size?: number }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : 'var(--border)'} />
    ))}
  </div>
)

export default function AdminFeedback() {
  const router = useRouter()
  const [data, setData] = useState<any>({ feedbackList: [], totalReviews: 0, avgRating: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<any>(null)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const { data: res } = await api.get('/tickets/feedback/all')
      setData(res)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load feedback' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredList = ratingFilter
    ? data.feedbackList.filter((f: any) => f.rating === ratingFilter)
    : data.feedbackList

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="FEEDBACK" title="Customer Feedback" subtitle="Employee reviews on resolved support tickets" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Average Rating */}
            <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Average Rating</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--red-primary)', fontFamily: 'IBM Plex Mono' }}>{data.avgRating || 0}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                <StarRow rating={Math.round(data.avgRating || 0)} size={16} />
              </div>
            </div>

            {/* Total Reviews */}
            <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Reviews</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'IBM Plex Mono' }}>{data.totalReviews || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <MessageSquareText size={12}/> Feedback submitted
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="card" style={{ padding: '1.2rem' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>Rating Distribution</div>
              {[5, 4, 3, 2, 1].map(star => {
                const count = data.distribution?.[star] || 0
                const pct = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 10 }}>{star}</span>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-mid)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 20, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FILTER */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
            <button onClick={() => setRatingFilter(null)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
              background: ratingFilter === null ? 'var(--red-glow)' : 'var(--bg-card)',
              color: ratingFilter === null ? 'var(--red-primary)' : 'var(--text-sub)',
              border: `1px solid ${ratingFilter === null ? 'var(--red-primary)' : 'var(--border)'}`
            }}>All</button>
            {[5, 4, 3, 2, 1].map(star => (
              <button key={star} onClick={() => setRatingFilter(star)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
                background: ratingFilter === star ? 'var(--red-glow)' : 'var(--bg-card)',
                color: ratingFilter === star ? 'var(--red-primary)' : 'var(--text-sub)',
                border: `1px solid ${ratingFilter === star ? 'var(--red-primary)' : 'var(--border)'}`
              }}>
                {star} <Star size={11} fill="currentColor"/>
              </button>
            ))}
          </div>

          {/* FEEDBACK LIST */}
          <div className="card">
            <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-mid)' }}>
              <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>Reviews ({filteredList.length})</span>
            </div>
            <div>
              {filteredList.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <TrendingUp size={36} strokeWidth={1.5} style={{ margin: '0 auto 10px', opacity: 0.5 }}/>
                  No feedback found.
                </div>
              ) : (
                filteredList.map((f: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => router.push(`/admin/tickets/${f.ticket_id}`)}
                    style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border-mid)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{f.emp_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {f.department}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--red-primary)', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>{f.ticket_no} — {f.subject}</div>
                      </div>
                      <StarRow rating={f.rating} size={15} />
                    </div>
                    {f.comment && <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', marginTop: 6, background: 'var(--bg-input)', padding: '8px 10px', borderRadius: 6 }}>{f.comment}</div>}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>{f.submitted_at ? new Date(f.submitted_at).toLocaleString() : ''}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}