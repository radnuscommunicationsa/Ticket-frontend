'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { StatCard, PageHeader, PriorityBadge, StatusBadge } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'
import { Plus } from 'lucide-react'

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<any>({ total:0, open:0, in_progress:0, resolved:0, closed:0, tickets:[] })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => { setUser(getUser()) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const statsRes = await api.get('/tickets/my-stats')
        const ticketsRes = await api.get('/tickets/my-tickets')
        setStats({
          ...statsRes.data,
          tickets: ticketsRes.data || []
        })
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppLayout role="employee">
      <PageHeader
        breadcrumb="MY TICKETS"
        title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}!`}
        subtitle="Your IT support tickets — track status and updates"
      />

      {loading ? (
        <div style={{ color:'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.9rem', marginBottom:'1.4rem' }}>
            <StatCard label="Total Raised" value={stats.total}       sub="All time"         color="#7c3aed" />
            <StatCard label="Open"         value={stats.open}        sub="Awaiting IT team"  color="#a855f7" />
            <StatCard label="In Progress"  value={stats.in_progress} sub="Being worked on"  color="#f59e0b" />
            <StatCard label="Resolved"     value={stats.resolved}    sub="Completed"        color="#10b981" />
          </div>

          <div className="card">
            <div style={{ padding:'0.9rem 1.2rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-mid)' }}>
              <span style={{ fontSize:'0.85rem', fontWeight:600 }}>My Tickets</span>
              <Link href="/employee/raise-ticket" style={{ display:'flex', alignItems:'center', gap:6, background:'var(--red-primary)', color:'#fff', padding:'6px 14px', borderRadius:6, fontSize:'0.76rem', fontWeight:600, textDecoration:'none' }}>
                <Plus size={13}/> Raise New Ticket
              </Link>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Ticket ID','Subject','Category','Priority','Status','Created','Action'].map(h => (
                      <th key={h} style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--text-muted)', padding:'9px 1.2rem', textAlign:'left', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:'2.2rem', textAlign:'center', color:'var(--text-muted)' }}>
                        You haven't raised any tickets yet.{' '}
                        <Link href="/employee/raise-ticket" style={{ color:'var(--red-primary)' }}>Raise your first ticket →</Link>
                      </td>
                    </tr>
                  ) : stats.tickets.map((t: any) => (
                    <tr key={t._id || t.id} style={{ borderBottom:'1px solid var(--border-mid)' }}>
                      <td style={{ padding:'10px 1.2rem', color:'var(--red-primary)', fontFamily:'IBM Plex Mono', fontSize:'0.75rem', fontWeight:600 }}>{t.ticket_no}</td>
                      <td style={{ padding:'10px 1.2rem', fontSize:'0.82rem', color:'var(--text-main)' }}>{t.subject}</td>
                      <td style={{ padding:'10px 1.2rem', fontSize:'0.76rem', color:'var(--text-muted)' }}>{t.category}</td>
                      <td style={{ padding:'10px 1.2rem' }}><PriorityBadge priority={t.priority} /></td>
                      <td style={{ padding:'10px 1.2rem' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding:'10px 1.2rem', fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'IBM Plex Mono' }}>
                        {new Date(t.created_at || t.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                      <td style={{ padding:'10px 1.2rem' }}>
                        <Link href={`/employee/view-ticket/${t._id || t.id}`} style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:5, padding:'4px 10px', fontSize:'0.7rem', fontWeight:600, textDecoration:'none' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}