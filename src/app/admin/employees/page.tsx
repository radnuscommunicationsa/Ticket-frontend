'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, DeptBadge } from '@/components/ui'
import api from '@/lib/api'

const DEPTS = ['Loan','Accounts','Faculty','Web Development','Mobile Development','Digital Marketing','Sales','Design','Admission','HR','Telecalling','IT Software Support','Stock','Distribution']
function avatarColor(n:string){const c=['#1565c0','#6a1b9a','#00695c','#c62828','#e65100','#2e7d32','#37474f','#4527a0'];let h=0;for(const ch of n)h+=ch.charCodeAt(0);return c[h%c.length]}
function initials(n?:string){if(!n)return 'NA';const p=n.split(' ');return((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()}

export default function AdminEmployees() {
  const [employees,setEmployees]=useState<any[]>([])
  const [admins,setAdmins]=useState<any[]>([])
  const [msg,setMsg]=useState<{type:'success'|'error',text:string}|null>(null)
  const [showAdd,setShowAdd]=useState(false)
  const [editEmp,setEditEmp]=useState<any>(null)
  const [editAdmin,setEditAdmin]=useState<any>(null)

  const load=async()=>{
    try{
      const { data } = await api.get('/employees');
setEmployees(data?.employees ?? []);
setAdmins(data?.admins ?? [])
    }catch(err:any){setMsg({type:'error',text:err.response?.data?.error||'Failed to load'})}
  }
  useEffect(()=>{load()},[])

  const handleDelete=async(id:string)=>{
    if(!confirm('Delete this employee and all their tickets?'))return
    try{await api.delete(`/employees/${id}`);setMsg({type:'success',text:'Employee deleted.'});load()}
    catch(e:any){setMsg({type:'error',text:e.response?.data?.error||'Delete failed'})}
  }

  const inp={width:'100%',padding:'10px 12px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:'0.85rem'}
  const FG=({label,children}:{label:string,children:React.ReactNode})=>(
    <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:'0.9rem'}}>
      <label style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>{label}</label>
      {children}
    </div>
  )

  const AddForm=()=>{
    const [d,setD]=useState({name:'',emp_id:'',email:'',password:'',department:'',phone:'',role:'employee'})
    const submit=async(e:React.FormEvent)=>{
      e.preventDefault()
      try{await api.post('/employees',d);setMsg({type:'success',text:`Employee ${d.name} added!`});setShowAdd(false);load()}
      catch(err:any){setMsg({type:'error',text:err.response?.data?.error||'Failed'})}
    }
    return <form onSubmit={submit}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Full Name *"><input required style={inp} value={d.name} onChange={e=>setD({...d,name:e.target.value})} placeholder="John Smith"/></FG>
        <FG label="Employee ID *"><input required style={inp} value={d.emp_id} onChange={e=>setD({...d,emp_id:e.target.value})} placeholder="EMP-0120"/></FG>
      </div>
      <FG label="Email *"><input required type="email" style={inp} value={d.email} onChange={e=>setD({...d,email:e.target.value})} placeholder="john@company.com"/></FG>
      <FG label="Password *"><input required type="password" style={inp} value={d.password} onChange={e=>setD({...d,password:e.target.value})} placeholder="Set initial password"/></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Department"><select style={inp} value={d.department} onChange={e=>setD({...d,department:e.target.value})}><option value="">— Select —</option>{DEPTS.map(dept=><option key={dept}>{dept}</option>)}</select></FG>
        <FG label="Role">
  <select
    style={inp}
    value={d.role}
    onChange={e => setD({ ...d, role: e.target.value })}
  >
    <option value="employee">Employee</option>
    <option value="admin">Admin</option>
    <option value="system_admin">System Admin</option>
  </select>
</FG>
      </div>
      <FG label="Phone"><input type="tel" style={inp} value={d.phone} onChange={e=>setD({...d,phone:e.target.value})} placeholder="Optional"/></FG>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:'0.5rem'}}>
        <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'8px 18px',borderRadius:5,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
        <button type="submit" style={{padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>➕ Add Employee</button>
      </div>
    </form>
  }

  const EditForm=({emp,isAdmin}:{emp:any,isAdmin:boolean})=>{
    const [d,setD]=useState({name:emp.name,emp_id:emp.emp_id,email:emp.email,department:emp.department||'',phone:emp.phone||'',role:emp.role,status:emp.status,new_password:''})
    const submit=async(e:React.FormEvent)=>{
      e.preventDefault()
      try{await api.patch(`/api/employees/${emp._id||emp.id}`,d);setMsg({type:'success',text:`${d.name} updated!`});setEditEmp(null);setEditAdmin(null);load()}
      catch(err:any){setMsg({type:'error',text:err.response?.data?.error||'Failed'})}
    }
    return <form onSubmit={submit}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Full Name *"><input required style={inp} value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></FG>
        <FG label={isAdmin?'Admin ID *':'Employee ID *'}><input required style={inp} value={d.emp_id} onChange={e=>setD({...d,emp_id:e.target.value})}/></FG>
      </div>
      <FG label="Email *"><input required type="email" style={inp} value={d.email} onChange={e=>setD({...d,email:e.target.value})}/></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Department"><select style={inp} value={d.department} onChange={e=>setD({...d,department:e.target.value})}><option value="">— Select —</option>{DEPTS.map(dept=><option key={dept}>{dept}</option>)}</select></FG>
        <FG label="Status"><select style={inp} value={d.status} onChange={e=>setD({...d,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></FG>
      </div>
      <FG label="Phone"><input type="tel" style={inp} value={d.phone} onChange={e=>setD({...d,phone:e.target.value})}/></FG>
      <FG label="New Password (blank = no change)"><input type="password" style={inp} value={d.new_password} onChange={e=>setD({...d,new_password:e.target.value})} placeholder="Enter to change..."/></FG>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:'0.5rem'}}>
        <button type="button" onClick={()=>{setEditEmp(null);setEditAdmin(null)}} style={{padding:'8px 18px',borderRadius:5,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
        <button type="submit" style={{padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>💾 Save Changes</button>
      </div>
    </form>
  }

  const TH=({c}:{c:string})=><th style={{fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',padding:'10px 1.4rem',textAlign:'left',borderBottom:'1px solid var(--border)',background:'rgba(198,40,40,0.04)',whiteSpace:'nowrap'}}>{c}</th>

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="EMPLOYEES" title="Employee Management" subtitle="Manage your team members and their access"/>
      {msg&&<Alert type={msg.type} message={msg.text}/>}

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
        <button onClick={()=>setShowAdd(true)} style={{padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>➕ Add New Employee</button>
      </div>

      {/* Employee Table */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)'}}><span style={{fontSize:'0.87rem',fontWeight:600}}>All Employees ({employees.length})</span></div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH c="Employee"/><TH c="ID"/><TH c="Department"/><TH c="Email"/><TH c="Tickets"/><TH c="Open"/><TH c="Actions"/></tr></thead>
            <tbody>
              {employees.length===0
                ?<tr><td colSpan={7} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No employees yet.</td></tr>
                :employees.map((e:any)=>(
                <tr key={e._id||e.id} style={{borderBottom:'1px solid var(--border-mid)'}}>
                  <td style={{padding:'12px 1.4rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:30,height:30,borderRadius:'50%',background:avatarColor(e.name||'A'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'#fff',flexShrink:0}}>{initials(e.name)}</div>
                      <div>
                        <div style={{fontWeight:500,color:'var(--text-main)',fontSize:'0.85rem'}}>{e.name}</div>
                        <div style={{fontSize:'0.72rem',color:e.status==='active'?'#2e7d32':'var(--text-muted)'}}>● {e.status}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'12px 1.4rem',fontFamily:'IBM Plex Mono',color:'var(--red-primary)',fontSize:'0.77rem'}}>{e.emp_id}</td>
                  <td style={{padding:'12px 1.4rem'}}><DeptBadge dept={e.department||'—'}/></td>
                  <td style={{padding:'12px 1.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{e.email}</td>
                  <td style={{padding:'12px 1.4rem'}}><span style={{background:'var(--red-primary)',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{e.ticket_count||0}</span></td>
                  <td style={{padding:'12px 1.4rem'}}>{(e.open_tickets||0)>0?<span style={{background:'#b71c1c',color:'#fff',fontSize:'0.62rem',fontWeight:700,padding:'1px 6px',borderRadius:10}}>{e.open_tickets}</span>:'-'}</td>
                  <td style={{padding:'12px 1.4rem',display:'flex',gap:5,flexWrap:'wrap'}}>
                    <button onClick={()=>setEditEmp(e)} style={{padding:'3px 8px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.68rem',fontWeight:600}}>✏️ Edit</button>
                    <button onClick={()=>handleDelete(e._id||e.id)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid rgba(198,40,40,0.25)',background:'rgba(198,40,40,0.08)',color:'#c62828',cursor:'pointer',fontSize:'0.68rem',fontWeight:600}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins Table */}
      <div className="card">
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)'}}><span style={{fontSize:'0.87rem',fontWeight:600}}>🛡️ Admins ({admins.length})</span></div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><TH c="Admin"/><TH c="ID"/><TH c="Email"/><TH c="Phone"/><TH c="Actions"/></tr></thead>
            <tbody>
              {admins.length===0
                ?<tr><td colSpan={5} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No admins found.</td></tr>
                :admins.map((a:any)=>(
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
                  <td style={{padding:'12px 1.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{a.email}</td>
                  <td style={{padding:'12px 1.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{a.phone||'—'}</td>
                  <td style={{padding:'12px 1.4rem'}}>
                    <button onClick={()=>setEditAdmin(a)} style={{padding:'3px 8px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.68rem',fontWeight:600}}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="➕ Add New Employee"><AddForm/></Modal>
      {editEmp&&<Modal open={true} onClose={()=>setEditEmp(null)} title="✏️ Edit Employee"><EditForm emp={editEmp} isAdmin={false}/></Modal>}
      {editAdmin&&<Modal open={true} onClose={()=>setEditAdmin(null)} title="🛡️ Edit Admin"><EditForm emp={editAdmin} isAdmin={true}/></Modal>}
    </AppLayout>
  )
}