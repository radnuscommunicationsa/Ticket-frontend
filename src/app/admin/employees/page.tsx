'use client'

import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, DeptBadge } from '@/components/ui'
import api from '@/lib/api'
import { 
  Search, UserPlus, Save, Pencil, Trash2, ShieldCheck, RefreshCw, 
  Package, Laptop, Mail, Phone, Building2, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, User, Hash, Shield, 
  FileText, RotateCcw, Activity, StickyNote, KeyRound, Ban, 
  Send, ChevronRight, Briefcase, HeartPulse, TrendingUp, Archive,
  Users, UserCheck, UserX
} from 'lucide-react'

const DEPTS = ['Loan','Customer Support','General Manager','Accounts','Faculty','Web Development','Digital Marketing','Sales','Design','Admission','HR','Telecalling','Stock','Distribution','Technical Service Engineer','Android Development','System Administrator','Software Support']

function avatarColor(n:string){
  const c=['#1565c0','#6a1b9a','#00695c','#c62828','#e65100','#2e7d32','#37474f','#4527a0']
  let h=0
  for(const ch of n) h+=ch.charCodeAt(0)
  return c[h%c.length]
}

function initials(n?:string){
  if(!n) return 'NA'
  const p=n.split(' ')
  return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

function fmtDateTime(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

function timeAgo(d?: string) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

function extractId(val: any): string {
  if (!val) return ''
  if (typeof val === 'object') return val._id || val.id || ''
  return String(val)
}

function belongsToEmployee(item: any, empId: string, empCode: string): boolean {
  const itemEmpId = extractId(item.employee_id)
  const itemEmpCode = typeof item.employee_id === 'object' ? item.employee_id?.emp_id || item.employee_id?.empId : ''
  const itemAssignedTo = extractId(item.assigned_to || item.user_id || item.emp_id)
  return (
    itemEmpId === empId || itemEmpId === empCode ||
    itemEmpCode === empCode || itemEmpCode === empId ||
    itemAssignedTo === empId || itemAssignedTo === empCode
  )
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [allTickets, setAllTickets] = useState<any[]>([])
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editEmp, setEditEmp] = useState<any>(null)
  const [editAdmin, setEditAdmin] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [detailEmp, setDetailEmp] = useState<any>(null)
  const [empAssets, setEmpAssets] = useState<any[]>([])
  const [empAssetsHistory, setEmpAssetsHistory] = useState<any[]>([])
  const [empTickets, setEmpTickets] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [assetError, setAssetError] = useState<string | null>(null)
  
  // ✅ NEW: Admin notes
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  
  // ✅ NEW: Active tab in detail modal
  const [detailTab, setDetailTab] = useState<'overview'|'assets'|'tickets'|'timeline'>('overview')

  // ✅ NEW: Status filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = async () => {
    try {
      const [empRes, ticketRes] = await Promise.all([
        api.get('/employees'),
        api.get('/tickets')
      ])
      setEmployees(empRes.data?.employees ?? [])
      setAdmins(empRes.data?.admins ?? [])
      const tData = Array.isArray(ticketRes.data) ? ticketRes.data : (ticketRes.data?.tickets ?? [])
      setAllTickets(tData)
    } catch(err:any) {
      setMsg({type:'error', text: err.response?.data?.error || 'Failed to load'})
    }
  }

  useEffect(() => { load() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const fetchEmployeeDetail = async (emp: any) => {
    setLoadingDetail(true)
    setAssetError(null)
    setDetailTab('overview')
    const empId = extractId(emp._id || emp.id)
    const empCode = emp.emp_id || ''

    try {
      const empTicketList = allTickets.filter((t: any) => {
        const tEmpId = extractId(t.employee_id || t.emp_id || t.created_by || t.user_id)
        return tEmpId === empId || t.emp_id === empCode
      })
      setEmpTickets(empTicketList)

      let rawAssets: any[] = []
      let source = ''

      try {
        const res = await api.get(`/assets/assigned?employee_id=${empId}`)
        const data = res.data?.assets ?? res.data ?? []
        if (Array.isArray(data) && data.length > 0) { rawAssets = data; source = '/assets/assigned' }
      } catch { /* ignore */ }

      if (rawAssets.length === 0) {
        try {
          const res = await api.get(`/assets?employee_id=${empId}`)
          const data = res.data?.assets ?? res.data ?? []
          if (Array.isArray(data) && data.length > 0) { rawAssets = data; source = '/assets' }
        } catch { /* ignore */ }
      }

      if (rawAssets.length === 0) {
        try {
          const res = await api.get('/assets/take-home-requests')
          const allRequests = Array.isArray(res.data) ? res.data : (res.data?.requests ?? [])
          rawAssets = allRequests
          source = '/assets/take-home-requests'
        } catch { /* ignore */ }
      }

      if (rawAssets.length === 0) {
        try {
          const res = await api.get(`/employees/${empId}/assets`)
          const data = res.data?.assets ?? res.data ?? []
          if (Array.isArray(data) && data.length > 0) { rawAssets = data; source = '/employees/:id/assets' }
        } catch { /* ignore */ }
      }

      const mappedAssets = rawAssets.map((r: any) => ({
        _id: r._id,
        asset_code: typeof r.asset_id === 'object' ? r.asset_id?.asset_code : (r.asset_code || r.code || r.asset_id),
        name: typeof r.asset_id === 'object' ? r.asset_id?.name : (r.name || 'Asset'),
        model: typeof r.asset_id === 'object' ? r.asset_id?.model : (r.model || '—'),
        asset_type: r.asset_type || r.type || '—',
        status: r.status || 'assigned',
        assigned_date: r.from_date || r.assigned_date || r.created_at,
        to_date: r.to_date,
        notes: r.notes,
        is_permanent: r.is_permanent,
        reason: r.reason,
        emergency_contact: r.emergency_contact,
        emergency_phone: r.emergency_phone,
        returned_date: r.returned_date || (r.status === 'returned' ? r.updated_at : null)
      }))

      // Split current vs history
      const current = mappedAssets.filter((a: any) => 
        belongsToEmployee(rawAssets.find((raw: any) => raw._id === a._id) || {}, empId, empCode) &&
        a.status !== 'returned' && a.status !== 'rejected'
      )
      const history = mappedAssets.filter((a: any) => 
        a.status === 'returned' || a.status === 'rejected'
      )

      console.log(`[Assets] Source: ${source}, Raw: ${rawAssets.length}, Current: ${current.length}, History: ${history.length}`)

      if (current.length === 0 && history.length === 0 && rawAssets.length > 0) {
        setAssetError(`Found ${rawAssets.length} records but none match this employee's ID.`)
        setEmpAssets(mappedAssets) // Show all for debugging
      } else {
        setAssetError(null)
        setEmpAssets(current)
        setEmpAssetsHistory(history)
      }
      
      // Load admin notes if available
      setAdminNotes(emp.admin_notes || emp.notes || '')
    } catch (err: any) {
      setAssetError(err.response?.data?.error || 'Failed to load assets')
      setEmpAssets([])
      setEmpAssetsHistory([])
    } finally {
      setLoadingDetail(false)
    }
  }

  const openEmployeeDetail = (emp: any) => {
    setDetailEmp(emp)
    fetchEmployeeDetail(emp)
  }

  // ✅ NEW: Save admin notes
  const handleSaveNotes = async () => {
    if (!detailEmp) return
    setSavingNotes(true)
    try {
      await api.patch(`/employees/${detailEmp._id || detailEmp.id}`, { admin_notes: adminNotes })
      setMsg({ type: 'success', text: 'Notes saved.' })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save notes' })
    } finally {
      setSavingNotes(false)
    }
  }

  // ✅ NEW: Quick actions
  const handleResetPassword = async () => {
    if (!detailEmp) return
    const newPass = prompt(`Enter new password for ${detailEmp.name}:`, '')
    if (!newPass) return
    try {
      await api.patch(`/employees/${detailEmp._id || detailEmp.id}`, { new_password: newPass })
      setMsg({ type: 'success', text: `Password reset for ${detailEmp.name}` })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' })
    }
  }

  const handleToggleStatus = async () => {
    if (!detailEmp) return
    const newStatus = detailEmp.status === 'active' ? 'inactive' : 'active'
    if (!confirm(`Mark ${detailEmp.name} as ${newStatus}?`)) return
    try {
      await api.patch(`/employees/${detailEmp._id || detailEmp.id}`, { status: newStatus })
      setMsg({ type: 'success', text: `${detailEmp.name} is now ${newStatus}` })
      setDetailEmp({ ...detailEmp, status: newStatus })
      load()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' })
    }
  }

  // ✅ NEW: Build activity timeline
  const timeline = useMemo(() => {
    const items: any[] = []
    
    empTickets.forEach((t: any) => {
      items.push({
        type: 'ticket',
        date: t.created_at,
        title: `Ticket created: ${t.title || t.subject || 'Untitled'}`,
        desc: `#${t.ticket_id || t._id?.slice(-6)} · ${t.category || 'General'}`,
        status: t.status,
        icon: FileText,
        color: '#1565c0'
      })
      if (t.resolved_at) {
        items.push({
          type: 'ticket_resolved',
          date: t.resolved_at,
          title: 'Ticket resolved',
          desc: t.title || '',
          icon: CheckCircle2,
          color: '#2e7d32'
        })
      }
    })
    
    empAssets.forEach((a: any) => {
      items.push({
        type: 'asset_assigned',
        date: a.assigned_date,
        title: `Asset assigned: ${a.asset_code || a.name}`,
        desc: `${a.asset_type || 'Asset'} · ${a.reason || 'No reason'}`,
        icon: Package,
        color: '#e65100'
      })
    })
    
    empAssetsHistory.forEach((a: any) => {
      items.push({
        type: 'asset_returned',
        date: a.returned_date || a.to_date,
        title: `Asset returned: ${a.asset_code || a.name}`,
        desc: a.notes || 'Returned to IT',
        icon: Archive,
        color: '#616161'
      })
    })
    
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)
  }, [empTickets, empAssets, empAssetsHistory])

  const employeesWithCounts = useMemo(() => {
    return employees.map((e: any) => {
      const empId = extractId(e._id || e.id)
      const empCode = e.emp_id || ''
      const empTickets = allTickets.filter((t: any) => {
        const tEmpId = extractId(t.employee_id || t.emp_id || t.created_by || t.user_id)
        return tEmpId === empId || t.emp_id === empCode
      })
      const openTickets = empTickets.filter((t: any) => 
        t.status === 'open' || t.status === 'in-progress'
      )
      return { ...e, ticket_count: e.ticket_count ?? empTickets.length, open_tickets: e.open_tickets ?? openTickets.length }
    })
  }, [employees, allTickets])

  // ✅ UPDATED: Filter by search AND status
  const filteredEmployees = employeesWithCounts.filter((e: any) => {
    const matchesSearch = 
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // ✅ NEW: Count stats for filter pills
  const activeCount = employeesWithCounts.filter((e: any) => e.status === 'active').length
  const inactiveCount = employeesWithCounts.filter((e: any) => e.status === 'inactive').length
  const totalCount = employeesWithCounts.length

  const handleDelete = async (id: string) => {
    if(!confirm('Delete this employee and all their tickets?')) return
    try {
      await api.delete(`/employees/${id}`)
      setMsg({type:'success', text:'Employee deleted.'})
      load()
    } catch(e: any) {
      setMsg({type:'error', text: e.response?.data?.error || 'Delete failed'})
    }
  }

  const inp = {
    width:'100%', padding:'10px 12px', borderRadius:5,
    border:'1px solid var(--border)', background:'var(--bg-input)',
    color:'var(--text-main)', fontSize:'0.85rem'
  }

  const FG = ({label, children}: {label:string, children:React.ReactNode}) => (
    <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:'0.9rem'}}>
      <label style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>{label}</label>
      {children}
    </div>
  )

  const AddForm = () => {
    const [d,setD] = useState({name:'',emp_id:'',password:'',department:'',phone:'',role:'employee'})
    const submit = async (e:React.FormEvent) => {
      e.preventDefault()
      try {
        await api.post('/employees', d)
        setMsg({type:'success', text:`Employee ${d.name} added!`})
        setShowAdd(false)
        load()
      } catch(err:any) {
        setMsg({type:'error', text: err.response?.data?.error || 'Failed'})
      }
    }
    return (
      <form onSubmit={submit}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Full Name *"><input required style={inp} value={d.name} onChange={e=>setD({...d,name:e.target.value})} placeholder="John Smith"/></FG>
          <FG label="Employee ID *"><input required style={inp} value={d.emp_id} onChange={e=>setD({...d,emp_id:e.target.value})} placeholder="EMP-0120"/></FG>
        </div>
        <FG label="Password *"><input required type="password" style={inp} value={d.password} onChange={e=>setD({...d,password:e.target.value})} placeholder="Set initial password"/></FG>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Department">
            <select style={inp} value={d.department} onChange={e=>setD({...d,department:e.target.value})}>
              <option value="">— Select —</option>
              {DEPTS.map(dept => <option key={dept}>{dept}</option>)}
            </select>
          </FG>
          <FG label="Role">
            <select style={inp} value={d.role} onChange={e=>setD({...d,role:e.target.value})}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="system_admin">System Admin</option>
            </select>
          </FG>
        </div>
        <FG label="Phone"><input type="tel" style={inp} value={d.phone} onChange={e=>setD({...d,phone:e.target.value})} placeholder="Optional"/></FG>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:'0.5rem'}}>
          <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
          <button type="submit" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:6,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
            <UserPlus size={14}/> Add Employee
          </button>
        </div>
      </form>
    )
  }

  const EditForm = ({emp, isAdmin}: {emp:any, isAdmin:boolean}) => {
    const [d,setD] = useState({
      name: emp.name,
      emp_id: emp.emp_id,
      department: emp.department || '',
      phone: emp.phone || '',
      role: emp.role,
      status: emp.status,
      new_password: ''
    })
    const submit = async (e:React.FormEvent) => {
      e.preventDefault()
      try {
        await api.patch(`/employees/${emp._id||emp.id}`, d)
        setMsg({type:'success', text:`${d.name} updated!`})
        setEditEmp(null)
        setEditAdmin(null)
        load()
      } catch(err:any) {
        setMsg({type:'error', text: err.response?.data?.error || 'Failed'})
      }
    }
    return (
      <form onSubmit={submit}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Full Name *"><input required style={inp} value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></FG>
          <FG label={isAdmin?'Admin ID *':'Employee ID *'}><input required style={inp} value={d.emp_id} onChange={e=>setD({...d,emp_id:e.target.value})}/></FG>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Department">
            <select style={inp} value={d.department} onChange={e=>setD({...d,department:e.target.value})}>
              <option value="">— Select —</option>
              {DEPTS.map(dept => <option key={dept}>{dept}</option>)}
            </select>
          </FG>
          <FG label="Status">
            <select style={inp} value={d.status} onChange={e=>setD({...d,status:e.target.value})}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FG>
        </div>
        <FG label="Phone"><input type="tel" style={inp} value={d.phone} onChange={e=>setD({...d,phone:e.target.value})}/></FG>
        <FG label="New Password (blank = no change)"><input type="password" style={inp} value={d.new_password} onChange={e=>setD({...d,new_password:e.target.value})} placeholder="Enter to change..."/></FG>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:'0.5rem'}}>
          <button type="button" onClick={()=>{setEditEmp(null);setEditAdmin(null)}} style={{padding:'8px 18px',borderRadius:5,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
          <button type="submit" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:6,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
            <Save size={14}/> Save Changes
          </button>
        </div>
      </form>
    )
  }

  const TH = ({c}:{c:string}) => (
    <th style={{fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',padding:'10px 1.4rem',textAlign:'left',borderBottom:'1px solid var(--border)',background:'rgba(198,40,40,0.04)',whiteSpace:'nowrap'}}>{c}</th>
  )

  const AssetStatusBadge = ({status}: {status:string}) => {
    const colors: Record<string,string> = {
      pending: '#ef6c00', approved_by_manager: '#1565c0', approved: '#2e7d32',
      rejected: '#c62828', returned: '#616161', active: '#2e7d32', assigned: '#1565c0'
    }
    const color = colors[status] || '#616161'
    return (
      <span style={{fontSize:'0.62rem',fontWeight:700,padding:'3px 10px',borderRadius:10,color,background:`${color}18`,whiteSpace:'nowrap',textTransform:'capitalize'}}>
        {status.replace(/_/g,' ')}
      </span>
    )
  }

  const TicketStatusBadge = ({status}: {status:string}) => {
    const colors: Record<string,string> = {
      open: '#ef6c00', 'in-progress': '#1565c0', resolved: '#2e7d32',
      closed: '#616161', rejected: '#c62828'
    }
    const color = colors[status] || '#616161'
    return (
      <span style={{fontSize:'0.62rem',fontWeight:700,padding:'3px 10px',borderRadius:10,color,background:`${color}18`,whiteSpace:'nowrap',textTransform:'capitalize'}}>
        {status}
      </span>
    )
  }

  const InfoField = ({ icon: Icon, label, value }: any) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(198,40,40,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="var(--red-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)', wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  )

  // Tab button component
  const TabBtn = ({ id, label, icon: Icon, count }: any) => (
    <button
      onClick={() => setDetailTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 6, border: 'none',
        background: detailTab === id ? 'var(--red-primary)' : 'transparent',
        color: detailTab === id ? '#fff' : 'var(--text-muted)',
        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
        transition: 'all 0.15s'
      }}
    >
      <Icon size={14} />
      {label}
      {count > 0 && <span style={{ 
        marginLeft: 4, padding: '1px 6px', borderRadius: 10, 
        fontSize: '0.65rem', background: detailTab === id ? 'rgba(255,255,255,0.2)' : 'rgba(198,40,40,0.1)', 
        color: detailTab === id ? '#fff' : 'var(--red-primary)' 
      }}>{count}</span>}
    </button>
  )

  // ✅ NEW: Status filter pill component
  const StatusFilterPill = ({ id, label, icon: Icon, count }: { id: 'all' | 'active' | 'inactive', label: string, icon: any, count: number }) => (
    <button
      onClick={() => setStatusFilter(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 14px', borderRadius: 20, border: '1px solid',
        borderColor: statusFilter === id ? 'var(--red-primary)' : 'var(--border)',
        background: statusFilter === id ? 'var(--red-primary)' : 'var(--bg-card)',
        color: statusFilter === id ? '#fff' : 'var(--text-sub)',
        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
        transition: 'all 0.15s', whiteSpace: 'nowrap'
      }}
    >
      <Icon size={13} />
      {label}
      <span style={{
        marginLeft: 3, padding: '1px 6px', borderRadius: 10,
        fontSize: '0.65rem', fontWeight: 700,
        background: statusFilter === id ? 'rgba(255,255,255,0.25)' : 'var(--bg-mid)',
        color: statusFilter === id ? '#fff' : 'var(--text-muted)'
      }}>{count}</span>
    </button>
  )

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="EMPLOYEES" title="Employee Management" subtitle="Manage your team members and their access"/>
      {msg && <Alert type={msg.type} message={msg.text}/>}

      {/* Top Action Bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.8rem',gap:'0.7rem',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1',minWidth:'240px',maxWidth:'380px'}}>
          <Search size={14} color="var(--text-muted)" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}/>
          <input type="text" placeholder="Search by name, ID or department..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:'0.82rem',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-sub)',cursor:refreshing?'not-allowed':'pointer',fontSize:'0.78rem',fontWeight:600}}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/> Refresh
          </button>
          <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:6,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>
            <UserPlus size={14}/> Add Employee
          </button>
        </div>
      </div>

      {/* ✅ NEW: Status Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusFilterPill id="all" label="All" icon={Users} count={totalCount} />
        <StatusFilterPill id="active" label="Active" icon={UserCheck} count={activeCount} />
        <StatusFilterPill id="inactive" label="Inactive" icon={UserX} count={inactiveCount} />
        
        {/* Clear filter indicator */}
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', borderRadius: 20, border: '1px dashed var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              marginLeft: 'auto'
            }}
          >
            <RotateCcw size={12} /> Reset filter
          </button>
        )}
      </div>

      {/* Employee Table */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontSize:'0.87rem',fontWeight:600}}>
            {statusFilter === 'all' ? 'All Employees' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Employees`}
            {' '}
            <span style={{color:'var(--text-muted)',fontWeight:500}}>
              ({filteredEmployees.length}{statusFilter !== 'all' ? ` of ${totalCount}` : ''})
            </span>
          </span>
          {search && (
            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
              Search: "{search}"
            </span>
          )}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH c="Employee"/><TH c="ID"/><TH c="Department"/><TH c="Tickets"/><TH c="Open"/><TH c="Actions"/></tr></thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{padding:'2.5rem',textAlign:'center',color:'var(--text-muted)'}}>
                    <div style={{fontSize:'0.85rem',marginBottom:4}}>No employees found.</div>
                    <div style={{fontSize:'0.75rem'}}>Try adjusting your search or filter.</div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e: any) => (
                  <tr 
                    key={e._id||e.id} 
                    style={{
                      borderBottom:'1px solid var(--border-mid)',
                      opacity: e.status === 'inactive' ? 0.65 : 1,
                      background: e.status === 'inactive' ? 'rgba(0,0,0,0.02)' : 'transparent'
                    }}
                  >
                    <td style={{padding:'12px 1.4rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10, cursor:'pointer'}} onClick={() => openEmployeeDetail(e)} title="Click to view full profile">
                        <div style={{width:30,height:30,borderRadius:'50%',background:avatarColor(e.name||'A'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'#fff',flexShrink:0, opacity: e.status === 'inactive' ? 0.7 : 1}}>{initials(e.name)}</div>
                        <div>
                          <div style={{fontWeight:500,color:'var(--text-main)',fontSize:'0.85rem'}}>{e.name}</div>
                          <div style={{fontSize:'0.72rem',color:e.status==='active'?'#2e7d32':'var(--text-muted)'}}>● {e.status}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 1.4rem',fontFamily:'IBM Plex Mono',color:'var(--red-primary)',fontSize:'0.77rem'}}>{e.emp_id}</td>
                    <td style={{padding:'12px 1.4rem'}}><DeptBadge dept={e.department||'—'}/></td>
                    <td style={{padding:'12px 1.4rem'}}>
                      <span style={{background:'var(--red-primary)',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'2px 8px',borderRadius:10}}>{e.ticket_count ?? 0}</span>
                    </td>
                    <td style={{padding:'12px 1.4rem'}}>
                      {(e.open_tickets ?? 0) > 0 ? (
                        <span style={{background:'#b71c1c',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'2px 8px',borderRadius:10}}>{e.open_tickets}</span>
                      ) : <span style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>—</span>}
                    </td>
                    <td style={{padding:'10px 1.2rem'}}>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <button onClick={(ev) => { ev.stopPropagation(); setEditEmp(e); }} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}><Pencil size={11}/> Edit</button>
                        <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e._id||e.id); }} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:5,border:'1px solid rgba(198,40,40,0.25)',background:'rgba(198,40,40,0.08)',color:'#c62828',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}><Trash2 size={11}/> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins Table */}
      <div className="card">
        <div style={{padding:'0.9rem 1.2rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)',display:'flex',alignItems:'center',gap:8}}>
          <ShieldCheck size={15} color="var(--red-primary)"/>
          <span style={{fontSize:'0.85rem',fontWeight:600}}>Admins ({admins.length})</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH c="Admin"/><TH c="ID"/><TH c="Phone"/><TH c="Actions"/></tr></thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={4} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No admins found.</td></tr>
              ) : (
                admins.map((a: any) => (
                  <tr key={a._id||a.id} style={{borderBottom:'1px solid var(--border-mid)'}}>
                    <td style={{padding:'12px 1.4rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'#c62828',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'#fff'}}>{initials(a.name)}</div>
                        <div>
                          <div style={{fontWeight:500,color:'var(--text-main)',fontSize:'0.85rem'}}>{a.name}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--red-primary)'}}>● Admin</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 1.4rem',fontFamily:'IBM Plex Mono',color:'var(--red-primary)',fontSize:'0.77rem'}}>{a.emp_id}</td>
                    <td style={{padding:'12px 1.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{a.phone||'—'}</td>
                    <td style={{padding:'10px 1.2rem'}}>
                      <button onClick={()=>setEditAdmin(a)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.7rem',fontWeight:600}}><Pencil size={11}/> Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL EMPLOYEE DETAIL MODAL */}
      {detailEmp && (
        <Modal open={true} onClose={() => { setDetailEmp(null); setEmpAssets([]); setEmpTickets([]); setAssetError(null); }} title="Employee Profile">
          <div style={{ padding: '1.2rem', maxWidth: 760, maxHeight: '85vh', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1.2rem', borderRadius: 10, background: 'linear-gradient(135deg, rgba(198,40,40,0.08) 0%, rgba(198,40,40,0.02) 100%)', border: '1px solid rgba(198,40,40,0.15)', marginBottom: '1.2rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor(detailEmp.name || 'A'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff', flexShrink: 0, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {initials(detailEmp.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{detailEmp.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={11} /> {detailEmp.emp_id}</span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={11} /> {detailEmp.role || 'Employee'}</span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, background: detailEmp.status === 'active' ? 'rgba(46,125,50,0.12)' : 'rgba(198,40,40,0.12)', color: detailEmp.status === 'active' ? '#2e7d32' : '#c62828' }}>
                    {detailEmp.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{detailEmp.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.2rem' }}>
              <button onClick={handleResetPassword} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(21,101,192,0.3)', background: 'rgba(21,101,192,0.06)', color: '#1565c0', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <KeyRound size={13} /> Reset Password
              </button>
              <button onClick={handleToggleStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(198,40,40,0.3)', background: 'rgba(198,40,40,0.06)', color: '#c62828', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <Ban size={13} /> {detailEmp.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => { setEditEmp(detailEmp); setDetailEmp(null); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <Pencil size={13} /> Edit Profile
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.2rem', padding: 4, borderRadius: 8, background: 'var(--bg-mid)', border: '1px solid var(--border)' }}>
              <TabBtn id="overview" label="Overview" icon={User} />
              <TabBtn id="assets" label="Assets" icon={Package} count={empAssets.length + empAssetsHistory.length} />
              <TabBtn id="tickets" label="Tickets" icon={FileText} count={empTickets.length} />
              <TabBtn id="timeline" label="Timeline" icon={Activity} count={timeline.length} />
            </div>

            {loadingDetail ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>
            ) : (
              <>
                {/* ===== OVERVIEW TAB ===== */}
                {detailTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                      <InfoField icon={Building2} label="Department" value={detailEmp.department} />
                      <InfoField icon={Phone} label="Phone Number" value={detailEmp.phone} />
                      <InfoField icon={Mail} label="Email" value={detailEmp.email} />
                      <InfoField icon={User} label="Full Name" value={detailEmp.name} />
                      <InfoField icon={Hash} label="Employee ID" value={detailEmp.emp_id} />
                      <InfoField icon={Shield} label="Role / Access" value={detailEmp.role} />
                      <InfoField icon={Calendar} label="Joined On" value={fmtDate(detailEmp.created_at)} />
                      <InfoField icon={Clock} label="Last Updated" value={fmtDate(detailEmp.updated_at)} />
                    </div>

                    {/* Emergency Contact from latest asset request */}
                    {empAssets[0]?.emergency_phone && (
                      <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(198,40,40,0.04)', border: '1px solid rgba(198,40,40,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <HeartPulse size={14} color="#c62828" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c62828' }}>Emergency Contact</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {empAssets[0].emergency_contact || '—'} · {empAssets[0].emergency_phone}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {[
                        { label: 'Total Tickets', value: empTickets.length, icon: FileText, color: '#1565c0' },
                        { label: 'Open', value: empTickets.filter((t:any)=>t.status==='open').length, icon: AlertCircle, color: '#ef6c00' },
                        { label: 'Resolved', value: empTickets.filter((t:any)=>t.status==='resolved').length, icon: CheckCircle2, color: '#2e7d32' },
                        { label: 'Assigned Items', value: empAssets.length, icon: Package, color: '#e65100' },
                      ].map((stat) => (
                        <div key={stat.label} style={{ padding: '12px', borderRadius: 8, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <stat.icon size={16} color={stat.color} style={{ marginBottom: 4 }} />
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* ADMIN NOTES */}
                    <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(106,27,154,0.04)', border: '1px solid rgba(106,27,154,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <StickyNote size={14} color="#6a1b9a" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6a1b9a' }}>Admin Notes (Private)</span>
                      </div>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add private notes about this employee..."
                        style={{
                          width: '100%', minHeight: 80, padding: '8px 10px', borderRadius: 5,
                          border: '1px solid var(--border)', background: 'var(--bg-input)',
                          color: 'var(--text-main)', fontSize: '0.8rem', resize: 'vertical',
                          boxSizing: 'border-box', marginBottom: 8
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 5, border: 'none', background: '#6a1b9a', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <Save size={12} /> {savingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== ASSETS TAB ===== */}
                {detailTab === 'assets' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Current Assets */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1565c0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={14} /> Currently Assigned ({empAssets.length})
                      </div>
                      {empAssets.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                          No active assets assigned.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {empAssets.map((asset: any) => (
                            <div key={asset._id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(21,101,192,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Laptop size={18} color="#1565c0" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{asset.asset_code || '—'}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{asset.name || 'Unknown'}</span>
                                  <AssetStatusBadge status={asset.status || 'assigned'} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '4px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  <span><strong>Type:</strong> {asset.asset_type || '—'}</span>
                                  <span><strong>Model:</strong> {asset.model || '—'}</span>
                                  <span><strong>Assigned:</strong> {fmtDate(asset.assigned_date)}</span>
                                  <span><strong>Until:</strong> {asset.is_permanent ? 'Permanent' : fmtDate(asset.to_date)}</span>
                                  {asset.reason && <span style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {asset.reason}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Asset History */}
                    {empAssetsHistory.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#616161', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Archive size={14} /> Asset History ({empAssetsHistory.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {empAssetsHistory.map((asset: any) => (
                            <div key={asset._id} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.85 }}>
                              <Archive size={16} color="#616161" />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{asset.asset_code || asset.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                  {asset.asset_type} · Returned {fmtDate(asset.returned_date)}
                                </span>
                              </div>
                              <AssetStatusBadge status={asset.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== TICKETS TAB ===== */}
                {detailTab === 'tickets' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {empTickets.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found.</div>
                    ) : (
                      empTickets.map((t: any) => (
                        <div key={t._id || t.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: 3 }}>{t.title || t.subject || 'Untitled'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span>#{t.ticket_id || t._id?.slice(-6)}</span>
                              <span>·</span>
                              <span>{t.category || 'General'}</span>
                              <span>·</span>
                              <span>{fmtDate(t.created_at)}</span>
                              {t.priority && (
                                <>
                                  <span>·</span>
                                  <span style={{ 
                                    padding: '1px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                                    background: t.priority === 'high' ? 'rgba(198,40,40,0.1)' : 'rgba(239,108,0,0.1)',
                                    color: t.priority === 'high' ? '#c62828' : '#ef6c00'
                                  }}>{t.priority}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <TicketStatusBadge status={t.status} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ===== TIMELINE TAB ===== */}
                {detailTab === 'timeline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
                    {timeline.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No activity yet.</div>
                    ) : (
                      timeline.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                          {/* Timeline line */}
                          {idx < timeline.length - 1 && (
                            <div style={{ position: 'absolute', left: 15, top: 32, bottom: -8, width: 2, background: 'var(--border)' }} />
                          )}
                          <div style={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            background: `${item.color}15`, border: `2px solid ${item.color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 
                          }}>
                            <item.icon size={14} color={item.color} />
                          </div>
                          <div style={{ flex: 1, paddingBottom: 16 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)' }}>{item.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3, opacity: 0.8 }}>{timeAgo(item.date)} · {fmtDateTime(item.date)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button onClick={() => { setDetailEmp(null); setEmpAssets([]); setEmpTickets([]); setAssetError(null); }}
                    style={{ padding: '8px 24px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Close</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Employee"><AddForm/></Modal>
      {editEmp && (<Modal open={true} onClose={()=>setEditEmp(null)} title="Edit Employee"><EditForm emp={editEmp} isAdmin={false}/></Modal>)}
      {editAdmin && (<Modal open={true} onClose={()=>setEditAdmin(null)} title="Edit Admin"><EditForm emp={editAdmin} isAdmin={true}/></Modal>)}
    </AppLayout>
  )
}