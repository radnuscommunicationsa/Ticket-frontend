'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun, Menu, X, LayoutDashboard, Ticket, Monitor, Users, BarChart3, Bell, UserCircle, Plus, LogOut, Tv, Star, Home } from 'lucide-react'
import api from '../lib/api'
import { getUser, isLoggedIn, clearAuth } from '../lib/auth'

function initials(name?: string) {
  if (!name) return "U";
  const p = name.trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

interface LayoutProps { 
  children: React.ReactNode; 
  role: 'admin' | 'employee' 
}

export default function AppLayout({ children, role }: LayoutProps) {
  const router = useRouter()
  const path = usePathname()
  const [user, setUser] = useState<any>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [takeHomeCount, setTakeHomeCount] = useState(0)
  const [dark, setDark] = useState(false)
  const [sideOpen, setSideOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Edit Profile Modal state
  const [showEdit, setShowEdit] = useState(false)
  const [editData, setEditData] = useState({ name: '', phone: '', current_password: '', new_password: '' })
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editMounted, setEditMounted] = useState(false)

  // Initial mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Responsive: track viewport width, auto-close sidebar on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setSideOpen(!mobile) // open by default on desktop, closed on mobile
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Browser-only code
    if (typeof window === 'undefined' || !mounted) return;
    
    if (!isLoggedIn()) { 
      router.replace('/login'); 
      return;
    }
    
    const u = getUser()
    if (!u || u.role !== role) { 
      router.replace(role === 'admin' ? '/employee/dashboard' : '/login'); 
      return;
    }
    
    setUser(u)
    
    // Safe theme loading
    const savedDark = localStorage.getItem('td_theme') === 'dark'
    setDark(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')
    
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [router, role, mounted])

  useEffect(() => {
    if (showEdit) {
      const raf = requestAnimationFrame(() => setEditMounted(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setEditMounted(false)
    }
  }, [showEdit])

  const fetchNotifs = async () => {
  try {
    const { data } = await api.get('/notifications')

    setNotifCount(data?.unread_count || 0)

    if (role === 'admin') {
      const { data: takeHomeData } = await api.get(
        '/assets/take-home-requests/pending-count'
      )

      setTakeHomeCount(takeHomeData?.count || 0)
    }
  } catch (error) {
    console.error('Notification count error:', error)
  }
}

  const toggleDark = () => {
    if (typeof window === 'undefined') return;
    const nd = !dark; 
    setDark(nd)
    localStorage.setItem('td_theme', nd ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nd)
  }

  const logout = () => { 
    clearAuth(); 
    router.replace('/login') 
  }

  const openEdit = () => {
    setEditData({ 
      name: user?.name || '', 
      phone: user?.phone || '', 
      current_password: '', 
      new_password: '' 
    })
    setEditMsg(null)
    setShowEdit(true)
  }

  // Close sidebar automatically after nav click on mobile
  const handleNavClick = () => {
    if (isMobile) setSideOpen(false)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setEditSaving(true)
      setEditMsg(null)
      const endpoint = `/employees/${user?.id || user?._id}`
      await api.patch(endpoint, {
        name: editData.name,
        phone: editData.phone,
        ...(editData.new_password ? { 
          new_password: editData.new_password, 
          current_password: editData.current_password 
        } : {})
      })
      const updated = { ...user, name: editData.name, phone: editData.phone }
      if (typeof window !== 'undefined') {
        localStorage.setItem('td_user', JSON.stringify(updated))
      }
      setUser(updated)
      setEditMsg({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setShowEdit(false), 1200)
    } catch (err: any) {
      setEditMsg({ 
        type: 'error', 
        text: err?.response?.data?.error || 'Update failed' 
      })
    } finally {
      setEditSaving(false)
    }
  }

  // Don't render until mounted (prevent SSR issues)
  if (!mounted) {
    return null;
  }

  const inp = {
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: 6,
    border: '1px solid var(--border)', 
    background: 'var(--bg-input)',
    color: 'var(--text-main)', 
    fontSize: '0.85rem', 
    boxSizing: 'border-box' as const
  }

  const adminSide = [
    { href: '/admin/dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
    { href: '/admin/tickets', icon: <Ticket size={18}/>, label: 'All Tickets' },
    { href: '/employee/raise-ticket', icon: <Plus size={18}/>, label: 'Raise Ticket' },
    { href: '/admin/assets', icon: <Monitor size={18}/>, label: 'Assets' },
    { href: '/admin/take-home-requests', icon: <Home size={18}/>, label: 'Take Home Requests', badge: takeHomeCount },
    { href: '/admin/employees', icon: <Users size={18}/>, label: 'Employees' },
    { href: '/admin/feedback', icon: <Star size={18}/>, label: 'Feedback' },
    { href: '/admin/reports', icon: <BarChart3 size={18}/>, label: 'Monthly Report' },
    { href: '/admin/notifications', icon: <Bell size={18}/>, label: 'Notifications', badge: notifCount },
]

  const empSide = [
  { href: '/employee/dashboard', icon: <LayoutDashboard size={18}/>, label: 'My Tickets' },
  { href: '/employee/raise-ticket', icon: <Plus size={18}/>, label: 'Raise Ticket' },
  { href: '/employee/my-assets', icon: <Tv size={18}/>, label: 'My Assets' },
  { href: '/employee/take-home-request', icon: <Home size={18}/>, label: 'Take Home' }, // ← ADD THIS
  { href: '/employee/notifications', icon: <Bell size={18}/>, label: 'Notifications', badge: notifCount },
  { href: '/employee/profile', icon: <UserCircle size={18}/>, label: 'My Profile' },
]
  const sideLinks = role === 'admin' ? adminSide : empSide

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div
          onClick={() => setShowEdit(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            opacity: editMounted ? 1 : 0, transition: 'opacity 0.2s ease', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)',
              width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              transform: editMounted ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)',
              opacity: editMounted ? 1 : 0,
              transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>Edit Profile</strong>
              <button onClick={() => setShowEdit(false)} style={{ background: 'var(--bg-mid)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, transition: 'background 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-mid)'}>
                <X size={18} />
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.6rem 0 0.8rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red-primary), var(--red-bright))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: 12, boxShadow: '0 8px 20px var(--red-glow)', border: '3px solid var(--bg-card)' }}>
                {initials(editData.name || user?.name)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--red-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, background: 'var(--red-glow)', padding: '2px 8px', borderRadius: 4 }}>{role}</div>
            </div>

            {/* Form */}
            <form onSubmit={saveProfile} style={{ padding: '0 1.4rem 1.4rem' }}>

              {editMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: '1rem', fontSize: '0.84rem', background: editMsg.type === 'success' ? 'rgba(46,125,50,0.1)' : 'rgba(220,38,38,0.1)', color: editMsg.type === 'success' ? '#2e7d32' : '#dc2626', border: `1px solid ${editMsg.type === 'success' ? 'rgba(46,125,50,0.25)' : 'rgba(220,38,38,0.25)'}` }}>
                  {editMsg.text}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input required style={inp} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Your name" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Phone</label>
                <input style={inp} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone number" />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Change Password (optional)</div>
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Password</label>
                  <input type="password" autoComplete="current-password" style={inp} value={editData.current_password} onChange={e => setEditData({ ...editData, current_password: e.target.value })} placeholder="Enter current password" />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>New Password</label>
                  <input type="password" autoComplete="new-password" style={inp} value={editData.new_password} onChange={e => setEditData({ ...editData, new_password: e.target.value })} placeholder="Enter new password" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn btn-primary" style={{ opacity: editSaving ? 0.6 : 1 }}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Mobile backdrop - closes sidebar when tapped outside */}
      {isMobile && sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,0.5)',
            zIndex: 150, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Topbar */}
      <div className="topbar" style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1rem',
  height: 64,
  position: 'fixed',      // ← sticky -> fixed
  top: 0,
  left: 0,
  right: 0,               // ← add
  width: '100%',          // ← add
  zIndex: 200,
  background: 'var(--bg-card)',  // ← add (illa na transparent-a irukum)
  borderBottom: '1px solid var(--border)'  // ← optional visual separation
}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={() => setSideOpen(!sideOpen)}
            style={{ background: 'var(--bg-mid)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-main)', padding: 8, display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-glow)'; e.currentTarget.style.borderColor = 'var(--red-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {sideOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--red-primary), var(--red-bright))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px var(--red-glow)', flexShrink: 0 }}>
              <Monitor size={16}/>
            </div>
            <span className="brand-text" style={{ whiteSpace: 'nowrap' }}>
              Ticket<span className="text-gradient">Desk</span>
            </span>
            {role === 'admin' && <span className="mono role-tag" style={{ fontSize: '0.65rem', color: 'var(--red-primary)', fontWeight: 600, border: '1px solid var(--red-primary)', borderRadius: 5, padding: '2px 6px', marginLeft: 4, background: 'var(--red-glow)', flexShrink: 0 }}>ADMIN</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link href={role === 'admin' ? '/admin/notifications' : '/employee/notifications'}
            style={{ position: 'relative', textDecoration: 'none', padding: '8px', color: 'var(--text-main)', display: 'flex', borderRadius: 8, transition: 'background 0.15s ease', background: 'var(--bg-mid)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-glow)'; e.currentTarget.style.borderColor = 'var(--red-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <Bell size={18}/>
            {notifCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#dc2626', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 5px', borderRadius: 12, boxShadow: '0 0 0 2px var(--bg-card)' }}>{notifCount}</span>}
          </Link>

          <button onClick={toggleDark} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            {dark ? <Moon size={16}/> : <Sun size={16}/>}
          </button>

          {user && (
            <button onClick={openEdit} title="Edit Profile" style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--red-primary), var(--red-bright))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                border: '2px solid var(--border)', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--red-glow)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {initials(user?.name)}
              </div>
            </button>
          )}

          <button onClick={logout} className="btn logout-btn" style={{ background: 'transparent', color: 'var(--red-primary)', border: '1px solid var(--border)', padding: '8px 14px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-glow)'; e.currentTarget.style.borderColor = 'var(--red-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px),', marginTop: 64 }}>
        {/* Sidebar */}
        <div className="sidebar" style={{
          width: 240, padding: '1.4rem 0.8rem', flexShrink: 0,
          position: 'fixed', top: 64, left: 0, height: 'calc(100vh - 64px)',
          overflowY: 'auto', zIndex: 160,
          transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isMobile && sideOpen ? '4px 0 24px rgba(0,0,0,0.25)' : 'none',
        }}>
          {sideLinks.map(s => {
            const active = path.startsWith(s.href)
            return (
              <Link key={s.href} href={s.href} onClick={handleNavClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 1rem', margin: '3px 0',
                  fontSize: '0.86rem', fontWeight: active ? 600 : 500,
                  color: active ? 'var(--red-primary)' : 'var(--text-sub)',
                  background: active ? 'var(--red-glow)' : 'transparent',
                  borderRadius: 10, textDecoration: 'none',
                  border: active ? '1px solid var(--red-primary)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.transform = 'translateX(4px)' } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' } }}
              >
                <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                {s.label}
                {s.badge ? <span style={{ marginLeft: 'auto', background: 'var(--red-primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 12 }}>{s.badge}</span> : null}
              </Link>
            )
          })}
          <div style={{ padding: '1.2rem 1rem 0', marginTop: '0.8rem', borderTop: '1px solid var(--border)' }}>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'var(--red-primary)', cursor: 'pointer', fontSize: '0.86rem', width: '100%', padding: '10px 0', transition: 'transform 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
              <LogOut size={18}/> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main style={{
          flex: 1, padding: isMobile ? '1rem' : '1.6rem', overflowY: 'auto',
          background: 'var(--bg)', width: '100%',
          marginLeft: !isMobile && sideOpen ? 240 : 0,
          transition: 'margin-left 0.3s cubic-bezier(0.16,1,0.3,1)',
          minWidth: 0,
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}