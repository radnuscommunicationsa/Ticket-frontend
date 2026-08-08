'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { getUser } from '@/lib/auth'
import { Paperclip, FileText, X, Ticket } from 'lucide-react'

const inp = { width:'100%', padding:'9px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.83rem' }

const FG = ({label,children,full}:{label:string,children:React.ReactNode,full?:boolean}) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5, gridColumn: full?'1/-1':'auto' }}>
    <label style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>{label}</label>
    {children}
  </div>
)

export default function RaiseTicket() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState({ category:'', priority:'', subject:'', description:'', asset:'', contact_pref:'Email' })
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}|null>(null)
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File|null>(null)
  const [myAssets, setMyAssets] = useState<any[]>([])

  useEffect(() => {
  setUser(getUser())
  setReady(true)
  
  // ✅ ITHU ADD PANNANUM
  api.get('/assets/my-assets')
    .then(res => setMyAssets(res.data?.assets || []))
    .catch(() => setMyAssets([]))
}, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    if (file && file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'File size must be less than 5MB' })
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
      setMsg({ type:'success', text:`Ticket ${data.ticket_no} raised successfully! IT team will respond within 4 business hours.` })
setForm({ category:'', priority:'', subject:'', description:'', asset:'', contact_pref:'Email' })
setFile(null)
setTimeout(() => router.push('/employee/dashboard'), 1500)
    } catch (err:any) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Failed to raise ticket' })
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <AppLayout role={user?.role === 'admin' ? 'admin' : 'employee'}>
      <PageHeader breadcrumb="RAISE TICKET" title="Raise IT Support Ticket" subtitle="Submit a new request — our team responds within 4 business hours" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Your Details */}
      <div className="card" style={{ marginBottom:'0.9rem', padding:'0.9rem 1.2rem', display:'flex', alignItems:'center', gap:'1.8rem', flexWrap:'wrap' }}>
        {[['Name', user?.name||'—'],['Employee ID', user?.emp_id||'—'],['Department', user?.department || user?.dept || '—']].map(([l,v], i)=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:10 }}>
            {i > 0 && <div style={{ width:1, height:26, background:'var(--border)' }} />}
            <div>
              <div style={{ fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>{l}</div>
              <div style={{ fontSize:'0.83rem', color:'var(--text-main)', fontWeight:600 }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Form */}
      <div className="card">
        <div style={{ padding:'0.9rem 1.2rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)', display:'flex', alignItems:'center', gap:8 }}>
          <Ticket size={16} color="var(--red-primary)" strokeWidth={2}/>
          <span style={{ fontSize:'0.85rem', fontWeight:600 }}>Ticket Details</span>
        </div>
        <div style={{ padding:'1.2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <FG label="Issue Category *">
                <select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
                  <option value="">— Select Category —</option>
                  {['Hardware Issue','Software / Application','Network / Connectivity','Email / Communication','Access / Permissions','Password Reset','New Equipment Request','Security Incident','Other'].map(c=><option key={c}>{c}</option>)}
                </select>
              </FG>
              <FG label="Priority *">
                <select required value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={inp}>
                  <option value="">— Select Priority —</option>
                  <option value="critical">Critical — Cannot work at all</option>
                  <option value="high">High — Major disruption</option>
                  <option value="medium">Medium — Minor impact</option>
                  <option value="low">Low — Informational/request</option>
                </select>
              </FG>
              <FG label="Subject / Title *" full>
                <input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Brief description of the issue" style={inp}/>
              </FG>
              <FG label="Detailed Description *" full>
                <textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe in detail: what happened, when it started, any error messages..." style={{...inp,minHeight:100,resize:'vertical'}}/></FG>
              <FG label="Asset / Device (optional)" full>
  <select value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})} style={inp}>
    <option value="">— No Asset / General Issue —</option>
    {myAssets.map((a:any) => (
      <option key={a._id || a.id} value={a.asset_code}>
        {a.asset_code} — {a.name}
      </option>
    ))}
  </select>
</FG>
              <FG label="Preferred Contact">
                <select value={form.contact_pref} onChange={e=>setForm({...form,contact_pref:e.target.value})} style={inp}>
                  <option>Email</option><option>Phone</option><option>In-Person</option>
                </select>
              </FG>
              <FG label="Attachment (optional) — max 5MB" full>
                <div
                  onDragOver={e=>{e.preventDefault();setDrag(true)}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)setFile(f)}}
                  style={{ border:`1.5px dashed ${drag?'var(--red-primary)':'var(--border)'}`, borderRadius:8, padding:'1rem', textAlign:'center', cursor:'pointer', background: drag?'var(--red-glow)':'var(--bg-input)', position:'relative', transition:'all 0.2s' }}
                >
                  <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xlsx,.zip" style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}/>
                  <Paperclip size={22} color="var(--text-muted)" strokeWidth={1.6} style={{ marginBottom:4 }}/>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-sub)' }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2 }}>JPG, PNG, PDF, DOC, XLSX, ZIP</div>
                </div>
                {file && <div style={{ marginTop:8, padding:'7px 10px', background:'var(--bg-mid)', borderRadius:6, border:'1px solid var(--border)', fontSize:'0.78rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:8 }}>
                  <FileText size={15} color="var(--red-primary)"/><span>{file.name}</span><span style={{ color:'var(--text-muted)', marginLeft:'auto' }}>{(file.size/1024/1024).toFixed(2)} MB</span>
                  <button type="button" onClick={()=>setFile(null)} style={{ background:'none', border:'none', color:'#c62828', cursor:'pointer', display:'flex' }}><X size={15}/></button>
                </div>}
              </FG>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:'1.2rem' }}>
              <button type="button" onClick={()=>router.push(user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')} style={{ padding:'7px 16px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:6, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, opacity: loading ? 0.7 : 1 }}>
                <Ticket size={14}/> {loading?'Submitting...':'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}