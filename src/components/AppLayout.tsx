'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

import api from '..//lib/api'
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

  const adminNav = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/tickets', label: 'Tickets' },
    { href: '/admin/assets', label: 'Assets' },
    { href: '/admin/employees', label: 'Employees' },
    { href: '/admin/reports', label: 'Reports' },
  ]
  const empNav = [
    { href: '/employee/dashboard', label: 'My Tickets' },
    { href: '/employee/raise-ticket', label: 'Raise Ticket' },
    { href: '/employee/profile', label: 'Profile' },
  ]
  const nav = role === 'admin' ? adminNav : empNav

  const adminSide = [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/tickets', icon: '🎫', label: 'All Tickets' },
    { href: '/admin/assets', icon: '🖥️', label: 'Assets' },
    { href: '/admin/employees', icon: '👥', label: 'Employees' },
    { href: '/admin/reports', icon: '📈', label: 'Monthly Report' },
    { href: '/admin/notifications', icon: '🔔', label: 'Notifications', badge: notifCount },
  ]
  const empSide = [
    { href: '/employee/dashboard', icon: '📋', label: 'My Tickets' },
    { href: '/employee/raise-ticket', icon: '➕', label: 'Raise Ticket' },
    { href: '/employee/notifications', icon: '🔔', label: 'Notifications', badge: notifCount },
    { href: '/employee/profile', icon: '👤', label: 'My Profile' },
  ]
  const sideLinks = role === 'admin' ? adminSide : empSide

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Topbar */}
      <div className="topbar" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:60, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontWeight:700, fontSize:'1.1rem', color:'var(--text-main)' }}>
          <div style={{ width:32, height:32, background:'var(--red-primary)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#fff' }}>🖥</div>
          Ticket<span style={{ color:'var(--red-primary)' }}>Desk</span>
          {role === 'admin' && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:400 }}>ADMIN</span>}
        </div>
        <nav style={{ display:'flex', gap:4 }}>
          {nav.map(n => (
            <Link key={n.href} href={n.href} style={{ color: path.startsWith(n.href) ? 'var(--red-primary)' : 'var(--text-sub)', fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'6px 14px', borderRadius:4, borderBottom: path.startsWith(n.href) ? '2px solid var(--red-primary)' : '2px solid transparent', textDecoration:'none' }}>{n.label}</Link>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Notif Bell */}
          <Link href={role === 'admin' ? '/admin/notifications' : '/employee/notifications'} style={{ position:'relative', fontSize:'1.2rem', textDecoration:'none', padding:'4px 8px' }}>
            🔔{notifCount > 0 && <span style={{ position:'absolute', top:0, right:0, background:'#c62828', color:'#fff', fontSize:'0.55rem', fontWeight:700, padding:'1px 4px', borderRadius:10 }}>{notifCount}</span>}
          </Link>
          {/* Dark toggle */}
          <button onClick={toggleDark} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-muted)' }}>
            {dark ? '🌙 Dark' : '☀️ Light'}
          </button>
          {user && <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.83rem', color:'var(--text-sub)' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg, var(--red-primary), var(--red-bright))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'#fff' }}>{initials(user?.name)}</div>
            {user.name}
          </div>}
          <button onClick={logout} style={{ background:'transparent', color:'var(--red-primary)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:5, padding:'6px 14px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Logout</button>
        </div>
      </div>

      <div style={{ display:'flex', minHeight:'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <div className="sidebar" style={{ width:220, padding:'1.5rem 0', flexShrink:0 }}>
          {sideLinks.map(s => (
            <Link key={s.href} href={s.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 1.2rem', fontSize:'0.84rem', color: path.startsWith(s.href) ? 'var(--red-primary)' : 'var(--text-sub)', borderLeft: path.startsWith(s.href) ? '3px solid var(--red-primary)' : '3px solid transparent', background: path.startsWith(s.href) ? 'var(--red-glow)' : 'transparent', textDecoration:'none' }}>
              <span style={{ fontSize:14, width:18, textAlign:'center' }}>{s.icon}</span>
              {s.label}
              {s.badge ? <span style={{ marginLeft:'auto', background:'var(--red-primary)', color:'#fff', fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{s.badge}</span> : null}
            </Link>
          ))}
          <div style={{ marginTop:'auto', padding:'1.2rem' }}>
            <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', color:'var(--red-primary)', cursor:'pointer', fontSize:'0.84rem', width:'100%' }}>
              <span>🚪</span> Logout
            </button>
          </div>
        </div>

        {/* Main */}
        <main style={{ flex:1, padding:'2rem', overflowY:'auto', background:'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
