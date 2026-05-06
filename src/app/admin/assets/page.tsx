'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, StatCard } from '@/components/ui'
import api from '@/lib/api'

const CATS = ['Laptop','Desktop','Monitor','Keyboard','Mouse','Printer','Phone','Server','Network Device','Other']

export default function AdminAssets() {
  const [assets,       setAssets]       = useState<any[]>([])
  const [employees,    setEmployees]    = useState<any[]>([])
  const [stats,        setStats]        = useState<any>({ total:0, available:0, assigned:0, repair:0 })
  const [msg,          setMsg]          = useState<{type:'success'|'error',text:string}|null>(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editAsset,    setEditAsset]    = useState<any>(null)
  const [assignAsset,  setAssignAsset]  = useState<any>(null)   // ✅ NEW: for assign modal
  const [statusF,      setStatusF]      = useState('')
  const [q,            setQ]            = useState('')
  const [loading,      setLoading]      = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusF) params.status = statusF
      if (q)       params.q      = q
      const { data } = await api.get('/assets', { params })
      setAssets(data.assets || [])
      setStats(data.stats   || { total:0, available:0, assigned:0, repair:0 })
    } catch (e:any) {
      setMsg({ type:'error', text: e.response?.data?.error || 'Failed to load assets' })
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Load employees for the assign dropdown
  const loadEmployees = async () => {
    try {
      const { data } = await api.get('/employees')
      setEmployees(data.employees || data || [])
    } catch (e:any) {
      console.error('Failed to load employees', e)
      setEmployees([])
    }
  }

  useEffect(() => { load() }, [statusF])
  useEffect(() => { loadEmployees() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    try {
      await api.delete(`/assets/${id}`)
      setMsg({ type:'success', text:'Asset deleted.' })
      load()
    } catch (e:any) {
      setMsg({ type:'error', text: e.response?.data?.error || 'Delete failed' })
    }
  }

  // ✅ NEW: Handle asset assignment
  const handleAssign = async (assetId: string, employeeId: string) => {
    try {
      await api.patch(`/assets/${assetId}/assign`, { employee_id: employeeId })
      setMsg({ type:'success', text:'Asset assigned successfully!' })
      setAssignAsset(null)
      load()
    } catch (e:any) {
      setMsg({ type:'error', text: e.response?.data?.error || 'Assignment failed' })
    }
  }

  // ✅ NEW: Handle unassign
  const handleUnassign = async (assetId: string) => {
    if (!confirm('Unassign this asset from the employee?')) return
    try {
      await api.patch(`/assets/${assetId}/unassign`)
      setMsg({ type:'success', text:'Asset unassigned successfully!' })
      load()
    } catch (e:any) {
      setMsg({ type:'error', text: e.response?.data?.error || 'Unassign failed' })
    }
  }

  const inp = {
    width:'100%', padding:'10px 12px', borderRadius:5,
    border:'1px solid var(--border)', background:'var(--bg-input)',
    color:'var(--text-main)', fontSize:'0.85rem'
  }

  const FG = ({label,children}:{label:string,children:React.ReactNode}) => (
    <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:'0.9rem'}}>
      <label style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>{label}</label>
      {children}
    </div>
  )

  // ✅ NEW: Assign Form Component
  const AssignForm = ({ asset }: { asset: any }) => {
    const [selectedEmployee, setSelectedEmployee] = useState('')

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedEmployee) {
        setMsg({ type: 'error', text: 'Please select an employee' })
        return
      }
      handleAssign(asset._id || asset.id, selectedEmployee)
    }

    return (
      <form onSubmit={onSubmit} style={{ maxWidth: 500 }}>
        {/* Show asset info */}
        <div style={{
          padding: '1rem',
          background: 'rgba(198,40,40,0.04)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          marginBottom: '1.2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Asset Code</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--red-primary)', margin: '2px 0 0' }}>{asset.asset_code}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Asset Name</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '2px 0 0' }}>{asset.name}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Category</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: '2px 0 0' }}>{asset.category}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
              <p style={{ fontSize: '0.85rem', color: statusColor[asset.status] || 'var(--text-muted)', fontWeight: 600, margin: '2px 0 0' }}>{asset.status}</p>
            </div>
          </div>
        </div>

        <FG label="Select Employee *">
          <select
            required
            style={inp}
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
          >
            <option value="">— Choose an Employee —</option>
            {employees.map((emp: any) => (
              <option key={emp._id || emp.id} value={emp._id || emp.id}>
                {emp.name || emp.full_name} {emp.email ? `(${emp.email})` : ''} {emp.department ? `- ${emp.department}` : ''}
              </option>
            ))}
          </select>
        </FG>

        {employees.length === 0 && (
          <div style={{
            padding: '0.8rem',
            background: 'rgba(198,40,40,0.06)',
            borderRadius: 6,
            border: '1px solid rgba(198,40,40,0.2)',
            fontSize: '0.78rem',
            color: '#c62828',
            marginBottom: '1rem'
          }}>
            ⚠️ No employees found. Please add employees first.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setAssignAsset(null)}
            style={{
              padding: '8px 18px', borderRadius: 5,
              border: '1px solid rgba(198,40,40,0.3)',
              background: 'transparent', color: 'var(--red-primary)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={employees.length === 0}
            style={{
              padding: '8px 18px', borderRadius: 5, border: 'none',
              background: employees.length === 0 ? '#ccc' : '#1565c0',
              color: '#fff', cursor: employees.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem', fontWeight: 600
            }}
          >
            👤 Assign to Employee
          </button>
        </div>
      </form>
    )
  }

  const AssetForm = ({existing}:{existing?:any}) => {
    const [d, setD] = useState(existing || {
      asset_code:'', name:'', category:'', brand:'', model:'',
      serial_no:'', purchase_date:'', warranty_until:'',
      location:'', notes:'', status:'Available'
    })

    const submit = async (e:React.FormEvent) => {
      e.preventDefault()
      try {
        if (existing) {
          await api.patch(`/assets/${existing._id || existing.id}`, d)
          setMsg({ type:'success', text:'Asset updated!' })
          setEditAsset(null)
        } else {
          await api.post('/assets', d)
          setMsg({ type:'success', text:'Asset added!' })
          setShowAdd(false)
        }
        load()
      } catch (err:any) {
        setMsg({ type:'error', text: err.response?.data?.error || 'Failed' })
      }
    }

    return (
      <form onSubmit={submit} style={{maxWidth:600}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Asset Code *">
            <input required style={inp} value={d.asset_code} onChange={e=>setD({...d,asset_code:e.target.value})} placeholder="ASSET-001"/>
          </FG>
          <FG label="Category *">
            <select required style={inp} value={d.category} onChange={e=>setD({...d,category:e.target.value})}>
              <option value="">— Select —</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </FG>
        </div>
        <FG label="Asset Name *">
          <input required style={inp} value={d.name} onChange={e=>setD({...d,name:e.target.value})} placeholder="Dell Laptop"/>
        </FG>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Brand"><input style={inp} value={d.brand} onChange={e=>setD({...d,brand:e.target.value})} placeholder="Dell"/></FG>
          <FG label="Model"><input style={inp} value={d.model} onChange={e=>setD({...d,model:e.target.value})} placeholder="Latitude 5520"/></FG>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Serial No"><input style={inp} value={d.serial_no} onChange={e=>setD({...d,serial_no:e.target.value})}/></FG>
          <FG label="Location"><input style={inp} value={d.location} onChange={e=>setD({...d,location:e.target.value})} placeholder="Office Floor 2"/></FG>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <FG label="Purchase Date"><input type="date" style={inp} value={d.purchase_date} onChange={e=>setD({...d,purchase_date:e.target.value})}/></FG>
          <FG label="Warranty Until"><input type="date" style={inp} value={d.warranty_until} onChange={e=>setD({...d,warranty_until:e.target.value})}/></FG>
        </div>
        <FG label="Status">
          <select style={inp} value={d.status} onChange={e=>setD({...d,status:e.target.value})}>
            {['Available','Assigned','Under Repair','Damaged','Retired'].map(s=><option key={s}>{s}</option>)}
          </select>
        </FG>
        <FG label="Notes">
          <textarea style={{...inp, minHeight:60, resize:'vertical' as const}} value={d.notes} onChange={e=>setD({...d,notes:e.target.value})}/>
        </FG>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button type="button" onClick={()=>{setShowAdd(false);setEditAsset(null)}} style={{padding:'8px 18px',borderRadius:5,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
          <button type="submit" style={{padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
            💾 {existing ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </form>
    )
  }

  const TH = ({c}:{c:string}) => (
    <th style={{fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',padding:'10px 1.2rem',textAlign:'left',borderBottom:'1px solid var(--border)',background:'rgba(198,40,40,0.04)',whiteSpace:'nowrap'}}>{c}</th>
  )

  const statusColor: Record<string,string> = {
    Available:'#2e7d32', Assigned:'#1565c0',
    'Under Repair':'#e65100', Damaged:'#c62828', Retired:'#757575'
  }

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="ASSETS" title="Asset Management" subtitle="Track, assign and manage all company IT assets"/>
      {msg && <Alert type={msg.type} message={msg.text}/>}

      {/* Stats Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.8rem'}}>
        <StatCard label="Total Assets"    value={stats?.total     ?? 0} sub="All inventory"    color="var(--red-primary)"/>
        <StatCard label="Available"       value={stats?.available ?? 0} sub="Ready to assign"  color="var(--green)"/>
        <StatCard label="Assigned"        value={stats?.assigned  ?? 0} sub="With employees"   color="#1565c0"/>
        <StatCard label="Repair/Damaged"  value={stats?.repair    ?? 0} sub="Needs attention"  color="var(--orange)"/>
      </div>

      {/* Filter + Add Button */}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:13}}>🔍</span>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search assets..."
            style={{padding:'8px 12px 8px 32px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:'0.84rem'}}
          />
        </div>
        {['','Available','Assigned','Under Repair','Damaged'].map(s=>(
          <button key={s||'all'} onClick={()=>setStatusF(s)} style={{
            background: statusF===s ? 'var(--red-glow)' : 'var(--bg-card)',
            color:      statusF===s ? 'var(--red-primary)' : 'var(--text-sub)',
            border:    `1px solid ${statusF===s?'var(--red-primary)':'var(--border)'}`,
            fontSize:'0.73rem', padding:'5px 12px', borderRadius:20, cursor:'pointer'
          }}>{s||'All'}</button>
        ))}
        <button onClick={()=>setShowAdd(true)} style={{padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
          ➕ Add New Asset
        </button>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)'}}>
          <span style={{fontSize:'0.87rem',fontWeight:600}}>Assets ({assets?.length ?? 0})</span>
        </div>
        <div style={{overflowX:'auto'}}>
          {loading
            ? <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>
            : <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  {/* ✅ Added "Assigned To" column */}
                  <tr>
                    <TH c="Code"/>
                    <TH c="Asset Name"/>
                    <TH c="Category"/>
                    <TH c="Brand/Model"/>
                    <TH c="Status"/>
                    <TH c="Assigned To"/>
                    <TH c="Warranty"/>
                    <TH c="Actions"/>
                  </tr>
                </thead>
                <tbody>
                  {(assets?.length ?? 0) === 0
                    ? <tr><td colSpan={8} style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No assets found.</td></tr>
                    : assets.map((a:any) => (
                      <tr key={a._id || a.id} style={{borderBottom:'1px solid var(--border-mid)'}}>
                        <td style={{padding:'12px 1.2rem',fontFamily:'IBM Plex Mono',color:'var(--red-primary)',fontSize:'0.77rem'}}>{a.asset_code}</td>
                        <td style={{padding:'12px 1.2rem',fontSize:'0.83rem',fontWeight:500,color:'var(--text-main)'}}>{a.name}</td>
                        <td style={{padding:'12px 1.2rem',fontSize:'0.8rem',color:'var(--text-sub)'}}>{a.category}</td>
                        <td style={{padding:'12px 1.2rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{[a.brand,a.model].filter(Boolean).join(' / ')||'—'}</td>
                        <td style={{padding:'12px 1.2rem'}}>
                          <span style={{
                            fontSize:'0.73rem', fontWeight:600, padding:'3px 9px', borderRadius:12,
                            color: statusColor[a.status] || 'var(--text-muted)',
                            background: `${statusColor[a.status] || '#888'}18`
                          }}>{a.status}</span>
                        </td>
                        {/* ✅ NEW: Assigned To column */}
                        <td style={{padding:'12px 1.2rem',fontSize:'0.78rem',color:'var(--text-sub)'}}>
                          {a.assigned_to_name
                            ? (
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{
                                  width:22, height:22, borderRadius:'50%',
                                  background:'#1565c0', color:'#fff',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:'0.6rem', fontWeight:700
                                }}>
                                  {a.assigned_to_name.charAt(0).toUpperCase()}
                                </span>
                                <span style={{fontWeight:500}}>{a.assigned_to_name}</span>
                              </div>
                            )
                            : <span style={{color:'var(--text-muted)'}}>—</span>
                          }
                        </td>
                        <td style={{padding:'12px 1.2rem',fontSize:'0.75rem',color:a.warranty_until&&new Date(a.warranty_until)<new Date()?'#c62828':'var(--text-muted)'}}>
                          {a.warranty_until ? new Date(a.warranty_until).toLocaleDateString('en-GB') : '—'}
                        </td>
                        {/* ✅ UPDATED: Actions with Assign/Unassign buttons */}
                        <td style={{padding:'12px 1.2rem'}}>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {/* Assign button — only for Available assets */}
                            {a.status === 'Available' && (
                              <button
                                onClick={() => setAssignAsset(a)}
                                style={{
                                  padding:'3px 8px', borderRadius:5, border:'none',
                                  background:'#1565c0', color:'#fff',
                                  cursor:'pointer', fontSize:'0.68rem', fontWeight:600
                                }}
                              >
                                👤 Assign
                              </button>
                            )}
                            {/* Unassign button — only for Assigned assets */}
                            {a.status === 'Assigned' && (
                              <button
                                onClick={() => handleUnassign(a._id || a.id)}
                                style={{
                                  padding:'3px 8px', borderRadius:5,
                                  border:'1px solid #e65100',
                                  background:'rgba(230,81,0,0.08)', color:'#e65100',
                                  cursor:'pointer', fontSize:'0.68rem', fontWeight:600
                                }}
                              >
                                🔓 Unassign
                              </button>
                            )}
                            <button
                              onClick={() => setEditAsset(a)}
                              style={{
                                padding:'3px 8px', borderRadius:5, border:'none',
                                background:'var(--red-primary)', color:'#fff',
                                cursor:'pointer', fontSize:'0.68rem', fontWeight:600
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(a._id || a.id)}
                              style={{
                                padding:'3px 8px', borderRadius:5,
                                border:'1px solid rgba(198,40,40,0.25)',
                                background:'rgba(198,40,40,0.08)', color:'#c62828',
                                cursor:'pointer', fontSize:'0.68rem', fontWeight:600
                              }}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
          }
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add New Asset">
        <AssetForm/>
      </Modal>

      {/* Edit Modal */}
      {editAsset && (
        <Modal open={true} onClose={() => setEditAsset(null)} title="✏️ Edit Asset">
          <AssetForm existing={editAsset}/>
        </Modal>
      )}

      {/* ✅ NEW: Assign Modal */}
      {assignAsset && (
        <Modal open={true} onClose={() => setAssignAsset(null)} title="👤 Assign Asset to Employee">
          <AssignForm asset={assignAsset}/>
        </Modal>
      )}
    </AppLayout>
  )
}