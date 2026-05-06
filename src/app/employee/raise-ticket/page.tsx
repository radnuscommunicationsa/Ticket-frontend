'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'

export default function RaiseTicket() {
  const router = useRouter()

  // ✅ FIX: Use state + useEffect instead of typeof window check
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const [form, setForm] = useState({ category:'', priority:'', subject:'', description:'', asset:'', contact_pref:'Email' })
  const [file, setFile] = useState<File|null>(null)
  const [msg,  setMsg]  = useState<{type:'success'|'error',text:string}|null>(null)
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k, v))
      if (file) fd.append('attachment', file)
      const { data } = await api.post('/api/tickets', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg({ type:'success', text:`Ticket ${data.ticket_no} raised successfully! IT team will respond within 4 business hours.` })
      setForm({ category:'', priority:'', subject:'', description:'', asset:'', contact_pref:'Email' })
      setFile(null)
    } catch (err:any) { setMsg({ type:'error', text: err.response?.data?.error || 'Failed to raise ticket' }) }
    finally { setLoading(false) }
  }

  const inp = { width:'100%', padding:'10px 12px', borderRadius:5, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.85rem' }
  const FG = ({label,children,full}:{label:string,children:React.ReactNode,full?:boolean}) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6, gridColumn: full?'1/-1':'auto' }}>
      <label style={{ fontSize:'0.73rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )

  return (
    <AppLayout role="employee">
      <PageHeader breadcrumb="RAISE TICKET" title="Raise IT Support Ticket" subtitle="Submit a new request — our team responds within 4 business hours" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Your Details */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}><span style={{ fontSize:'0.87rem', fontWeight:600 }}>Your Details</span></div>
        <div style={{ padding:'1.5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'1rem' }}>
            {/* ✅ FIX: user is now always null on server, then hydrates consistently */}
            {[['Name', user?.name||''],['Employee ID', user?.emp_id||''],['Department', user?.dept||''],['Email', user?.email||'']].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-main)' }}>{v}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Form */}
      <div className="card">
        <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}><span style={{ fontSize:'0.87rem', fontWeight:600 }}>Ticket Details</span></div>
        <div style={{ padding:'1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem' }}>
              <FG label="Issue Category *">
                <select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
                  <option value="">— Select Category —</option>
                  {['Hardware Issue','Software / Application','Network / Connectivity','Email / Communication','Access / Permissions','Password Reset','New Equipment Request','Security Incident','Other'].map(c=><option key={c}>{c}</option>)}
                </select>
              </FG>
              <FG label="Priority *">
                <select required value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={inp}>
                  <option value="">— Select Priority —</option>
                  <option value="critical">🔴 Critical — Cannot work at all</option>
                  <option value="high">🟠 High — Major disruption</option>
                  <option value="medium">🟡 Medium — Minor impact</option>
                  <option value="low">🟢 Low — Informational/request</option>
                </select>
              </FG>
              <FG label="Subject / Title *" full>
                <input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Brief description of the issue" style={inp}/>
              </FG>
              <FG label="Detailed Description *" full>
                <textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe in detail: what happened, when it started, any error messages..." style={{...inp,minHeight:130,resize:'vertical'}}/>
              </FG>
              <FG label="Asset / Device (optional)">
                <input value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})} placeholder="e.g. Dell Laptop-HR-042" style={inp}/>
              </FG>
              <FG label="Preferred Contact">
                <select value={form.contact_pref} onChange={e=>setForm({...form,contact_pref:e.target.value})} style={inp}>
                  <option>Email</option><option>Phone</option><option>In-Person</option>
                </select>
              </FG>
              <FG label="Attachment (optional) — Screenshot or file (max 5MB)" full>
                <div
                  onDragOver={e=>{e.preventDefault();setDrag(true)}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)setFile(f)}}
                  style={{ border:`2px dashed ${drag?'var(--red-primary)':'var(--border)'}`, borderRadius:8, padding:'1.5rem', textAlign:'center', cursor:'pointer', background: drag?'var(--red-glow)':'var(--bg-input)', position:'relative', transition:'all 0.2s' }}
                >
                  <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xlsx,.zip" style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}/>
                  <div style={{ fontSize:'2rem', marginBottom:6 }}>📎</div>
                  <div style={{ fontSize:'0.83rem', color:'var(--text-sub)' }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>JPG, PNG, PDF, DOC, XLSX, ZIP — Max 5MB</div>
                </div>
                {file && <div style={{ marginTop:10, padding:'8px 12px', background:'var(--bg-mid)', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.8rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:8 }}>
                  <span>📄</span><span>{file.name}</span><span style={{ color:'var(--text-muted)', marginLeft:'auto' }}>{(file.size/1024/1024).toFixed(2)} MB</span>
                  <button type="button" onClick={()=>setFile(null)} style={{ background:'none', border:'none', color:'#c62828', cursor:'pointer', fontSize:'1rem' }}>✕</button>
                </div>}
              </FG>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:'1.5rem' }}>
              <button type="button" onClick={()=>router.push('/employee/dashboard')} style={{ padding:'8px 18px', borderRadius:5, border:'1px solid rgba(198,40,40,0.3)', background:'transparent', color:'var(--red-primary)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding:'8px 18px', borderRadius:5, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>{loading?'Submitting...':'🎫 Submit Ticket'}</button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}