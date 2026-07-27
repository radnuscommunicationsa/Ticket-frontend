'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { User, Briefcase, KeyRound, ShieldCheck } from 'lucide-react'

const inp = { width:'100%', padding:'9px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.83rem' }

const FG = ({label,children}:{label:string,children:React.ReactNode}) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:'0.9rem' }}>
    <label style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>{label}</label>
    {children}
  </div>
)

function initials(n:string){ if(!n) return ''; const p=n.split(' '); return (p[0]?.[0]+(p[1]?.[0]||'')).toUpperCase() }

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}|null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [conPass, setConPass] = useState('')
  const [strength, setStrength] = useState(0)

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

  return (
    <AppLayout role="employee">
      <PageHeader breadcrumb="MY PROFILE" title="My Profile" subtitle="Update your personal info and password" />
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* Profile Banner */}
      <div className="card" style={{ marginBottom:'1.2rem', overflow:'hidden' }}>
        <div style={{ height:64, background:'linear-gradient(135deg, var(--red-primary), var(--red-bright))' }} />
        <div style={{ padding:'0 1.4rem 1.2rem', display:'flex', alignItems:'flex-end', gap:16, marginTop:-40 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--bg-card)', padding:4, boxShadow:'0 4px 14px rgba(0,0,0,0.15)' }}>
            <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'var(--red-glow)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red-primary)', fontWeight:700, fontSize:'1.6rem' }}>
              {profile?.name ? initials(profile.name) : <User size={32} />}
            </div>
          </div>
          <div style={{ paddingBottom:6 }}>
            <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-main)' }}>{profile?.name || '—'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>
              <Briefcase size={13}/> {profile?.emp_id} · {profile?.department}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem', alignItems:'stretch' }}>

        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'0.9rem 1.2rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)', display:'flex', alignItems:'center', gap:8 }}>
            <User size={15} color="var(--red-primary)"/>
            <span style={{ fontSize:'0.85rem', fontWeight:600 }}>Personal Information</span>
          </div>
          <div style={{ padding:'1.2rem', flex:1, display:'flex', flexDirection:'column' }}>
            <form onSubmit={saveProfile} style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <FG label="Full Name *"><input required value={name} onChange={e=>setName(e.target.value)} style={inp}/></FG>
              <FG label="Employee ID"><input value={profile?.emp_id || ''} disabled style={{...inp, opacity:0.6}}/></FG>
              <FG label="Department"><input value={profile?.department || ''} disabled style={{...inp, opacity:0.6}}/></FG>
              <FG label="Phone Number"><input value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/></FG>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'auto' }}>
                <button type="submit" style={{ padding:'7px 16px', borderRadius:6, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'0.9rem 1.2rem', borderBottom:'1px solid var(--border)', background:'var(--bg-mid)', display:'flex', alignItems:'center', gap:8 }}>
            <KeyRound size={15} color="var(--red-primary)"/>
            <span style={{ fontSize:'0.85rem', fontWeight:600 }}>Change Password</span>
          </div>
          <div style={{ padding:'1.2rem', flex:1, display:'flex', flexDirection:'column' }}>
            <form onSubmit={changePassword} style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <FG label="Current Password *"><input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} style={inp}/></FG>
              <FG label="New Password *">
                <input type="password" value={newPass} onChange={e=>{ setNewPass(e.target.value); calcStrength(e.target.value) }} style={inp}/>
              </FG>
              {newPass && (
                <div style={{ marginBottom:'0.7rem' }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i <= strength ? strColors[strength] : 'var(--border)' }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.7rem', color:strColors[strength] }}>
                    <ShieldCheck size={12}/> {strLabels[strength]}
                  </div>
                </div>
              )}
              <FG label="Confirm New Password *"><input type="password" value={conPass} onChange={e=>setConPass(e.target.value)} style={inp}/></FG>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'auto' }}>
                <button type="submit" style={{ padding:'7px 16px', borderRadius:6, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>Update Password</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}