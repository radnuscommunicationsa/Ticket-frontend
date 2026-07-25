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
  const [sideOpen, setSideOpen] = useState(true)

  // ✅ Edit Profile Modal state
  const [showEdit, setShowEdit] = useState(false)
  const [editData, setEditData] = useState({ name: '', phone: '', current_password: '', new_password: '' })
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editSaving, setEditSaving] = useState(false)

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
      setNotifCount(data.unread_count || 0) 
    } catch {}
  }

  const toggleDark = () => {
    const nd = !dark; setDark(nd)
    localStorage.setItem('td_theme', nd ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nd)
  }

  const logout = () => { clearAuth(); router.replace('/login') }

  // ✅ Open modal — prefill name & phone
  const openEdit = () => {
    setEditData({ name: user?.name || '', phone: user?.phone || '', current_password: '', new_password: '' })
    setEditMsg(null)
    setShowEdit(true)
  }

  // ✅ Save profile
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setEditSaving(true)
      setEditMsg(null)
      const endpoint = role === 'admin'
        ? `/employees/${user?.id || user?._id}`
        : `/employees/${user?.id || user?._id}`
      await api.patch(endpoint, {
        name: editData.name,
        phone: editData.phone,
        ...(editData.new_password ? { new_password: editData.new_password, current_password: editData.current_password } : {})
      })
      // Update local user
      const updated = { ...user, name: editData.name, phone: editData.phone }
      localStorage.setItem('td_user', JSON.stringify(updated))
      setUser(updated)
      setEditMsg({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setShowEdit(false), 1200)
    } catch (err: any) {
      setEditMsg({ type: 'error', text: err?.response?.data?.error || 'Update failed' })
    } finally {
      setEditSaving(false)
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 5,
    border: '1px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' as const
  }

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

          {/* ✅ Edit Profile Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>✏️ Edit Profile</strong>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.2rem 0 0.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red-primary), var(--red-bright))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {initials(editData.name || user?.name)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--red-primary)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{role}</div>
            </div>

            {/* Form */}
            <form onSubmit={saveProfile} style={{ padding: '1rem 1.2rem' }}>

              {editMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 5, marginBottom: '1rem', fontSize: '0.82rem', background: editMsg.type === 'success' ? 'rgba(46,125,50,0.1)' : 'rgba(198,40,40,0.1)', color: editMsg.type === 'success' ? '#2e7d32' : '#c62828', border: `1px solid ${editMsg.type === 'success' ? 'rgba(46,125,50,0.2)' : 'rgba(198,40,40,0.2)'}` }}>
                  {editMsg.text}
                </div>
              )}

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Full Name</label>
                <input required style={inp} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Your name" />
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Phone</label>
                <input style={inp} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone number" />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', marginBottom: '0.8rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>Change Password (optional)</div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Current Password</label>
                  <input type="password" style={inp} value={editData.current_password} onChange={e => setEditData({ ...editData, current_password: e.target.value })} placeholder="Enter current password" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>New Password</label>
                  <input type="password" style={inp} value={editData.new_password} onChange={e => setEditData({ ...editData, new_password: e.target.value })} placeholder="Enter new password" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEdit(false)}
                  style={{ padding: '8px 16px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={editSaving}
                  style={{ padding: '8px 20px', borderRadius: 5, border: 'none', background: 'var(--red-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  {editSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: 60, position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSideOpen(!sideOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: 4, display: 'flex', alignItems: 'center' }}>
            {sideOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            <div style={{ width: 30, height: 30, background: 'var(--red-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Monitor size={16}/>
            </div>
            Ticket<span style={{ color: 'var(--red-primary)' }}>Desk</span>
            {role === 'admin' && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>ADMIN</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={role === 'admin' ? '/admin/notifications' : '/employee/notifications'}
            style={{ position: 'relative', textDecoration: 'none', padding: '4px 6px', color: 'var(--text-main)', display: 'flex' }}>
            <Bell size={20}/>
            {notifCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#c62828', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '1px 4px', borderRadius: 10 }}>{notifCount}</span>}
          </Link>

          <button onClick={toggleDark}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {dark ? <Moon size={13}/> : <Sun size={13}/>}
          </button>

          {/* ✅ Avatar — click panna edit modal open aagum */}
          {user && (
            <button onClick={openEdit}
              title="Edit Profile"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red-primary), var(--red-bright))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid var(--border)' }}>
                {initials(user?.name)}
              </div>
            </button>
          )}

          <button onClick={logout}
            style={{ background: 'transparent', color: 'var(--red-primary)', border: '1px solid rgba(21,101,192,0.3)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <div className="sidebar" style={{ width: 230, padding: '1rem 0', flexShrink: 0, position: 'fixed', top: 60, left: 0, height: 'calc(100vh - 60px)', overflowY: 'auto', zIndex: 160, transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }}>
          {sideLinks.map(s => (
            <Link key={s.href} href={s.href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 1.2rem', fontSize: '0.84rem', color: path.startsWith(s.href) ? 'var(--red-primary)' : 'var(--text-sub)', borderLeft: path.startsWith(s.href) ? '3px solid var(--red-primary)' : '3px solid transparent', background: path.startsWith(s.href) ? 'var(--red-glow)' : 'transparent', textDecoration: 'none' }}>
              <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
              {s.label}
              {s.badge ? <span style={{ marginLeft: 'auto', background: 'var(--red-primary)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{s.badge}</span> : null}
            </Link>
          ))}
          <div style={{ padding: '1.2rem', marginTop: '1rem' }}>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'var(--red-primary)', cursor: 'pointer', fontSize: '0.84rem', width: '100%' }}>
              <LogOut size={16}/> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
    <main style={{ flex: 1, padding: '1.2rem', overflowY: 'auto', background: 'var(--bg)', width: '100%', marginLeft: sideOpen ? 230 : 0, transition: 'margin-left 0.25s ease' }}>
  {children}
</main>
      </div>
    </div>
  )
}