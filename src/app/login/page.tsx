'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { setAuth, isLoggedIn, getUser } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (isLoggedIn()) {
      const user = getUser()
      router.replace(user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
    }
  }, [router])

  useEffect(() => {
    if (locked && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    if (countdown === 0 && locked) setLocked(false)
  }, [locked, countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', {
  login,
  password
});
      setAuth(data.token, data.user)
      router.replace(data.user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed'
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 3) { setLocked(true); setCountdown(900); setError('Too many attempts! Locked for 15 minutes.') }
      else setError(`${msg}. ${3 - newAttempts} attempt(s) remaining.`)
    } finally { setLoading(false) }
  }

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(198,40,40,0.08) 0%, transparent 60%)' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(198,40,40,0.12)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, background:'var(--red-primary)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px', boxShadow:'0 4px 16px var(--red-glow)' }}>🖥</div>
          <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text-main)' }}>Ticket<span style={{ color:'var(--red-primary)' }}>Desk</span></h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.83rem', marginTop:4 }}>IT Support Portal — Sign In</p>
        </div>

        {locked ? (
          <div style={{ background:'rgba(198,40,40,0.08)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:8, padding:'1.2rem', textAlign:'center', marginBottom:'1rem' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>🔒</div>
            <h3 style={{ color:'#c62828', fontSize:'1rem', marginBottom:4 }}>Account Temporarily Locked</h3>
            <div style={{ fontSize:'1.4rem', fontWeight:700, color:'#c62828', fontFamily:'IBM Plex Mono', margin:'8px 0' }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>remaining before unlock</p>
          </div>
        ) : (
          <>
            {error && <div style={{ background:'rgba(198,40,40,0.08)', border:'1px solid rgba(198,40,40,0.25)', borderRadius:6, padding:'10px 14px', fontSize:'0.85rem', color:'#c62828', marginBottom:'1rem' }}>⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ fontSize:'0.73rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Employee ID or Email</label>
                <input type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="EMP-001 or you@company.com" required style={{ width:'100%', padding:'10px 12px', borderRadius:5, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.85rem' }} autoFocus />
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ fontSize:'0.73rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required style={{ width:'100%', padding:'10px 12px', borderRadius:5, border:'1px solid var(--border)', background:'var(--bg-input)', color:'var(--text-main)', fontSize:'0.85rem' }} />
              </div>

              {attempts > 0 && attempts < 3 && (
                <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
                  {[1,2,3].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i <= attempts ? '#c62828' : '#2e7d32' }} />)}
                </div>
              )}

              <button type="submit" disabled={loading || locked} style={{ width:'100%', padding:'10px', background:'var(--red-primary)', color:'#fff', border:'none', borderRadius:5, fontSize:'0.85rem', fontWeight:600, cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in...' : '🔐 Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
