'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert, Modal, StatCard } from '@/components/ui'
import api from '@/lib/api'
import { Search, AlertTriangle, UserPlus, Save, Plus, Pencil, Unlock, Trash2, Boxes, ChevronDown, ChevronUp, X } from 'lucide-react'

const CATS = ['Laptop','CPU','Monitor','Keyboard','Mouse','Printer','Phone','Server','Network Device','Tablet','Router','UPS','Cable','Other']

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

const TH = ({c}:{c:string}) => (
  <th style={{fontSize:'0.67rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',padding:'10px 1.2rem',textAlign:'left',borderBottom:'1px solid var(--border)',background:'rgba(198,40,40,0.04)',whiteSpace:'nowrap'}}>{c}</th>
)

const statusColor: Record<string,string> = {
  Available:'#2e7d32', Assigned:'#1565c0',
  'Under Repair':'#e65100', Damaged:'#c62828', Retired:'#757575'
}

const AssignForm = ({ asset, employees, onAssign, onCancel, setMsg }: any) => {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) { setMsg({ type: 'error', text: 'Please select an employee' }); return }
    onAssign(asset._id || asset.id, selectedEmployee)
  }
  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 500 }}>
      <div style={{ padding: '1rem', background: 'rgba(198,40,40,0.04)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Asset Code</span><p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--red-primary)', margin: '2px 0 0' }}>{asset.asset_code}</p></div>
          <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Asset Name</span><p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '2px 0 0' }}>{asset.name}</p></div>
          <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Category</span><p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: '2px 0 0' }}>{asset.category}</p></div>
          <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status</span><p style={{ fontSize: '0.85rem', color: statusColor[asset.status] || 'var(--text-muted)', fontWeight: 600, margin: '2px 0 0' }}>{asset.status}</p></div>
        </div>
      </div>
      <FG label="Select Employee *">
        <select required style={inp} value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
          <option value="">— Choose an Employee —</option>
          {employees.map((emp: any) => (
            <option key={emp._id || emp.id} value={emp._id || emp.id}>{emp.name || emp.full_name} {emp.email ? `(${emp.email})` : ''} {emp.department ? `- ${emp.department}` : ''}</option>
          ))}
        </select>
      </FG>
      {employees.length === 0 && (
        <div style={{ padding: '0.8rem', background: 'rgba(198,40,40,0.06)', borderRadius: 6, border: '1px solid rgba(198,40,40,0.2)', fontSize: '0.78rem', color: '#c62828', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15}/> No employees found. Please add employees first.
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 5, border: '1px solid rgba(198,40,40,0.3)', background: 'transparent', color: 'var(--red-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Cancel</button>
        <button type="submit" disabled={employees.length === 0} style={{ display:'flex', alignItems:'center', gap:6, padding: '8px 18px', borderRadius: 5, border: 'none', background: employees.length === 0 ? '#ccc' : '#1565c0', color: '#fff', cursor: employees.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}><UserPlus size={15}/> Assign to Employee</button>
      </div>
    </form>
  )
}

const ReplaceAssetCodeForm = ({ onSuccess, onCancel, setMsg }: any) => {
  const [find, setFind] = useState("")
  const [replace, setReplace] = useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!find.trim() || !replace.trim()) { setMsg({ type: 'error', text: 'Please fill both Find and Replace fields.' }); return }
    try {
      await api.patch("/assets/find-replace", { find: find.trim(), replace: replace.trim() })
      setMsg({ type: "success", text: "Asset Codes updated successfully." })
      onSuccess(); onCancel()
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.error || "Replace failed." }) }
  }
  return (
    <form onSubmit={submit}>
      <FG label="Find Category">
        <select style={inp} value={find} onChange={(e) => setFind(e.target.value)}><option value="">— Select Category —</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
      </FG>
      <FG label="Replace With Category">
        <select style={inp} value={replace} onChange={(e) => setReplace(e.target.value)}><option value="">— Select Category —</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
      </FG>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15, gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 18px", border: "1px solid rgba(198,40,40,0.3)", borderRadius: 5, background: 'transparent', color: 'var(--red-primary)', cursor: "pointer", fontSize: '0.8rem', fontWeight: 600 }}>Cancel</button>
        <button type="submit" style={{ padding: "8px 18px", border: "none", borderRadius: 5, background: "#1565c0", color: "#fff", cursor: "pointer", fontSize: '0.8rem', fontWeight: 600 }}>Replace All</button>
      </div>
    </form>
  )
}

// ✅ NEW: Bulk Asset Form — one person ku multiple asset add panna
const AssetForm = ({ existing, onSuccess, onCancel, setMsg, employees }: any) => {
  // Edit mode = single asset
  // Add mode = bulk multiple assets
  
  const [shared, setShared] = useState({
    category: existing?.category || '',
    brand: existing?.brand || '',
    model: existing?.model || '',
    purchase_date: existing?.purchase_date ? existing.purchase_date.split('T')[0] : '',
    warranty_until: existing?.warranty_until ? existing.warranty_until.split('T')[0] : '',
    location: existing?.location || '',
    notes: existing?.notes || '',
    status: existing?.status || 'Available',
    assigned_to: ''
  })

  const [rows, setRows] = useState<any[]>(
    existing 
      ? [{ asset_code: existing.asset_code || '', name: existing.name || '', serial_no: existing.serial_no || '' }]
      : [{ asset_code: '', name: '', serial_no: '' }]
  )

  const updateShared = (field: string, value: string) => {
    setShared(prev => ({ ...prev, [field]: value }))
  }

  const updateRow = (idx: number, field: string, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const addRow = () => {
    setRows(prev => [...prev, { asset_code: '', name: '', serial_no: '' }])
  }

  const removeRow = (idx: number) => {
    if (rows.length === 1) return
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Date validation
    if (shared.purchase_date && shared.warranty_until && new Date(shared.purchase_date) > new Date(shared.warranty_until)) {
      setMsg({ type: 'error', text: 'Warranty date must be after purchase date' })
      return
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].asset_code.trim() || !rows[i].name.trim()) {
        setMsg({ type: 'error', text: `Row ${i + 1}: Asset Code and Name are required` })
        return
      }
    }

    try {
      if (existing) {
        // Single edit
        const payload = { ...shared, ...rows[0] }
        await api.patch(`/assets/${existing._id || existing.id}`, payload)
        setMsg({ type: 'success', text: 'Asset updated!' })
      } else {
        // ✅ BULK ADD: Create multiple assets
        const payloads = rows.map(row => ({
          ...shared,
          ...row,
          assigned_to: shared.assigned_to || undefined
        }))
        
        // If backend has bulk endpoint use this, else individual calls
        await Promise.all(payloads.map(p => api.post('/assets', p)))
        
        const empName = shared.assigned_to 
          ? employees.find((e: any) => (e._id || e.id) === shared.assigned_to)?.name || 'employee'
          : null
        
        setMsg({ 
          type: 'success', 
          text: `${rows.length} asset(s) added${empName ? ` and assigned to ${empName}` : ''}!` 
        })
      }
      
      onCancel()
      onSuccess()
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save assets' })
    }
  }

  return (
    <form onSubmit={submit}>
      {!existing && (
        <>
          {/* ✅ NEW: Assign To dropdown at top for bulk add */}
          <FG label="Assign To (Optional)">
            <select style={inp} value={shared.assigned_to} onChange={e => updateShared('assigned_to', e.target.value)}>
              <option value="">— Select Employee (Optional) —</option>
              {employees.map((emp: any) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.name || emp.full_name} {emp.department ? `- ${emp.department}` : ''}
                </option>
              ))}
            </select>
          </FG>
          <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}></div>
        </>
      )}

      {/* Shared Fields */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Category *">
          <select required style={inp} value={shared.category} onChange={e=>updateShared('category',e.target.value)}>
            <option value="">— Select —</option>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </FG>
        <FG label="Status">
          <select style={inp} value={shared.status} onChange={e=>updateShared('status',e.target.value)}>
            {['Available','Assigned','Under Repair','Damaged','Retired'].map(s=><option key={s}>{s}</option>)}
          </select>
        </FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Brand"><input style={inp} value={shared.brand} onChange={e=>updateShared('brand',e.target.value)} placeholder="Dell"/></FG>
        <FG label="Model"><input style={inp} value={shared.model} onChange={e=>updateShared('model',e.target.value)} placeholder="Latitude 5520"/></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        <FG label="Purchase Date"><input type="date" style={inp} value={shared.purchase_date} onChange={e=>updateShared('purchase_date',e.target.value)}/></FG>
        <FG label="Warranty Until"><input type="date" style={inp} value={shared.warranty_until} onChange={e=>updateShared('warranty_until',e.target.value)}/></FG>
      </div>
      <FG label="Location"><input style={inp} value={shared.location} onChange={e=>updateShared('location',e.target.value)} placeholder="Office Floor 2"/></FG>
      <FG label="Notes"><textarea style={{...inp, minHeight:60, resize:'vertical' as const}} value={shared.notes} onChange={e=>updateShared('notes',e.target.value)}/></FG>

      <div style={{ borderBottom: '1px solid var(--border)', margin: '1rem 0' }}></div>

      {/* ✅ NEW: Dynamic Asset Rows */}
      <div style={{ marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {existing ? 'Asset Details' : `Assets to Add (${rows.length})`}
        </span>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} style={{ 
          display: 'grid', 
          gridTemplateColumns: existing ? '1fr 1fr 1fr' : '1fr 1fr 1fr auto', 
          gap: '0.75rem', 
          alignItems: 'end',
          marginBottom: '0.75rem',
          padding: '0.75rem',
          background: 'rgba(198,40,40,0.02)',
          borderRadius: 6,
          border: '1px solid var(--border)'
        }}>
          <div>
            <label style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',display:'block',marginBottom:4}}>Asset Code *</label>
            <input required style={{...inp, marginBottom:0}} value={row.asset_code} onChange={e=>updateRow(idx,'asset_code',e.target.value)} placeholder="ASSET-001"/>
          </div>
          <div>
            <label style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',display:'block',marginBottom:4}}>Asset Name *</label>
            <input required style={{...inp, marginBottom:0}} value={row.name} onChange={e=>updateRow(idx,'name',e.target.value)} placeholder="Dell Laptop"/>
          </div>
          <div>
            <label style={{fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',display:'block',marginBottom:4}}>Serial No</label>
            <input style={{...inp, marginBottom:0}} value={row.serial_no} onChange={e=>updateRow(idx,'serial_no',e.target.value)}/>
          </div>
          {!existing && rows.length > 1 && (
            <button type="button" onClick={() => removeRow(idx)} style={{
              padding: '8px', borderRadius: 5, border: '1px solid rgba(198,40,40,0.3)',
              background: 'transparent', color: '#c62828', cursor: 'pointer', height: 36
            }}>
              <X size={14}/>
            </button>
          )}
        </div>
      ))}

      {!existing && (
        <button type="button" onClick={addRow} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 5, border: '1px dashed var(--border)',
          background: 'transparent', color: 'var(--red-primary)',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.2rem'
        }}>
          <Plus size={15}/> Add Another Asset
        </button>
      )}

      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <button type="button" onClick={onCancel} style={{padding:'8px 18px',borderRadius:5,border:'1px solid rgba(198,40,40,0.3)',background:'transparent',color:'var(--red-primary)',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>Cancel</button>
        <button type="submit" style={{display:'flex', alignItems:'center', gap:6, padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}>
          <Save size={15}/> {existing ? 'Save Changes' : `Add ${rows.length} Asset${rows.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  )
}

export default function AdminAssets() {
  const [assets, setAssets] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total:0, available:0, assigned:0, repair:0 })
  const [msg, setMsg] = useState<{type:'success'|'error',text:string}|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editAsset, setEditAsset] = useState<any>(null)
  const [assignAsset, setAssignAsset] = useState<any>(null)
  const [statusF, setStatusF] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [unassignConfirm, setUnassignConfirm] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusF) params.status = statusF
      if (q) params.q = q
      const { data } = await api.get('/assets', { params })
      setAssets(data.assets || [])
      setStats(data.stats || { total:0, available:0, assigned:0, repair:0 })
    } catch (e:any) {
      setMsg({ type:'error', text: e.response?.data?.error || 'Failed to load assets' })
      setAssets([])
    } finally { setLoading(false) }
  }

  const loadEmployees = async () => {
    try {
      const { data } = await api.get('/employees')
      setEmployees(data.employees || data || [])
    } catch (e:any) { console.error('Failed to load employees', e); setEmployees([]) }
  }

  useEffect(() => { load() }, [statusF, q])
  useEffect(() => { loadEmployees() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    try { await api.delete(`/assets/${id}`); setMsg({ type:'success', text:'Asset deleted.' }); load() }
    catch (e:any) { setMsg({ type:'error', text: e.response?.data?.error || 'Delete failed' }) }
  }

  const handleAssign = async (assetId: string, employeeId: string) => {
    try {
      await api.patch(`/assets/${assetId}/assign`, { employee_id: employeeId })
      setMsg({ type:'success', text:'Asset assigned successfully!' })
      setAssignAsset(null); load()
    } catch (e:any) { setMsg({ type:'error', text: e.response?.data?.error || 'Assignment failed' }) }
  }

  const handleUnassign = async (assetId: string) => {
  try {
    await api.patch(`/assets/${assetId}/unassign`)
    setMsg({ type:'success', text:'Asset unassigned successfully!' })
    load()
  } catch (e:any) {
    setMsg({ type:'error', text: e.response?.data?.error || 'Unassign failed' })
  }
}

  const isWarrantyExpired = (dateStr: string | undefined) => {
    if (!dateStr) return false
    const today = new Date(); today.setHours(0,0,0,0)
    const warranty = new Date(dateStr); warranty.setHours(0,0,0,0)
    return warranty < today
  }

  const groupedAssets = assets.reduce((acc: Record<string, any[]>, asset: any) => {
    const cat = asset.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(asset)
    return acc
  }, {})

  const categories = Object.keys(groupedAssets).sort()

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const expandAll = () => setExpandedCats(new Set(categories))
  const collapseAll = () => setExpandedCats(new Set())

  return (
    <AppLayout role="admin">
      <PageHeader breadcrumb="ASSETS" title="Asset Management" subtitle="Track, assign and manage all company IT assets"/>
      {msg && <Alert type={msg.type} message={msg.text}/>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.8rem'}}>
        <StatCard label="Total Assets" value={stats?.total ?? 0} sub="All inventory" color="var(--red-primary)"/>
        <StatCard label="Available" value={stats?.available ?? 0} sub="Ready to assign" color="var(--green)"/>
        <StatCard label="Assigned" value={stats?.assigned ?? 0} sub="With employees" color="#1565c0"/>
        <StatCard label="Repair/Damaged" value={stats?.repair ?? 0} sub="Needs attention" color="var(--orange)"/>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative'}}>
          <Search size={14} color="var(--text-muted)" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Search assets..." style={{padding:'8px 12px 8px 32px',borderRadius:5,border:'1px solid var(--border)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:'0.84rem'}}/>
        </div>
        {['','Available','Assigned','Under Repair','Damaged','Retired'].map(s=>(
          <button key={s||'all'} onClick={()=>setStatusF(s)} style={{ background: statusF===s ? 'var(--red-glow)' : 'var(--bg-card)', color: statusF===s ? 'var(--red-primary)' : 'var(--text-sub)', border: `1px solid ${statusF===s?'var(--red-primary)':'var(--border)'}`, fontSize:'0.73rem', padding:'5px 12px', borderRadius:20, cursor:'pointer' }}>{s||'All'}</button>
        ))}
        <button onClick={() => setShowReplace(true)} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-sub)', fontSize:'0.73rem', cursor:'pointer' }}>Find & Replace</button>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex', alignItems:'center', gap:6, padding:'8px 18px',borderRadius:5,border:'none',background:'var(--red-primary)',color:'#fff',cursor:'pointer',fontSize:'0.8rem',fontWeight:600}}><Plus size={15}/> Add New Asset</button>
      </div>

      <div className="card">
        <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',background:'var(--bg-mid)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span style={{fontSize:'0.87rem',fontWeight:600}}>Assets ({assets?.length ?? 0})</span>
          <div style={{display:'flex', gap:8}}>
            <button onClick={expandAll} style={{padding:'4px 10px', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-sub)', fontSize:'0.7rem', cursor:'pointer'}}>Expand All</button>
            <button onClick={collapseAll} style={{padding:'4px 10px', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-sub)', fontSize:'0.7rem', cursor:'pointer'}}>Collapse All</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          {loading
            ? <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>
            : (assets?.length ?? 0) === 0
              ? <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No assets found.</div>
              : (
                <div>
                  {categories.map(cat => {
                    const isExpanded = expandedCats.has(cat)
                    const catAssets = groupedAssets[cat]
                    return (
                      <div key={cat} style={{borderBottom:'1px solid var(--border-mid)'}}>
                        <div 
                          onClick={() => toggleCat(cat)}
                          style={{
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'space-between',
                            padding:'12px 1.4rem',
                            background:'rgba(198,40,40,0.04)',
                            cursor:'pointer',
                            transition:'background 0.15s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,40,40,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(198,40,40,0.04)')}
                        >
                          <span style={{display:'flex', alignItems:'center', gap:10}}>
                            <Boxes size={16} color="var(--red-primary)"/>
                            <span style={{fontSize:'0.82rem', fontWeight:700, color:'var(--text-main)', textTransform:'uppercase', letterSpacing:'0.05em'}}>{cat}</span>
                            <span style={{fontSize:'0.65rem', color:'var(--text-muted)', background:'var(--bg-card)', padding:'2px 8px', borderRadius:10, border:'1px solid var(--border)'}}>{catAssets.length} asset{catAssets.length > 1 ? 's' : ''}</span>
                          </span>
                          {isExpanded ? <ChevronUp size={16} color="var(--text-muted)"/> : <ChevronDown size={16} color="var(--text-muted)"/>}
                        </div>

                        {isExpanded && (
                          <table style={{width:'100%',borderCollapse:'collapse'}}>
                            <thead>
                              <tr><TH c="Code"/><TH c="Asset Name"/><TH c="Category"/><TH c="Brand/Model"/><TH c="Status"/><TH c="Assigned To"/><TH c="Warranty"/><TH c="Actions"/></tr>
                            </thead>
                            <tbody>
                              {catAssets.map((a:any) => (
                                <tr key={a._id || a.id} style={{borderBottom:'1px solid var(--border-mid)'}}>
                                  <td style={{padding:'12px 1.2rem',fontFamily:'IBM Plex Mono',color:'var(--red-primary)',fontSize:'0.77rem',whiteSpace:'nowrap'}}>{a.asset_code}</td>
                                  <td style={{padding:'12px 1.2rem',fontSize:'0.83rem',fontWeight:500,color:'var(--text-main)'}}>{a.name}</td>
                                  <td style={{padding:'12px 1.2rem',fontSize:'0.8rem',color:'var(--text-sub)'}}>{a.category}</td>
                                  <td style={{padding:'12px 1.2rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{[a.brand,a.model].filter(Boolean).join(' / ')||'—'}</td>
                                  <td style={{padding:'12px 1.2rem'}}>
                                    <span style={{ fontSize:'0.73rem', fontWeight:600, padding:'3px 9px', borderRadius:12, color: statusColor[a.status] || 'var(--text-muted)', background: `${statusColor[a.status] || '#888'}18` }}>{a.status}</span>
                                  </td>
                                  <td style={{padding:'12px 1.2rem',fontSize:'0.78rem',color:'var(--text-sub)'}}>
                                    {a.assigned_to_name ? (
                                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                                        <span style={{ width:22, height:22, borderRadius:'50%', background:'#1565c0', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700 }}>{a.assigned_to_name.charAt(0).toUpperCase()}</span>
                                        <span style={{fontWeight:500}}>{a.assigned_to_name}</span>
                                      </div>
                                    ) : <span style={{color:'var(--text-muted)'}}>—</span>}
                                  </td>
                                  <td style={{padding:'12px 1.2rem',fontSize:'0.75rem',color:isWarrantyExpired(a.warranty_until)?'#c62828':'var(--text-muted)'}}>
                                    {a.warranty_until ? new Date(a.warranty_until).toLocaleDateString('en-GB') : '—'}
                                  </td>
                                  <td style={{padding:'12px 1.2rem'}}>
                                    <div style={{display:'flex',gap:4,flexWrap:'nowrap'}}>
                                      {a.status === 'Available' && (
                                        <button onClick={() => setAssignAsset(a)} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 6px', borderRadius:5, border:'none', background:'#1565c0', color:'#fff', cursor:'pointer', fontSize:'0.65rem', fontWeight:600 }}><UserPlus size={12}/> Assign</button>
                                      )}
                                      {a.status === 'Assigned' && (
                                        <button onClick={() => setUnassignConfirm(a._id || a.id)} style={{
  display:'flex', alignItems:'center', gap:4,
  padding:'3px 8px', borderRadius:5,
  border:'1px solid #e65100',
  background:'rgba(230,81,0,0.08)', color:'#e65100',
  cursor:'pointer', fontSize:'0.68rem', fontWeight:600
}}>
  <Unlock size={12}/> Unassign
</button>
)}
                                      <button onClick={() => setEditAsset(a)} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 6px', borderRadius:5, border:'none', background:'var(--red-primary)', color:'#fff', cursor:'pointer', fontSize:'0.65rem', fontWeight:600 }}><Pencil size={12}/> Edit</button>
                                      <button onClick={() => handleDelete(a._id || a.id)} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 6px', borderRadius:5, border:'1px solid rgba(198,40,40,0.25)', background:'rgba(198,40,40,0.08)', color:'#c62828', cursor:'pointer', fontSize:'0.65rem', fontWeight:600 }}><Trash2 size={12}/> Del</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
          }
        </div>
      </div>

      <Modal open={showReplace} onClose={() => setShowReplace(false)} title="Find & Replace Category">
        <ReplaceAssetCodeForm onSuccess={load} onCancel={() => setShowReplace(false)} setMsg={setMsg}/>
      </Modal>
      
      {/* ✅ UPDATED: Pass employees to AssetForm for bulk assign */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Asset">
        <AssetForm onSuccess={load} onCancel={() => setShowAdd(false)} setMsg={setMsg} employees={employees}/>
      </Modal>
      
      {editAsset && (
        <Modal open={true} onClose={() => setEditAsset(null)} title="Edit Asset">
          <AssetForm existing={editAsset} onSuccess={load} onCancel={() => setEditAsset(null)} setMsg={setMsg} employees={employees}/>
        </Modal>
      )}
      
      {assignAsset && (
        <Modal open={true} onClose={() => setAssignAsset(null)} title="Assign Asset to Employee">
          <AssignForm asset={assignAsset} employees={employees} onAssign={handleAssign} onCancel={() => setAssignAsset(null)} setMsg={setMsg}/>
        </Modal>
      )}

{/* Unassign Confirm Modal */}
{unassignConfirm && (
  <Modal open={true} onClose={() => setUnassignConfirm(null)} title="Confirm Unassign">
    <div style={{ padding: '1rem', maxWidth: 400 }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.2rem' }}>
        Are you sure you want to unassign this asset from the employee?
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setUnassignConfirm(null)}
          style={{ padding:'8px 18px', borderRadius:5, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}
        >
          Cancel
        </button>
        <button 
          onClick={() => { handleUnassign(unassignConfirm); setUnassignConfirm(null); }}
          style={{ padding:'8px 18px', borderRadius:5, border:'none', background:'#e65100', color:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}
        >
          Unassign
        </button>
      </div>
    </div>
  </Modal>
)}

    </AppLayout>
  )
}