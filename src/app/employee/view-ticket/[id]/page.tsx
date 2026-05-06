'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { PriorityBadge, StatusBadge } from '@/components/ui'
import api from '@/lib/api'

export default function ViewTicket() {
  const { id }   = useParams()
  const router   = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [logs,   setLogs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    api.get(`/api/tickets/${id}`).then(r => { setTicket(r.data); setLogs(r.data.logs) }).catch(() => router.replace('/employee/dashboard')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppLayout role="employee"><div style={{ color:'var(--text-muted)' }}>Loading...</div></AppLayout>
  if (!ticket) return null

  const att    = ticket.attachment
  const attUrl = att ? `${API_URL}/uploads/${att}` : null
  const isImg  = att && /\.(jpg|jpeg|png|gif|webp)$/i.test(att)

  return (
    <AppLayout role="employee">
      <div style={{ marginBottom:'1.8rem' }}>
        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'IBM Plex Mono', marginBottom:6 }}>
          TICKETDESK / <Link href="/employee/dashboard" style={{ color:'var(--text-muted)', textDecoration:'none' }}>MY TICKETS</Link> / <span style={{ color:'var(--red-primary)' }}>{ticket.ticket_no}</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
          <div><h1 style={{ fontSize:'1.45rem', fontWeight:700, fontFamily:'IBM Plex Mono', color:'var(--text-main)' }}>{ticket.ticket_no}</h1>
          <p style={{ color:'var(--text-sub)', fontSize:'0.84rem', marginTop:4 }}>{ticket.subject}</p></div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></div>
        </div>
      </div>

      {/* Details */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}><span style={{ fontSize:'0.87rem', fontWeight:600 }}>Ticket Details</span></div>
        <div style={{ padding:'1.5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            {[['Ticket No', ticket.ticket_no, true],['Category', ticket.category, false],['Contact Pref', ticket.contact_pref, false],
              ['Created', new Date(ticket.created_at).toLocaleString(), true],['Last Updated', new Date(ticket.updated_at).toLocaleString(), true],
              ticket.asset && ['Asset/Device', ticket.asset, false]].filter(Boolean).map(([l,v,mono]: any) => (
              <div key={l}><div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-main)', fontFamily:mono?'IBM Plex Mono':'inherit' }}>{v}</div></div>
            ))}
          </div>
          <div style={{ height:1, background:'var(--border)', margin:'1.2rem 0' }} />
          <div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:8 }}>Description</div>
          <div style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:6, padding:14, fontSize:'0.85rem', color:'var(--text-sub)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{ticket.description}</div>
        </div>
      </div>

      {/* Attachment */}
      {att && <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'0.87rem', fontWeight:600 }}>📎 Your Attachment</span>
          <a href={attUrl!} download style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:5, padding:'4px 10px', fontSize:'0.71rem', fontWeight:600, textDecoration:'none' }}>⬇️ Download</a>
        </div>
        {isImg ? (
          <><img src={attUrl!} alt="attachment" style={{ width:'100%', maxHeight:320, objectFit:'contain', display:'block', background:'#000', cursor:'zoom-in' }} onClick={()=>window.open(attUrl!,'_blank')}/>
          <div style={{ padding:'0.7rem 1.2rem', fontSize:'0.75rem', color:'var(--text-muted)', borderTop:'1px solid var(--border-mid)' }}>📁 {att} · <a href={attUrl!} target="_blank" style={{ color:'var(--red-primary)' }}>Open in new tab ↗</a></div></>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'1rem 1.2rem' }}>
            <span style={{ fontSize:'2rem' }}>📄</span>
            <div><div style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--text-main)' }}>{att}</div></div>
            <a href={attUrl!} download style={{ marginLeft:'auto', background:'var(--red-primary)', color:'#fff', borderRadius:5, padding:'6px 14px', fontSize:'0.8rem', fontWeight:600, textDecoration:'none' }}>⬇️ Download</a>
          </div>
        )}
      </div>}

      {/* Activity */}
      <div className="card">
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}><span style={{ fontSize:'0.87rem', fontWeight:600 }}>🔔 Activity / Updates</span></div>
        <div style={{ padding:'1.5rem' }}>
          {logs.length===0 ? <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>No updates yet. The IT team will update this ticket shortly.</p> :
          logs.map((log:any,i:number)=>(
            <div key={i} style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red-primary)', marginTop:5, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-sub)', lineHeight:1.5 }}><strong style={{ color:'var(--text-main)' }}>{log.done_by_name}</strong> — {log.action}
                  {log.note && <><br/><span style={{ color:'var(--text-muted)' }}>{log.note}</span></>}
                </div>
                <div style={{ fontSize:'0.69rem', color:'var(--text-muted)', fontFamily:'IBM Plex Mono', marginTop:2 }}>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          <div style={{ height:1, background:'var(--border)', margin:'1.2rem 0' }} />
          <Link href="/employee/dashboard" style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:5, padding:'6px 14px', fontSize:'0.8rem', fontWeight:600, textDecoration:'none' }}>← Back to My Tickets</Link>
        </div>
      </div>
    </AppLayout>
  )
}
