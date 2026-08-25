'use client'

import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, DeptBadge } from '@/components/ui'
import api from '@/lib/api'
import { 
  Search, UserPlus, Save, Pencil, Trash2, ShieldCheck, RefreshCw, 
  Package, Laptop, Mail, Phone, Building2, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, User, Hash, Shield, 
  FileText, RotateCcw
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

function extractId(val: any): string {
  if (!val) return ''
  if (typeof val === 'object') return val._id || val.id || ''
  return String(val)
}

/* Check if a request/asset belongs to the given employee */
function belongsToEmployee(item: any, empId: string, empCode: string): boolean {
  const itemEmpId = extractId(item.employee_id)
  const itemEmpCode = typeof item.employee_id === 'object' ? item.employee_id?.emp_id || item.employee_id?.empId : ''
  const itemAssignedTo = extractId(item.assigned_to || item.user_id || item.emp_id)
  
  return (
    itemEmpId === empId ||
    itemEmpId === empCode ||
    itemEmpCode === empCode ||
    itemEmpCode === empId ||
    itemAssignedTo === empId ||
    itemAssignedTo === empCode
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
  const [empTickets, setEmpTickets] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [assetError, setAssetError] = useState<string | null>(null)

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
    const empId = extractId(emp._id || emp.id)
    const empCode = emp.emp_id || ''

    try {
      // Match tickets locally
      const empTicketList = allTickets.filter((t: any) => {
        const tEmpId = extractId(t.employee_id || t.emp_id || t.created_by || t.user_id)
        return tEmpId === empId || t.emp_id === empCode
      })
      setEmpTickets(empTicketList)

      let rawAssets: any[] = []
      let source = ''

      // Attempt 1: dedicated assigned endpoint
      try {
        const res = await api.get(`/assets/assigned?employee_id=${empId}`)
        const data = res.data?.assets ?? res.data ?? []
        if (Array.isArray(data) && data.length > 0) {
          rawAssets = data
          source = '/assets/assigned'
        }
      } catch { /* ignore */ }

      // Attempt 2: query assets
      if (rawAssets.length === 0) {
        try {
          const res = await api.get(`/assets?employee_id=${empId}`)
          const data = res.data?.assets ?? res.data ?? []
          if (Array.isArray(data) && data.length > 0) {
            rawAssets = data
            source = '/assets'
          }
        } catch { /* ignore */ }
      }

      // Attempt 3: take-home requests
      if (rawAssets.length === 0) {
        try {
          const res = await api.get('/assets/take-home-requests')
          const allRequests = Array.isArray(res.data) ? res.data : (res.data?.requests ?? [])
          rawAssets = allRequests
          source = '/assets/take-home-requests'
        } catch { /* ignore */ }
      }

      // Attempt 4: employee-specific endpoint
      if (rawAssets.length === 0) {
        try {
          const res = await api.get(`/employees/${empId}/assets`)
          const data = res.data?.assets ?? res.data ?? []
          if (Array.isArray(data) && data.length > 0) {
            rawAssets = data
            source = '/employees/:id/assets'
          }
        } catch { /* ignore */ }
      }

      // ✅ CRITICAL: Always filter client-side to ensure only THIS employee's assets show
      const filteredAssets = rawAssets
        .filter((item: any) => belongsToEmployee(item, empId, empCode))
        .map((r: any) => ({
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
          emergency_phone: r.emergency_phone
        }))

      console.log(`[Assets] Source: ${source}, Raw: ${rawAssets.length}, Filtered: ${filteredAssets.length} for emp ${empId}`)

      if (filteredAssets.length === 0 && rawAssets.length > 0) {
        setAssetError(`Found ${rawAssets.length} assets from server but none belong to this employee. IDs may not match.`)
      } else {
        setAssetError(null)
      }

      setEmpAssets(filteredAssets)
    } catch (err: any) {
      setAssetError(err.response?.data?.error || 'Failed to load assets')
      setEmpAssets([])
      setEmpTickets([])
    } finally {
      setLoadingDetail(false)
    }
  }

  const openEmployeeDetail = (emp: any) => {
    setDetailEmp(emp)
    fetchEmployeeDetail(emp)
  }

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

  const filteredEmployees = employeesWithCounts.filter((e: any) => 
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

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

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="EMPLOYEES" title="Employee Management" subtitle="Manage your team members and their access"/>
      {msg && <Alert type={msg.type} message={msg.text}/>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',gap:'0.7rem',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1',minWidth:'240px',maxWidth:'380px'}}>
          <Search size={14} color="var(--text-muted)" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}/>
          <input type="text" placeholder="Search by name, ID or department..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:'0.82rem',boxSizing:'border-box'}}/>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-sub)',cursor:refreshing?'not-allowed':'pointer',fontSize:'0.78rem',fontWeight:600}}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/> Refresh
        </button>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:6,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>
          <UserPlus size={14}/> Add Employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)'}}>
          <span style={{fontSize:'0.87rem',fontWeight:600}}>All Employees ({filteredEmployees.length})</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH c="Employee"/><TH c="ID"/><TH c="Department"/><TH c="Tickets"/><TH c="Open"/><TH c="Actions"/></tr></thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={6} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No employees found.</td></tr>
              ) : (
                filteredEmployees.map((e: any) => (
                  <tr key={e._id||e.id} style={{borderBottom:'1px solid var(--border-mid)'}}>
                    <td style={{padding:'12px 1.4rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10, cursor:'pointer'}} onClick={() => openEmployeeDetail(e)} title="Click to view full profile">
                        <div style={{width:30,height:30,borderRadius:'50%',background:avatarColor(e.name||'A'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'#fff',flexShrink:0}}>{initials(e.name)}</div>
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
          <div style={{ padding: '1.2rem', maxWidth: 720, maxHeight: '80vh', overflowY: 'auto' }}>
            
            {/* Header Card */}
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

            {loadingDetail ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>
            ) : (
              <>
                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem', marginBottom: '1.5rem' }}>
                  <InfoField icon={Building2} label="Department" value={detailEmp.department} />
                  <InfoField icon={Phone} label="Phone Number" value={detailEmp.phone} />
                  <InfoField icon={Mail} label="Email" value={detailEmp.email} />
                  <InfoField icon={User} label="Full Name" value={detailEmp.name} />
                  <InfoField icon={Hash} label="Employee ID" value={detailEmp.emp_id} />
                  <InfoField icon={Shield} label="Role / Access" value={detailEmp.role} />
                  <InfoField icon={Calendar} label="Joined On" value={fmtDate(detailEmp.created_at)} />
                  <InfoField icon={Clock} label="Last Updated" value={fmtDate(detailEmp.updated_at)} />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Total Tickets', value: empTickets.length, icon: FileText, color: '#1565c0' },
                    { label: 'Open', value: empTickets.filter((t:any)=>t.status==='open').length, icon: AlertCircle, color: '#ef6c00' },
                    { label: 'In Progress', value: empTickets.filter((t:any)=>t.status==='in-progress').length, icon: Clock, color: '#6a1b9a' },
                    { label: 'Assigned Items', value: empAssets.length, icon: Package, color: '#2e7d32' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ padding: '12px', borderRadius: 8, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <stat.icon size={16} color={stat.color} style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* ASSIGNED ASSETS SECTION */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(21,101,192,0.06)', border: '1px solid rgba(21,101,192,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={16} color="#1565c0" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1565c0' }}>Assigned Assets & Products ({empAssets.length})</span>
                    </div>
                    <button 
                      onClick={() => fetchEmployeeDetail(detailEmp)}
                      disabled={loadingDetail}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(21,101,192,0.3)', background: 'rgba(21,101,192,0.08)', color: '#1565c0', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      <RotateCcw size={11} /> Retry
                    </button>
                  </div>

                  {assetError && (
                    <div style={{ padding: '10px 12px', marginBottom: 10, borderRadius: 6, background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.2)', color: '#c62828', fontSize: '0.78rem' }}>
                      {assetError}
                    </div>
                  )}

                  {empAssets.length === 0 && !assetError ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                      No assets or products assigned to this employee.
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
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{asset.asset_code || asset.code || '—'}</span>
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{asset.name || 'Unknown Asset'}</span>
                              <AssetStatusBadge status={asset.status || 'assigned'} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '4px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span><strong>Type:</strong> {asset.asset_type || asset.type || '—'}</span>
                              <span><strong>Model:</strong> {asset.model || '—'}</span>
                              <span><strong>Assigned:</strong> {fmtDate(asset.assigned_date)}</span>
                              <span><strong>Until:</strong> {asset.is_permanent ? 'Permanent' : fmtDate(asset.to_date)}</span>
                              {asset.reason && <span style={{ gridColumn: '1 / -1' }}><strong>Reason:</strong> {asset.reason}</span>}
                              {asset.notes && <span style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: '#666' }}>Notes: {asset.notes}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TICKETS SECTION */}
                {empTickets.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(239,108,0,0.06)', border: '1px solid rgba(239,108,0,0.15)' }}>
                      <FileText size={16} color="#ef6c00" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef6c00' }}>Recent Tickets ({empTickets.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {empTickets.slice(0, 5).map((t: any) => (
                        <div key={t._id || t.id} style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.015)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: 2 }}>{t.title || t.subject || 'Untitled Ticket'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>#{t.ticket_id || t._id?.slice(-6)} · {fmtDate(t.created_at)} · {t.category || 'General'}</div>
                          </div>
                          <TicketStatusBadge status={t.status} />
                        </div>
                      ))}
                      {empTickets.length > 5 && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: 4 }}>+ {empTickets.length - 5} more tickets</div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: 10 }}>
                  <button onClick={() => { setDetailEmp(null); setEmpAssets([]); setEmpTickets([]); setAssetError(null); }}
                    style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Close</button>
                  <button onClick={() => { setEditEmp(detailEmp); setDetailEmp(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 6, border: 'none', background: 'var(--red-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Pencil size={13} /> Edit Employee
                  </button>
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