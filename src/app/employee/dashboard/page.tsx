'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { StatCard, PageHeader, PriorityBadge, StatusBadge } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'

export default function EmployeeDashboard() {
  // ✅ FIX 1: initialize with tickets:[] so .length never crashes
  const [stats, setStats] = useState<any>({ total:0, open:0, in_progress:0, resolved:0, closed:0, tickets:[] })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // ✅ FIX 2: hydration-safe user load
  useEffect(() => { setUser(getUser()) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        // fetch stats (counts)
        const statsRes = await api.get('/tickets/my-stats')

        // fetch this employee's tickets list
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.8rem' }}>
            <StatCard label="Total Raised" value={stats.total}       sub="All time"         color="var(--red-primary)" />
            <StatCard label="Open"         value={stats.open}        sub="Awaiting IT team"  color="#c62828" />
            {/* ✅ FIX 3: was stats.inprog — backend sends in_progress */}
            <StatCard label="In Progress"  value={stats.in_progress} sub="Being worked on"  color="var(--orange)" />
            <StatCard label="Resolved"     value={stats.resolved}    sub="Completed"        color="var(--green)" />
          </div>

          <div className="card">
            <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-mid)' }}>
              <span style={{ fontSize:'0.87rem', fontWeight:600 }}>My Tickets</span>
              <Link href="/employee/raise-ticket" style={{ background:'var(--red-primary)', color:'#fff', padding:'6px 14px', borderRadius:5, fontSize:'0.78rem', fontWeight:600, textDecoration:'none' }}>+ Raise New Ticket</Link>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Ticket ID','Subject','Category','Priority','Status','Created','Action'].map(h => (
                      <th key={h} style={{ fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', padding:'10px 1.4rem', textAlign:'left', borderBottom:'1px solid var(--border)', background:'rgba(198,40,40,0.04)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:'2.5rem', textAlign:'center', color:'var(--text-muted)' }}>
                        You haven't raised any tickets yet.{' '}
                        <Link href="/employee/raise-ticket" style={{ color:'var(--red-primary)' }}>Raise your first ticket →</Link>
                      </td>
                    </tr>
                  ) : stats.tickets.map((t: any) => (
                    <tr key={t._id || t.id} style={{ borderBottom:'1px solid var(--border-mid)' }}>
                      <td style={{ padding:'12px 1.4rem', color:'var(--red-primary)', fontFamily:'IBM Plex Mono', fontSize:'0.77rem' }}>{t.ticket_no}</td>
                      <td style={{ padding:'12px 1.4rem', fontSize:'0.83rem', color:'var(--text-main)' }}>{t.subject}</td>
                      <td style={{ padding:'12px 1.4rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>{t.category}</td>
                      <td style={{ padding:'12px 1.4rem' }}><PriorityBadge priority={t.priority} /></td>
                      <td style={{ padding:'12px 1.4rem' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding:'12px 1.4rem', fontSize:'0.73rem', color:'var(--text-muted)', fontFamily:'IBM Plex Mono' }}>
                        {new Date(t.created_at || t.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                      <td style={{ padding:'12px 1.4rem' }}>
                        <Link href={`/employee/view-ticket/${t._id || t.id}`} style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:5, padding:'4px 10px', fontSize:'0.71rem', fontWeight:600, textDecoration:'none' }}>View</Link>
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