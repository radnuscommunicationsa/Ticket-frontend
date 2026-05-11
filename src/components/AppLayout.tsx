'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun, Menu, X, LayoutDashboard, Ticket, Monitor, Users, BarChart3, Bell, UserCircle, Plus, LogOut, Tv } from 'lucide-react'
import api from '../lib/api'
import { getUser, isLoggedIn, clearAuth } from '../lib/auth'

function initials(name?: string) {
  if (!name) return "U";
  const p = name.trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

interface LayoutProps { children: React.ReactNode; role: 'admin' | 'employee' }

export default function AppLayout({ children, role }: LayoutProps) {
  const router = useRouter()
  const path = usePathname()
  const [user, setUser] = useState<any>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [dark, setDark] = useState(false)
  const [sideOpen, setSideOpen] = useState(false) // ✅ Mobile sidebar state

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const u = getUser()
    if (!u || u.role !== role) { router.replace(role === 'admin' ? '/employee/dashboard' : '/login'); return }
    setUser(u)
    const savedDark = localStorage.getItem('td_theme') === 'dark'
    setDark(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')
    fetchNotifs()
  }, [router, role])

  // ✅ Close sidebar on route change
  useEffect(() => { setSideOpen(false) }, [path])

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifCount(data.unread || 0)
    } catch {}
  }

  const toggleDark = () => {
    const nd = !dark; setDark(nd)
    localStorage.setItem('td_theme', nd ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nd)
  }

  const logout = () => { clearAuth(); router.replace('/login') }

  const adminSide = [
    { href: '/admin/dashboard', icon: <LayoutDashboard size={16}/>, label: 'Dashboard' },
    { href: '/admin/tickets', icon: <Ticket size={16}/>, label: 'All Tickets' },
    { href: '/admin/assets', icon: <Monitor size={16}/>, label: 'Assets' },
    { href: '/admin/employees', icon: <Users size={16}/>, label: 'Employees' },
    { href: '/admin/reports', icon: <BarChart3 size={16}/>, label: 'Monthly Report' },
    { href: '/admin/notifications', icon: <Bell size={16}/>, label: 'Notifications', badge: notifCount },
  ]
  const empSide = [
    { href: '/employee/dashboard', icon: <LayoutDashboard size={16}/>, label: 'My Tickets' },
    { href: '/employee/raise-ticket', icon: <Plus size={16}/>, label: 'Raise Ticket' },
    { href: '/employee/my-assets', icon: <Tv size={16}/>, label: 'My Assets' },
    { href: '/employee/notifications', icon: <Bell size={16}/>, label: 'Notifications', badge: notifCount },
    { href: '/employee/profile', icon: <UserCircle size={16}/>, label: 'My Profile' },
  ]
  const sideLinks = role === 'admin' ? adminSide : empSide

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* ✅ Mobile Overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:150 }}
        />
      )}

      {/* Topbar */}
      <div className="topbar" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', height:60, position:'sticky', top:0, zIndex:200 }}>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* ✅ Hamburger button */}
          <button
            onClick={() => setSideOpen(!sideOpen)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-main)', padding:4, display:'flex', alignItems:'center' }}
          >
            {sideOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:'1.1rem', color:'var(--text-main)' }}>
            <div style={{ width:30, height:30, background:'var(--red-primary)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <Monitor size={16}/>
            </div>
            Ticket<span style={{ color:'var(--red-primary)' }}>Desk</span>
            {role === 'admin' && <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:400 }}>ADMIN</span>}
          </div>
        </div>

        {/* ✅ Right side - compact on mobile */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Link href={role === 'admin' ? '/admin/notifications' : '/employee/notifications'} style={{ position:'relative', textDecoration:'none', padding:'4px 6px', color:'var(--text-main)', display:'flex' }}>
            <Bell size={20}/>
            {notifCount > 0 && <span style={{ position:'absolute', top:0, right:0, background:'#c62828', color:'#fff', fontSize:'0.55rem', fontWeight:700, padding:'1px 4px', borderRadius:10 }}>{notifCount}</span>}
          </Link>

          <button onClick={toggleDark} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:20, padding:'5px 10px', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
            {dark ? <><Moon size={13}/><span style={{ display:'none' }} className="md-show">Dark</span></> : <><Sun size={13}/><span style={{ display:'none' }} className="md-show">Light</span></>}
          </button>

          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', color:'var(--text-sub)' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg, var(--red-primary), var(--red-bright))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                {initials(user?.name)}
              </div>
              <span style={{ display:'none' }} className="md-show">{user.name}</span>
            </div>
          )}

          <button onClick={logout} style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:5, padding:'5px 10px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display:'flex', minHeight:'calc(100vh - 60px)' }}>

        {/* ✅ Sidebar - slide in on mobile */}
        <div
          className="sidebar"
          style={{
            width: 230,
            padding: '1rem 0',
            flexShrink: 0,
            position: 'fixed',
            top: 60,
            left: 0,
            height: 'calc(100vh - 60px)',
            overflowY: 'auto',
            zIndex: 160,
            transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          }}
        >
          {sideLinks.map(s => (
            <Link
              key={s.href}
              href={s.href}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 1.2rem', fontSize:'0.84rem', color: path.startsWith(s.href) ? 'var(--red-primary)' : 'var(--text-sub)', borderLeft: path.startsWith(s.href) ? '3px solid var(--red-primary)' : '3px solid transparent', background: path.startsWith(s.href) ? 'var(--red-glow)' : 'transparent', textDecoration:'none' }}
            >
              <span style={{ width:18, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</span>
              {s.label}
              {s.badge ? <span style={{ marginLeft:'auto', background:'var(--red-primary)', color:'#fff', fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{s.badge}</span> : null}
            </Link>
          ))}
          <div style={{ padding:'1.2rem', marginTop:'1rem' }}>
            <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', color:'var(--red-primary)', cursor:'pointer', fontSize:'0.84rem', width:'100%' }}>
              <LogOut size={16}/> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ flex:1, padding:'1.2rem', overflowY:'auto', background:'var(--bg)', width:'100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}