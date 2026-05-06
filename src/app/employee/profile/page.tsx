'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { User } from 'lucide-react'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}|null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [conPass, setConPass] = useState('')
  const [strength, setStrength] = useState(0)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await api.get('/auth/me')
        const userData = me?.data?.user || me?.data || {}
        setProfile(userData)
        setName(userData?.name || '')
        setPhone(userData?.phone || '')
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
      try {
        const st = await api.get('/tickets/my-stats')
        setStats(st?.data || null)
      } catch (err) {
        console.error('Stats fetch error:', err)
      }
    }
    loadData()
  }, [])

  const calcStrength = (p: string) => {
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    setStrength(s)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch('/auth/profile', { name, phone })
      setMsg({ type:'success', text:'Profile updated successfully!' })
    } catch (err:any) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Failed' })
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== conPass) return setMsg({ type:'error', text:'New passwords do not match.' })
    if (newPass.length < 6) return setMsg({ type:'error', text:'Password must be at least 6 characters.' })
    try {
      await api.patch('/auth/change-password', { current_password: curPass, new_password: newPass })
      setMsg({ type:'success', text:'Password changed!' })
      setCurPass(''); setNewPass(''); setConPass(''); setStrength(0)
    } catch (err:any) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Failed' })
    }
  }

  const strColors = ['','#e53935','#e53935','#fb8c00','#f9a825','#2e7d32']
  const strLabels = ['','Very Weak','Weak','Good','Strong','Very Strong']
  const inp = { width:'100%', padding:'10px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.85rem' }
  const FG = ({label,children}:{label:string,children:React.ReactNode}) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:'1rem' }}>
      <label style={{ fontSize:'0.73rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
  function initials(n:string){ if(!n) return ''; const p=n.split(' '); return (p[0]?.[0]+(p[1]?.[0]||'')).toUpperCase() }
  const colors=['#c62828','#6a1b9a','#00695c','#e65100','#2e7d32','#37474f']
  function avatarColor(n:string){ if(!n) return '#999'; let h=0; for(const c of n) h+=c.charCodeAt(0); return colors[h%colors.length] }

  return (
    <AppLayout role="employee">
      <PageHeader breadcrumb="MY PROFILE" title="My Profile" subtitle="Update your personal info and password" />
      {msg && <Alert type={msg.type} message={msg.text} />}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

        <div className="card">
          <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}>
            <span style={{ fontSize:'0.87rem', fontWeight:600 }}>Personal Information</span>
          </div>
          <div style={{ padding:'1.5rem' }}>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ width:100, height:100, borderRadius:'50%', background:avatarColor(profile?.name), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'2rem', boxShadow:'0 6px 18px rgba(0,0,0,0.15)', margin:'0 auto' }}>
                {profile?.name ? initials(profile.name) : <User size={44} />}
              </div>
              <div style={{ marginTop:10, fontSize:'0.75rem', color:'var(--text-muted)' }}>{profile?.emp_id} · {profile?.department}</div>
            </div>
            <form onSubmit={saveProfile}>
              <FG label="Full Name *"><input required value={name} onChange={e=>setName(e.target.value)} style={inp}/></FG>
              <FG label="Email Address"><input value={profile?.email||''} disabled style={{...inp,opacity:0.6}}/></FG>
              <FG label="Phone Number"><input value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/></FG>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" style={{ padding:'8px 18px', borderRadius:6, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div style={{ padding:'1rem 1.4rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)' }}>
            <span style={{ fontSize:'0.87rem', fontWeight:600 }}>Change Password</span>
          </div>
          <div style={{ padding:'1.5rem' }}>
            <form onSubmit={changePassword}>
              <FG label="Current Password *"><input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} style={inp}/></FG>
              <FG label="New Password *">
                <input type="password" value={newPass} onChange={e=>{ setNewPass(e.target.value); calcStrength(e.target.value) }} style={inp}/>
              </FG>
              {newPass && <div style={{ fontSize:'0.7rem', marginBottom:'0.5rem', color:strColors[strength] }}>{strLabels[strength]}</div>}
              <FG label="Confirm New Password *"><input type="password" value={conPass} onChange={e=>setConPass(e.target.value)} style={inp}/></FG>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" style={{ padding:'8px 18px', borderRadius:6, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Update Password</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}