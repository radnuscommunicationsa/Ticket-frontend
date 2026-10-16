'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import AppLayout from '@/components/AppLayout'
import AssetHistoryModal from '@/components/AssetHistoryModal'
import * as XLSX from 'xlsx'
import {
  PageHeader,
  Alert,
  Modal,
  StatCard,
} from '@/components/ui'
import api from '@/lib/api'

import {
  Search,
  AlertTriangle,
  UserPlus,
  Save,
  Plus,
  Pencil,
  Unlock,
  Trash2,
  Boxes,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  History as HistoryIcon,
} from 'lucide-react'

/* =========================================================
   CONSTANTS
========================================================= */

const CATS = [
  'Laptop',
  'CPU',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Printer',
  'Phone',
  'Server',
  'Network Device',
  'Tablet',
  'Router',
  'UPS',
  'Cable',
  'SIM Card',
  'Other',
]

const SIM_PROVIDERS = ['Jio', 'Airtel', 'Vi', 'BSNL', 'Other']

// Your own known series (first 4 digits -> provider). Fill with real data.
const SIM_SERIES: Record<string, string> = {}

// true when the screen is phone-sized
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return mobile
}

// Sorts ASSET-2 before ASSET-10
const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

// Reasons shown when unassigning an asset (saved in asset history)
const UNASSIGN_REASONS = [
  'Employee resigned',
  'Replacement',
  'Sent for repair',
  'Transferred to another employee',
  'Other',
]

type SpecField = {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'select' | 'date'
  options?: string[]
  required?: boolean
  digits?: number // exact number of digits
  perRow?: boolean // unique per device (IMEI, MAC, IP)
}

const RAM_OPTIONS = ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '32 GB', '64 GB']
const STORAGE_OPTIONS = ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB']

const COMPUTER_FIELDS: SpecField[] = [
  { key: 'processor', label: 'Processor', placeholder: 'Intel i5 12th Gen' },
  { key: 'ram', label: 'RAM', type: 'select', options: RAM_OPTIONS },
  { key: 'storage', label: 'Storage', type: 'select', options: STORAGE_OPTIONS },
  { key: 'os', label: 'OS', placeholder: 'Windows 11 Pro' },
  { key: 'mac', label: 'MAC Address', placeholder: 'AA:BB:CC:DD:EE:FF', perRow: true },
]

const NETWORK_FIELDS: SpecField[] = [
  { key: 'ip', label: 'IP Address', placeholder: '192.168.1.1', perRow: true },
  { key: 'mac', label: 'MAC Address', placeholder: 'AA:BB:CC:DD:EE:FF', perRow: true },
  { key: 'ports', label: 'Ports', placeholder: '8 / 24' },
]

const CATEGORY_FIELDS: Record<string, SpecField[]> = {
  Laptop: COMPUTER_FIELDS,
  CPU: COMPUTER_FIELDS,
  Phone: [
    { key: 'imei1', label: 'IMEI 1', placeholder: '15 digits (*#06#)', required: true, digits: 15, perRow: true },
    { key: 'imei2', label: 'IMEI 2', placeholder: '15 digits (optional)', digits: 15, perRow: true },
    { key: 'ram', label: 'RAM', type: 'select', options: RAM_OPTIONS },
    { key: 'storage', label: 'Storage', type: 'select', options: STORAGE_OPTIONS },
    { key: 'phone_number', label: 'Phone Number', placeholder: '98XXXXXXXX', digits: 10, perRow: true },
  ],
  Tablet: [
    { key: 'imei1', label: 'IMEI 1', placeholder: '15 digits', digits: 15, perRow: true },
    { key: 'ram', label: 'RAM', type: 'select', options: RAM_OPTIONS },
    { key: 'storage', label: 'Storage', type: 'select', options: STORAGE_OPTIONS },
  ],
  Monitor: [
    { key: 'screen_size', label: 'Screen Size', placeholder: '24 inch' },
    { key: 'resolution', label: 'Resolution', placeholder: '1920x1080' },
    { key: 'ports', label: 'Ports', placeholder: 'HDMI / VGA' },
  ],
  Printer: [
    { key: 'printer_type', label: 'Printer Type', type: 'select', options: ['Laser', 'Inkjet', 'Dot Matrix', 'Thermal'] },
    { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['USB', 'Wi-Fi', 'LAN', 'USB + Wi-Fi'] },
    { key: 'toner', label: 'Toner / Cartridge Model', placeholder: '12A' },
  ],
  Router: NETWORK_FIELDS,
  'Network Device': NETWORK_FIELDS,
  Server: [
    { key: 'ip', label: 'IP Address', placeholder: '192.168.1.10', perRow: true },
    { key: 'os', label: 'OS', placeholder: 'Ubuntu 22.04' },
    { key: 'ram', label: 'RAM', type: 'select', options: RAM_OPTIONS },
    { key: 'storage', label: 'Storage', type: 'select', options: STORAGE_OPTIONS },
    { key: 'rack', label: 'Rack Location', placeholder: 'Rack 2 / Slot 4' },
  ],
  Keyboard: [{ key: 'conn', label: 'Type', type: 'select', options: ['Wired', 'Wireless'] }],
  Mouse: [{ key: 'conn', label: 'Type', type: 'select', options: ['Wired', 'Wireless'] }],
  UPS: [
    { key: 'capacity', label: 'Capacity', placeholder: '600 VA' },
    { key: 'battery_date', label: 'Battery Changed On', type: 'date' },
  ],
}

const MODEL_PLACEHOLDER: Record<string, string> = {
  Laptop: 'Latitude 5520',
  CPU: 'OptiPlex 3080',
  Phone: 'X3 Pro',
  Tablet: 'Galaxy Tab A8',
  Monitor: 'S2421H',
  Printer: 'LaserJet M141',
  Router: 'Archer C6',
  'Network Device': 'SG350-28',
  Server: 'PowerEdge R740',
  Keyboard: 'K120',
  Mouse: 'M185',
  UPS: 'Back-UPS 600VA',
}

// One-line summary shown in the table
const assetSummary = (a: Asset) => {
  const s = a.specs || {}

  let parts: (string | undefined)[]

  if (a.category === 'SIM Card') {
    parts = [a.sim_provider, a.sim_number]
  } else if (a.category === 'Phone' || a.category === 'Tablet') {
    parts = [a.brand, a.model, s.imei1]
  } else if (['Laptop', 'CPU', 'Server'].includes(a.category || '')) {
    parts = [a.brand, a.model, s.ram, s.storage]
  } else {
    parts = [a.brand, a.model]
  }

  return parts.filter(Boolean).join(' / ') || '—'
}

const BRANDS = [
  'Dell',
  'HP',
  'Lenovo',
  'Apple',
  'Asus',
  'Acer',
  'Samsung',
  'LG',
  'Cisco',
  'TP-Link',
  'Logitech',
  'Canon',
  'Epson',
  'Redmi',
  'Poco',
  'OnePlus',
  'Vivo',
  'Oppo',
  'Realme',
  'Motorola',
  'Nokia',
  'Google',
  'Sony',
  'Huawei',
]

const STATUS_LIST = [
  'Available',
  'Assigned',
  'Under Repair',
  'Damaged',
  'Retired',
]

const STATUS_COLOR: Record<string, string> = {
  Available: '#2e7d32',
  Assigned: '#1565c0',
  'Under Repair': '#e65100',
  Damaged: '#c62828',
  Retired: '#757575',
}

/* =========================================================
   TYPES
========================================================= */

type Message = {
  type: 'success' | 'error'
  text: string
}

type AssetRow = {
  asset_code: string
  name: string
  serial_no: string
  sim_number: string
  specs: Record<string, string>
}

type SharedAsset = {
  category: string
  brand: string
  model: string
  purchase_date: string
  warranty_until: string
  location: string
  notes: string
  status: string
  assigned_to: string
  sim_provider: string
  specs: Record<string, string>
}

type Employee = {
  _id?: string
  id?: string
  name?: string
  full_name?: string
  email?: string
  department?: string
  kind?: 'Employee' | 'Admin'
}

type Asset = {
  _id?: string
  id?: string
  asset_code: string
  name: string
  serial_no?: string
  category?: string
  brand?: string
  model?: string
  purchase_date?: string
  warranty_until?: string
  location?: string
  notes?: string
  status?: string
  assigned_to?: string
  assigned_to_name?: string
  sim_number?: string
  sim_provider?: string
  specs?: Record<string, string>
}

type HistoryItem = {
  action: string
  employee_name?: string
  reason?: string
  done_by?: string
  date: string
}

/* =========================================================
   COMMON STYLES
========================================================= */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
}

const filterStyle: React.CSSProperties = {
  padding: '8px 10px',
  minWidth: 145,
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
}

const smallActionButton: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-sub)',
  cursor: 'pointer',
  fontSize: '0.7rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const valueMainStyle: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  fontWeight: 600,
}

const valueSubStyle: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: '0.78rem',
  color: 'var(--text-sub)',
}

const valueRedStyle: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: '0.8rem',
  color: 'var(--red-primary)',
  fontWeight: 700,
}

const smallLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 5,
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
}

/* =========================================================
   FORM GROUP
========================================================= */

function FormGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        marginBottom: '0.9rem',
      }}
    >
      <label
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

/* =========================================================
   SPEC INPUT
========================================================= */

function SpecInput({
  field,
  value,
  onChange,
}: {
  field: SpecField
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'select') {
    const options = field.options || []
    const list = value && !options.includes(value) ? [value, ...options] : options

    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        <option value="">— Select —</option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      type={field.type === 'date' ? 'date' : 'text'}
      value={value}
      onChange={(e) =>
        onChange(field.digits ? e.target.value.replace(/\D/g, '') : e.target.value)
      }
      placeholder={field.placeholder}
      maxLength={field.digits}
      inputMode={field.digits ? 'numeric' : undefined}
      style={inputStyle}
    />
  )
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({ title }: { title: string }) {
  return (
    <th
      style={{
        fontSize: '0.67rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--text-muted)',
        padding: '10px 1.2rem',
        textAlign: 'left',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(198,40,40,0.04)',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </th>
  )
}

/* =========================================================
   ASSIGN FORM
========================================================= */

function AssignForm({
  asset,
  people,
  onAssign,
  onCancel,
  setMsg,
}: {
  asset: Asset
  people: Employee[]
  onAssign: (assetId: string, employeeId: string) => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [selectedEmployee, setSelectedEmployee] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee) {
      setMsg({ type: 'error', text: 'Please select an employee.' })
      return
    }

    const assetId = asset._id || asset.id

    if (!assetId) {
      setMsg({ type: 'error', text: 'Asset ID not found.' })
      return
    }

    onAssign(assetId, selectedEmployee)
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 520 }}>
      <div
        style={{
          padding: '1rem',
          background: 'rgba(198,40,40,0.04)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          marginBottom: '1.2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.8rem',
          }}
        >
          <div>
            <span style={labelStyle}>Asset Code</span>
            <p style={valueRedStyle}>{asset.asset_code}</p>
          </div>

          <div>
            <span style={labelStyle}>Asset Name</span>
            <p style={valueMainStyle}>{asset.name}</p>
          </div>

          <div>
            <span style={labelStyle}>Category</span>
            <p style={valueSubStyle}>{asset.category || '—'}</p>
          </div>

          <div>
            <span style={labelStyle}>Status</span>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: '0.8rem',
                color:
                  STATUS_COLOR[asset.status || ''] || 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {asset.status || '—'}
            </p>
          </div>
        </div>
      </div>

      <FormGroup label="Select Employee *">
        <select
          required
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Choose an Employee —</option>

          {people.map((employee) => {
            const id = employee._id || employee.id

            return (
              <option key={id} value={id}>
                {employee.kind === 'Admin' ? '[ADMIN] ' : ''}
                {employee.name || employee.full_name || 'Unnamed Employee'}
                {employee.email ? ` (${employee.email})` : ''}
                {employee.department ? ` - ${employee.department}` : ''}
              </option>
            )
          })}
        </select>
      </FormGroup>

      {people.length === 0 && (
        <div
          style={{
            padding: '0.8rem',
            background: 'rgba(198,40,40,0.06)',
            borderRadius: 6,
            border: '1px solid rgba(198,40,40,0.2)',
            fontSize: '0.78rem',
            color: '#c62828',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} />
          No employees or admins found. Please add them first.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          marginTop: '1rem',
        }}
      >
        <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>

        <button
          type="submit"
          disabled={people.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 5,
            border: 'none',
            background: people.length === 0 ? '#aaa' : '#1565c0',
            color: '#fff',
            cursor: people.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <UserPlus size={15} />
          Assign to Employee / Admin
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   FIND & REPLACE
========================================================= */

function ReplaceCategoryForm({
  onSuccess,
  onCancel,
  setMsg,
}: {
  onSuccess: () => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!find || !replace) {
      setMsg({ type: 'error', text: 'Please select both categories.' })
      return
    }

    if (find === replace) {
      setMsg({
        type: 'error',
        text: 'Find and Replace category cannot be same.',
      })
      return
    }

    try {
      setSaving(true)

      await api.patch('/assets/find-replace', { find, replace })

      setMsg({
        type: 'success',
        text: `All "${find}" assets changed to "${replace}".`,
      })

      onSuccess()
      onCancel()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error || 'Category replacement failed.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <FormGroup label="Find Category">
        <select
          required
          value={find}
          onChange={(e) => setFind(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Select Category —</option>

          {CATS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </FormGroup>

      <FormGroup label="Replace With Category">
        <select
          required
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Select Category —</option>

          {CATS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </FormGroup>

      <div
        style={{
          padding: '0.75rem',
          marginTop: 10,
          marginBottom: 15,
          borderRadius: 6,
          background: 'rgba(198,40,40,0.05)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        This will change the category of all matching assets.
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: 5,
            background: saving ? '#aaa' : '#1565c0',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {saving ? 'Replacing...' : 'Replace All'}
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   ASSET FORM
========================================================= */

function AssetForm({
  existing,
  people,
  allAssets,
  onSuccess,
  onCancel,
  setMsg,
}: {
  existing?: Asset | null
  people: Employee[]
  allAssets: Asset[]
  onSuccess: () => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [shared, setShared] = useState<SharedAsset>({
    category: existing?.category || '',
    brand: existing?.brand || '',
    model: existing?.model || '',
    purchase_date: existing?.purchase_date
      ? existing.purchase_date.split('T')[0]
      : '',
    warranty_until: existing?.warranty_until
      ? existing.warranty_until.split('T')[0]
      : '',
    location: existing?.location || '',
    notes: existing?.notes || '',
    status: existing?.status || 'Available',
    assigned_to: '',
    sim_provider: existing?.sim_provider || '',
    specs: { ...(existing?.specs || {}) },
  })

  const [isOtherBrand, setIsOtherBrand] = useState(
    !!existing?.brand && !BRANDS.includes(existing.brand)
  )

  const [customBrand, setCustomBrand] = useState(
    existing?.brand && !BRANDS.includes(existing.brand)
      ? existing.brand
      : ''
  )

  const [rows, setRows] = useState<AssetRow[]>(
    existing
      ? [
          {
            asset_code: existing.asset_code || '',
            name: existing.name || '',
            serial_no: existing.serial_no || '',
            sim_number: existing.sim_number || '',
            specs: { ...(existing.specs || {}) },
          },
        ]
      : [
          {
            asset_code: '',
            name: '',
            serial_no: '',
            sim_number: '',
            specs: {},
          },
        ]
  )

  const [saving, setSaving] = useState(false)

  /* ---------------- SIM helpers ---------------- */

  const isSim = shared.category === 'SIM Card'

  // Find another asset that already uses this SIM number
  const findSim = (num: string) => {
    if (!num) return undefined
    const selfId = existing?._id || existing?.id

    return allAssets.find(
      (a) => a.sim_number === num && (a._id || a.id) !== selfId
    )
  }

  // Guess provider from the first 4 digits using already-saved SIMs
  const detectProvider = (num: string) => {
    if (num.length < 4) return ''
    const prefix = num.slice(0, 4)

    const match = allAssets.find(
      (a) =>
        a.category === 'SIM Card' &&
        a.sim_provider &&
        a.sim_number?.startsWith(prefix)
    )

    return match?.sim_provider || SIM_SERIES[prefix] || ''
  }

  /* ---------------- category specs ---------------- */

  const fields = CATEGORY_FIELDS[shared.category] || []
  const sharedFields = fields.filter((f) => !f.perRow)
  const rowFields = fields.filter((f) => f.perRow)

  const getSpec = (f: SpecField, row: AssetRow) =>
    String((f.perRow ? row.specs[f.key] : shared.specs[f.key]) ?? '').trim()

  const updateSharedSpec = (key: string, value: string) => {
    setShared((prev) => ({
      ...prev,
      specs: { ...prev.specs, [key]: value },
    }))
  }

  const updateRowSpec = (index: number, key: string, value: string) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, specs: { ...row.specs, [key]: value } } : row
      )
    )
  }

  // Only keeps specs that belong to the CURRENT category
  const buildPayload = (row: AssetRow) => {
    const specs: Record<string, string> = {}

    fields.forEach((f) => {
      const v = getSpec(f, row)
      if (v) specs[f.key] = v
    })

    return { ...shared, ...row, specs }
  }

  /* ---------------- state updaters ---------------- */

  const updateShared = (field: keyof SharedAsset, value: string) => {
    setShared((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateRow = (
    index: number,
    field: keyof AssetRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        asset_code: '',
        name: '',
        serial_no: '',
        sim_number: '',
        specs: {},
      },
    ])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return

    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  /* ---------------- submit ---------------- */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shared.category) {
      setMsg({ type: 'error', text: 'Please select a category.' })
      return
    }

    if (
      shared.purchase_date &&
      shared.warranty_until &&
      new Date(shared.purchase_date) > new Date(shared.warranty_until)
    ) {
      setMsg({
        type: 'error',
        text: 'Warranty date must be after purchase date.',
      })
      return
    }

        for (let i = 0; i < rows.length; i++) {
      // SIM: auto-generate the code from the SIM number
      if (
        isSim &&
        !rows[i].asset_code.trim() &&
        /^\d{10}$/.test(rows[i].sim_number.trim())
      ) {
        rows[i].asset_code = `SIM-${rows[i].sim_number.trim()}`
      }

      if (!rows[i].asset_code.trim()) {
        setMsg({
          type: 'error',
          text: `Row ${i + 1}: Asset Code is required.`,
        })
        return
      }

      if (!rows[i].name.trim()) {
        setMsg({
          type: 'error',
          text: `Row ${i + 1}: Asset Name is required.`,
        })
        return
      }

      if (isSim) {
        const num = rows[i].sim_number.trim()

        if (!/^\d{10}$/.test(num)) {
          setMsg({
            type: 'error',
            text: `Row ${i + 1}: SIM Number must be 10 digits.`,
          })
          return
        }

        const dup = findSim(num)

        if (dup) {
          setMsg({
            type: 'error',
            text: `Row ${i + 1}: SIM already exists in ${dup.asset_code} – ${dup.name}.`,
          })
          return
        }

        // Duplicate inside the same form
        const sameInForm = rows.findIndex(
          (r, idx) => idx !== i && r.sim_number.trim() === num
        )

        if (sameInForm !== -1) {
          setMsg({
            type: 'error',
            text: `Row ${i + 1}: SIM number is repeated in row ${sameInForm + 1}.`,
          })
          return
        }
      }

      // Category specific fields (IMEI required, digits etc.)
      for (const f of fields) {
        const v = getSpec(f, rows[i])

        if (f.required && !v) {
          setMsg({
            type: 'error',
            text: `Row ${i + 1}: ${f.label} is required.`,
          })
          return
        }

        if (v && f.digits && !new RegExp(`^\\d{${f.digits}}$`).test(v)) {
          setMsg({
            type: 'error',
            text: `Row ${i + 1}: ${f.label} must be ${f.digits} digits.`,
          })
          return
        }
      }
    }

    try {
      setSaving(true)

      /* =================================================
         EDIT
      ================================================= */

      if (existing) {
        const assetId = existing._id || existing.id

        if (!assetId) {
          throw new Error('Asset ID not found.')
        }

        const payload = buildPayload(rows[0])

        /*
          assigned_to for the EXISTING asset is not changed
          from this form. Assignment for it is handled
          separately via Assign / Unassign buttons.
        */
        delete (payload as any).assigned_to

        await api.patch(`/assets/${assetId}`, payload)

        /*
          Extra rows added via "Add Another Asset" while
          editing are brand-new assets — create them, and
          assign them to the selected employee if chosen.
        */
        const extraRows = rows.slice(1)

        if (extraRows.length > 0) {
                    const sortedExtra = [...extraRows].sort((a, b) =>
            naturalCompare(a.asset_code, b.asset_code)
          )

          for (const row of sortedExtra) {
            await api.post('/assets', {
              ...buildPayload(row),
              status: shared.assigned_to ? 'Assigned' : shared.status,
              assigned_to: shared.assigned_to || undefined,
            })
          }
        }

        setMsg({
          type: 'success',
          text:
            extraRows.length > 0
              ? `Asset updated and ${extraRows.length} new asset(s) added.`
              : 'Asset updated successfully!',
        })
      }

      /* =================================================
         ADD / BULK ADD
      ================================================= */

      else {
                const payloads = rows
          .map((row) => ({
            ...buildPayload(row),
            status: shared.assigned_to ? 'Assigned' : shared.status,
            assigned_to: shared.assigned_to || undefined,
          }))
          .sort((a, b) => naturalCompare(a.asset_code, b.asset_code))

        // one by one, so they are saved in code order
        for (const payload of payloads) {
          await api.post('/assets', payload)
        }

        let employeeName = ''

        if (shared.assigned_to) {
          const employee = people.find(
            (emp) => (emp._id || emp.id) === shared.assigned_to
          )

          employeeName = employee?.name || employee?.full_name || ''
        }

        setMsg({
          type: 'success',
          text: employeeName
            ? `${rows.length} asset(s) added and assigned to ${employeeName}.`
            : `${rows.length} asset(s) added successfully.`,
        })
      }

      onCancel()
      onSuccess()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          error?.message ||
          'Failed to save asset(s).',
      })
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- render ---------------- */

  return (
    <form onSubmit={submit}>
      {/* ASSIGN TO */}

      <FormGroup
        label={
          existing && rows.length === 1
            ? 'Assigned To'
            : 'Assign New Asset(s) To (Optional)'
        }
      >
        <select
          value={
            existing && rows.length === 1
              ? existing.assigned_to || ''
              : shared.assigned_to
          }
          disabled={!!existing && rows.length === 1}
          onChange={(e) => updateShared('assigned_to', e.target.value)}
          style={{
            ...inputStyle,
            ...(existing && rows.length === 1
              ? { background: 'var(--bg-mid)', cursor: 'not-allowed' }
              : {}),
          }}
        >
          <option value="">— Select Employee (Optional) —</option>

          {people.map((employee) => {
            const id = employee._id || employee.id

            return (
              <option key={id} value={id}>
                {employee.kind === 'Admin' ? '[ADMIN] ' : ''}
                {employee.name || employee.full_name || 'Unnamed Employee'}
                {employee.department ? ` - ${employee.department}` : ''}
              </option>
            )
          })}
        </select>

        {existing && rows.length === 1 && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              display: 'block',
            }}
          >
            Use Assign / Unassign buttons in the table to change this.
          </span>
        )}

        {existing && rows.length > 1 && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              display: 'block',
            }}
          >
            This applies only to the newly added asset(s) below — not the
            existing asset (code above).
          </span>
        )}
      </FormGroup>

      <div
        style={{
          borderBottom: '1px solid var(--border)',
          marginBottom: '1rem',
        }}
      />

      {/* CATEGORY + STATUS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <FormGroup label="Category *">
          <select
            required
            value={shared.category}
            onChange={(e) => updateShared('category', e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select —</option>

            {CATS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Status">
          <select
            value={shared.status}
            onChange={(e) => updateShared('status', e.target.value)}
            disabled={!existing && !!shared.assigned_to}
            style={inputStyle}
          >
            {STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormGroup>
      </div>

      {isSim && (
        <div
          style={{
            padding: '0.6rem 0.8rem',
            marginBottom: '0.9rem',
            borderRadius: 6,
            background: 'rgba(21,101,192,0.08)',
            border: '1px solid rgba(21,101,192,0.25)',
            color: '#1565c0',
            fontSize: '0.75rem',
          }}
        >
          SIM Card selected — scroll down to <b>Asset Details</b> and enter
          the <b>SIM Number</b>.
        </div>
      )}

      {/* BRAND + MODEL */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <FormGroup label="Brand">
          <select
            value={isOtherBrand ? 'Other' : shared.brand}
            onChange={(e) => {
              if (e.target.value === 'Other') {
                setIsOtherBrand(true)
                updateShared('brand', customBrand)
              } else {
                setIsOtherBrand(false)
                setCustomBrand('')
                updateShared('brand', e.target.value)
              }
            }}
            style={inputStyle}
          >
            <option value="">— Select Brand —</option>
            {BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>

          {isOtherBrand && (
            <input
              value={customBrand}
              onChange={(e) => {
                setCustomBrand(e.target.value)
                updateShared('brand', e.target.value)
              }}
              placeholder="Enter brand name"
              autoFocus
              style={{ ...inputStyle, marginTop: 6 }}
            />
          )}
        </FormGroup>

        <FormGroup label="Model">
          <input
            value={shared.model}
            onChange={(e) => updateShared('model', e.target.value)}
            placeholder={MODEL_PLACEHOLDER[shared.category] || 'Model'}
            style={inputStyle}
          />
        </FormGroup>
      </div>

      {/* SIM PROVIDER */}

      {isSim && (
        <FormGroup label="SIM Provider">
          <select
            value={shared.sim_provider}
            onChange={(e) => updateShared('sim_provider', e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select Provider —</option>
            {SIM_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            Auto-selected from the SIM number when a similar series is already
            saved. You can change it manually.
          </span>
        </FormGroup>
      )}

      {/* CATEGORY SPECS (shared) */}

      {sharedFields.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          {sharedFields.map((f) => (
            <FormGroup
              key={f.key}
              label={f.label + (f.required ? ' *' : '')}
            >
              <SpecInput
                field={f}
                value={shared.specs[f.key] || ''}
                onChange={(v) => updateSharedSpec(f.key, v)}
              />
            </FormGroup>
          ))}
        </div>
      )}

      {/* DATES */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <FormGroup label="Purchase Date">
          <input
            type="date"
            value={shared.purchase_date}
            onChange={(e) => updateShared('purchase_date', e.target.value)}
            style={inputStyle}
          />
        </FormGroup>

        <FormGroup label="Warranty Until">
          <input
            type="date"
            value={shared.warranty_until}
            onChange={(e) => updateShared('warranty_until', e.target.value)}
            style={inputStyle}
          />
        </FormGroup>
      </div>

      {/* LOCATION */}

      <FormGroup label="Location">
        <input
          value={shared.location}
          onChange={(e) => updateShared('location', e.target.value)}
          placeholder="Office Floor 2"
          style={inputStyle}
        />
      </FormGroup>

      {/* NOTES */}

      <FormGroup label="Notes">
        <textarea
          value={shared.notes}
          onChange={(e) => updateShared('notes', e.target.value)}
          style={{
            ...inputStyle,
            minHeight: 70,
            resize: 'vertical',
          }}
          placeholder="Additional notes..."
        />
      </FormGroup>

      <div
        style={{
          borderBottom: '1px solid var(--border)',
          margin: '1rem 0',
        }}
      />

      {/* ASSET DETAILS */}

      <div style={{ marginBottom: '0.8rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {existing ? 'Asset Details' : `Assets to Add (${rows.length})`}
        </span>
      </div>

      {rows.map((row, index) => {
        const dupSim = isSim ? findSim(row.sim_number) : undefined

        return (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: existing
                ? 'repeat(3, minmax(0, 1fr))'
                : 'repeat(3, minmax(0, 1fr)) auto',
              gap: '0.75rem',
              alignItems: 'end',
              marginBottom: '0.75rem',
              padding: '0.75rem',
              background: 'rgba(198,40,40,0.02)',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}
          >
            <div>
                            <label style={smallLabelStyle}>
                Asset Code {isSim ? '(auto for SIM)' : '*'}
              </label>

              <input
                required={!isSim}
                value={row.asset_code}
                onChange={(e) =>
                  updateRow(index, 'asset_code', e.target.value)
                }
                placeholder={isSim ? 'Leave empty → SIM-98XXXXXXXX' : 'ASSET-001'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={smallLabelStyle}>Asset Name *</label>

              <input
                required
                value={row.name}
                onChange={(e) => updateRow(index, 'name', e.target.value)}
                placeholder={isSim ? 'Office SIM' : 'Dell Laptop'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={smallLabelStyle}>Serial No</label>

              <input
                value={row.serial_no}
                onChange={(e) =>
                  updateRow(index, 'serial_no', e.target.value)
                }
                placeholder="Serial number"
                style={inputStyle}
              />
            </div>

            {isSim && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={smallLabelStyle}>SIM Number *</label>

                <input
                  required
                  value={row.sim_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')

                    updateRow(index, 'sim_number', val)

                    const detected = detectProvider(val)

                    if (detected) {
                      updateShared('sim_provider', detected)
                    }
                  }}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  inputMode="numeric"
                  style={inputStyle}
                />

                {row.sim_number.length >= 4 &&
                  !dupSim &&
                  !detectProvider(row.sim_number) &&
                  !shared.sim_provider && (
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      New series ({row.sim_number.slice(0, 4)}) — select the
                      SIM Provider manually above. It will be remembered next
                      time.
                    </span>
                  )}

                {dupSim && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: '0.68rem',
                      color: '#c62828',
                    }}
                  >
                    Already used: {dupSim.asset_code} – {dupSim.name}
                    {dupSim.assigned_to_name
                      ? ` (${dupSim.assigned_to_name})`
                      : ''}
                  </span>
                )}
              </div>
            )}

            {rowFields.map((f) => (
              <div key={f.key}>
                <label style={smallLabelStyle}>
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>

                <SpecInput
                  field={f}
                  value={row.specs[f.key] || ''}
                  onChange={(v) => updateRowSpec(index, f.key, v)}
                />
              </div>
            ))}

            {rows.length > 1 && index > 0 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                title="Remove"
                style={{
                  gridColumn: 4,
                  gridRow: 1,
                  padding: 8,
                  borderRadius: 5,
                  border: '1px solid rgba(198,40,40,0.3)',
                  background: 'transparent',
                  color: '#c62828',
                  cursor: 'pointer',
                  height: 38,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )
      })}

      {/* ADD ANOTHER */}

      <button
        type="button"
        onClick={addRow}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 5,
          border: '1px dashed var(--border)',
          background: 'transparent',
          color: 'var(--red-primary)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '1.2rem',
        }}
      >
        <Plus size={15} />
        Add Another Asset
      </button>

      {/* BUTTONS */}

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={secondaryButtonStyle}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 5,
            border: 'none',
            background: saving ? '#aaa' : 'var(--red-primary)',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <Save size={15} />

          {saving
            ? 'Saving...'
            : existing
              ? 'Save Changes'
              : `Add ${rows.length} Asset${rows.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   IMPORT EXCEL
========================================================= */

type ImportRow = {
  line: number
  payload: any
  assignedName: string
  matchedName: string
  errors: string[]
  warnings: string[]
  existing?: Asset
}

const normName = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '')

// Levenshtein-based similarity (0 to 1)
const similarity = (a: string, b: string) => {
  if (!a || !b) return 0
  if (a === b) return 1

  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ])

  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }

  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length)
}

const headerKey = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

// Accepts many header spellings and maps them to our standard names
const HEADER_ALIASES: Record<string, string[]> = {
  'Asset Code': ['assetcode', 'code', 'assetid', 'assettag', 'tagno', 'tag'],
  'Asset Name': ['assetname', 'name', 'itemname'],
  Category: ['category', 'assettype', 'type'],
  Brand: ['brand', 'make'],
  Model: ['model'],
  'Serial No': ['serialno', 'serialnumber', 'serial'],
  Status: ['status'],
  'Assigned To (Excel name)': [
    'assignedtoexcelname',
    'assignedto',
    'employee',
    'employeename',
    'username',
    'user',
  ],
  Location: ['location', 'floor'],
  'Purchase Date': ['purchasedate', 'purchasedon'],
  'Warranty Until': ['warrantyuntil', 'warranty', 'warrantyexpiry'],
  'SIM Provider': ['simprovider', 'provider', 'network'],
  'SIM Number': ['simnumber', 'simno'],
  Processor: ['processor', 'cpu'],
  RAM: ['ram'],
  Storage: ['storage', 'rom'],
  OS: ['os', 'operatingsystem'],
  'IMEI 1': ['imei1', 'imei'],
  'IMEI 2': ['imei2'],
  'Phone Number': ['phonenumber', 'mobilenumber', 'phone'],
  Notes: ['notes', 'note', 'remarks'],
}

const ALIAS_TO_STD: Record<string, string> = {}

Object.entries(HEADER_ALIASES).forEach(([std, list]) => {
  ALIAS_TO_STD[headerKey(std)] = std
  list.forEach((a) => {
    ALIAS_TO_STD[a] = std
  })
})

function ImportExcelForm({
  people,
  allAssets,
  onSuccess,
  onCancel,
  setMsg,
}: {
  people: Employee[]
  allAssets: Asset[]
  onSuccess: () => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [info, setInfo] = useState('')
  const [mode, setMode] = useState<'add' | 'update'>('add')
  const [filter, setFilter] = useState<'all' | 'ready' | 'warn' | 'error'>('all')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  // FIX: use for...of so TypeScript does not narrow `best` to `never`
  const findPerson = (name: string): Employee | null => {
    const n = normName(name)
    if (!n) return null

    let best: Employee | null = null
    let bestScore = 0

    for (const p of people) {
      const score = similarity(n, normName(p.name || p.full_name || ''))

      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }

    return bestScore >= 0.78 ? best : null
  }

  const parseFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      /* ---- find the best sheet + header row automatically ---- */

      let best: {
        sheet: string
        headerRow: number
        colMap: Record<number, string>
        aoa: any[][]
        score: number
      } | null = null

      for (const sheetName of wb.SheetNames) {
        const aoa = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[sheetName], {
          header: 1,
          defval: '',
          blankrows: false,
        }) as any[][]

        for (let h = 0; h < Math.min(aoa.length, 15); h++) {
          const colMap: Record<number, string> = {}

          aoa[h].forEach((cell, c) => {
            const std = ALIAS_TO_STD[headerKey(cell)]
            if (std && !Object.values(colMap).includes(std)) colMap[c] = std
          })

          const found = Object.values(colMap)
          const ok =
            found.includes('Asset Code') &&
            found.includes('Asset Name') &&
            found.includes('Category')

          if (ok && (!best || found.length > best.score)) {
            best = {
              sheet: sheetName,
              headerRow: h,
              colMap,
              aoa,
              score: found.length,
            }
          }
        }
      }

      if (!best) {
        setRows([])
        setFileName('')
        setMsg({
          type: 'error',
          text: 'Header row not found. First row must contain: Asset Code, Asset Name, Category.',
        })
        return
      }

      const json: Record<string, any>[] = []
      const lineNos: number[] = []

      for (let i = best.headerRow + 1; i < best.aoa.length; i++) {
        const rec: Record<string, any> = {}

        Object.entries(best.colMap).forEach(([c, std]) => {
          rec[std] = best!.aoa[i][Number(c)]
        })

        const hasData = Object.values(rec).some(
          (v) => String(v ?? '').trim() !== ''
        )

        if (hasData) {
          json.push(rec)
          lineNos.push(i + 1) // real Excel row number
        }
      }

      setInfo(
        `Sheet "${best.sheet}" · header row ${best.headerRow + 1} · ${best.score} columns matched`
      )

      const get = (r: Record<string, any>, key: string) => {
        const v = r[key]
        if (v instanceof Date) return v.toISOString().split('T')[0]
        return String(v ?? '').trim()
      }

      // existing assets by code (used for "Update existing")
      const codeMap = new Map<string, Asset>()

      allAssets.forEach((a) => {
        if (a.asset_code) codeMap.set(a.asset_code.toLowerCase(), a)
      })

      // which asset already owns a SIM number
      const simOwners = new Map<string, Asset>()

      allAssets.forEach((a) => {
        if (a.sim_number) simOwners.set(a.sim_number, a)
      })

      const seenCodes = new Set<string>()
      const seenSims = new Set<string>()

      const result: ImportRow[] = json.map((r, i) => {
        const errors: string[] = []
        const warnings: string[] = []

        const catRaw = get(r, 'Category')
        const category =
          CATS.find((c) => c.toLowerCase() === catRaw.toLowerCase()) || catRaw
                const simNumber = get(r, 'SIM Number')
        const code =
          get(r, 'Asset Code') ||
          (category === 'SIM Card' && /^\d{10}$/.test(simNumber)
            ? `SIM-${simNumber}`
            : '')
        const name = get(r, 'Asset Name')
        const assignedName = get(r, 'Assigned To (Excel name)')
        const existing = code ? codeMap.get(code.toLowerCase()) : undefined

        /* ---- validation ---- */

        if (!code) errors.push('Asset Code missing')
        if (!name) errors.push('Asset Name missing')
        if (!CATS.includes(category)) {
          errors.push(`Category "${category}" invalid`)
        }

        if (code) {
          const key = code.toLowerCase()

          if (seenCodes.has(key)) {
            errors.push('Duplicate code in Excel')
          }

          seenCodes.add(key)
        }

        if (category === 'SIM Card') {
          if (!/^\d{10}$/.test(simNumber)) {
            errors.push('SIM Number must be 10 digits')
          } else if (
            simOwners.has(simNumber) &&
            (simOwners.get(simNumber)!.asset_code || '').toLowerCase() !==
              code.toLowerCase()
          ) {
            errors.push(
              `SIM already used by ${simOwners.get(simNumber)!.asset_code}`
            )
          } else if (seenSims.has(simNumber)) {
            errors.push('Duplicate SIM in Excel')
          }

          seenSims.add(simNumber)
        }

        /* ---- specs (only fields that belong to this category) ---- */

        const raw: Record<string, string> = {
          processor: get(r, 'Processor'),
          ram: get(r, 'RAM'),
          storage: get(r, 'Storage'),
          os: get(r, 'OS'),
          imei1: get(r, 'IMEI 1'),
          imei2: get(r, 'IMEI 2'),
          phone_number: get(r, 'Phone Number'),
        }

        const specs: Record<string, string> = {}

        ;(CATEGORY_FIELDS[category] || []).forEach((f) => {
          const v = raw[f.key]
          if (!v) return

          if (f.digits && !new RegExp(`^\\d{${f.digits}}$`).test(v)) {
            errors.push(`${f.label} must be ${f.digits} digits`)
          }

          specs[f.key] = v
        })

        /* ---- employee match ---- */

        const statusRaw = get(r, 'Status')
        let status =
          STATUS_LIST.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) ||
          'Available'

        let assignedTo: string | undefined
        let matchedName = ''

        if (assignedName) {
          const person = findPerson(assignedName)

          if (person) {
            assignedTo = person._id || person.id
            matchedName = person.name || person.full_name || ''

            if (status === 'Available') status = 'Assigned'

            if (normName(matchedName) !== normName(assignedName)) {
              warnings.push(`Matched with "${matchedName}" - check`)
            }
          } else {
            warnings.push('Employee not found - will import unassigned')
            if (status === 'Assigned') status = 'Available'
          }
        } else if (status === 'Assigned') {
          status = 'Available'
        }

        if (
          existing &&
          assignedTo &&
          existing.assigned_to !== assignedTo &&
          existing.assigned_to_name
        ) {
          warnings.push(
            `Reassign: ${existing.assigned_to_name} → ${matchedName}`
          )
        }

        return {
          line: lineNos[i],
          assignedName,
          matchedName,
          existing,
          errors,
          warnings,
          payload: {
            asset_code: code,
            name,
            category,
            brand: get(r, 'Brand'),
            model: get(r, 'Model'),
            serial_no: get(r, 'Serial No'),
            sim_number: simNumber,
            sim_provider: get(r, 'SIM Provider'),
            purchase_date: get(r, 'Purchase Date'),
            warranty_until: get(r, 'Warranty Until'),
            location: get(r, 'Location'),
            notes: get(r, 'Notes'),
            status,
            assigned_to: assignedTo,
            specs,
          },
        }
      })

      setRows(result)
      setFileName(file.name)
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: 'Could not read the Excel file.' })
    }
  }

  // In "add only" mode an existing code is an error; in "update" mode it is an update
  const errorsOf = (r: ImportRow) =>
    r.existing && mode === 'add'
      ? ['Code already exists in website', ...r.errors]
      : r.errors

    const validRows = rows
    .filter((r) => errorsOf(r).length === 0)
    .sort((a, b) =>
      naturalCompare(a.payload.asset_code || '', b.payload.asset_code || '')
    )
  const errorRows = rows.length - validRows.length
  const toUpdate = validRows.filter((r) => r.existing && mode === 'update').length
  const toCreate = validRows.length - toUpdate

  // Update an asset that already exists (matched by Asset Code)
  const updateExisting = async (r: ImportRow) => {
    const ex = r.existing as Asset
    const id = ex._id || ex.id

    if (!id) throw new Error('Asset ID not found')

    const p = r.payload
    const special = ['Under Repair', 'Damaged', 'Retired'].includes(p.status)

    // empty Excel cells never wipe existing data
    const body: Record<string, any> = {
      asset_code: p.asset_code,
      status: special ? p.status : ex.status,
    }

    ;[
      'name',
      'category',
      'brand',
      'model',
      'serial_no',
      'sim_number',
      'sim_provider',
      'purchase_date',
      'warranty_until',
      'location',
      'notes',
    ].forEach((k) => {
      if (p[k]) body[k] = p[k]
    })

    if (Object.keys(p.specs || {}).length > 0) {
      body.specs = { ...(ex.specs || {}), ...p.specs }
    }

    await api.patch(`/assets/${id}`, body)

    // change the person only when Excel has a matched employee
    if (!special && p.assigned_to && ex.assigned_to !== p.assigned_to) {
      if (ex.assigned_to || ex.status === 'Assigned') {
        await api.patch(`/assets/${id}/unassign`, {
          reason: 'Reassigned via Excel import',
        })
      }

      await api.patch(`/assets/${id}/assign`, {
        employee_id: p.assigned_to,
        reason: 'Excel import',
      })
    }
  }

  const runImport = async () => {
    if (validRows.length === 0) return

    setImporting(true)
    setProgress(0)

    let ok = 0
    let failed = 0
    const errs: string[] = []
        const CHUNK = 1 // one at a time keeps the code order

    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK)

      const results = await Promise.allSettled(
        chunk.map((r) =>
          r.existing && mode === 'update'
            ? updateExisting(r)
            : api.post('/assets', r.payload)
        )
      )

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          ok++
        } else {
          failed++

          const reason: any = res.reason

          errs.push(
            `${chunk[idx].payload.asset_code}: ${
              reason?.response?.data?.error || reason?.message || 'failed'
            }`
          )
        }
      })

      setProgress(Math.min(i + CHUNK, validRows.length))
    }

    setImporting(false)

    setMsg({
      type: failed ? 'error' : 'success',
      text: failed
        ? `${ok} done, ${failed} failed. ${errs.slice(0, 2).join(' | ')}`
        : `${ok} asset(s) saved (${toCreate} new, ${toUpdate} updated).`,
    })

    if (failed) console.error('Import failures:', errs)

    onSuccess()

    if (!failed) onCancel()
  }

  /* ---------- derived values for the preview ---------- */

  const reasons: Record<string, number> = {}

  rows.forEach((r) =>
    errorsOf(r).forEach((e) => {
      reasons[e] = (reasons[e] || 0) + 1
    })
  )

  const warnCount = rows.filter(
    (r) => errorsOf(r).length === 0 && r.warnings.length > 0
  ).length

  const shown = rows.filter((r) => {
    if (filter === 'error') return errorsOf(r).length > 0
    if (filter === 'ready') return errorsOf(r).length === 0
    if (filter === 'warn') return errorsOf(r).length === 0 && r.warnings.length > 0
    return true
  })

  const th: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: '0.67rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    background: 'var(--bg-mid)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  const td: React.CSSProperties = {
    padding: '9px 14px',
    fontSize: '0.78rem',
    color: 'var(--text-sub)',
    verticalAlign: 'top',
  }

  const tabBtn = (
    key: 'all' | 'ready' | 'warn' | 'error',
    label: string,
    count: number,
    color: string
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      style={{
        padding: '6px 14px',
        borderRadius: 16,
        border: `1px solid ${filter === key ? color : 'var(--border)'}`,
        background: filter === key ? color : 'transparent',
        color: filter === key ? '#fff' : color,
        fontSize: '0.74rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label} ({count})
    </button>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* FILE PICKER BAR */}

      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              setFilter('all')
              parseFile(f)
            }
          }}
          style={{ ...inputStyle, width: 'auto', flex: '0 1 380px' }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {(['add', 'update'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '7px 14px',
                borderRadius: 6,
                border: `1px solid ${mode === m ? '#1565c0' : 'var(--border)'}`,
                background: mode === m ? '#1565c0' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-sub)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m === 'add' ? 'Add new only' : 'Add new + Update existing'}
            </button>
          ))}
        </div>

        {rows.length > 0 && (
          <div style={{ fontSize: '0.8rem' }}>
            <b>{fileName}</b> — {rows.length} rows |{' '}
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>
              {validRows.length} ready
            </span>{' '}
            |{' '}
            <span style={{ color: '#c62828', fontWeight: 600 }}>
              {errorRows} errors
            </span>
            {mode === 'update' && (
              <>
                {' '}
                | <span style={{ fontWeight: 600 }}>➕ {toCreate} new</span> |{' '}
                <span style={{ fontWeight: 600 }}>🔄 {toUpdate} update</span>
              </>
            )}
            {info && (
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {info}
              </div>
            )}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          Upload the import-ready Excel file. You can check every row here
          before anything is saved.
        </div>
      ) : (
        <>
          {/* FILTER TABS + ERROR REASONS */}

          <div
            style={{
              padding: '12px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {tabBtn('all', 'All', rows.length, '#455a64')}
            {tabBtn('ready', 'Ready', validRows.length, '#2e7d32')}
            {tabBtn('warn', 'Warnings', warnCount, '#e65100')}
            {tabBtn('error', 'Errors', errorRows, '#c62828')}

            <span style={{ width: 12 }} />

            {Object.entries(reasons)
              .sort((x, y) => y[1] - x[1])
              .map(([reason, count]) => (
                <span
                  key={reason}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    color: '#c62828',
                    background: 'rgba(198,40,40,0.08)',
                    border: '1px solid rgba(198,40,40,0.2)',
                  }}
                >
                  {reason}: {count}
                </span>
              ))}
          </div>

          {/* FULL TABLE */}

          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 980,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>Row</th>
                  <th style={th}>Code</th>
                  <th style={th}>Asset Name</th>
                  <th style={th}>Category</th>
                  <th style={th}>Assigned To</th>
                  <th style={th}>Status</th>
                  <th style={th}>Result</th>
                </tr>
              </thead>

              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...td,
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No rows in this filter.
                    </td>
                  </tr>
                )}

                {shown.map((r) => {
                  const bad = errorsOf(r).length > 0
                  const warn = !bad && r.warnings.length > 0

                  return (
                    <tr
                      key={r.line}
                      style={{
                        borderBottom: '1px solid var(--border-mid)',
                        background: bad
                          ? 'rgba(198,40,40,0.06)'
                          : warn
                            ? 'rgba(230,81,0,0.05)'
                            : 'transparent',
                      }}
                    >
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{r.line}</td>

                      <td
                        style={{
                          ...td,
                          fontFamily: 'IBM Plex Mono',
                          fontWeight: 600,
                          color: 'var(--red-primary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.payload.asset_code || 'NO CODE'}
                      </td>

                      <td
                        style={{
                          ...td,
                          color: 'var(--text-main)',
                          fontWeight: 500,
                        }}
                      >
                        {r.payload.name || '—'}
                      </td>

                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {r.payload.category || '—'}
                      </td>

                      <td style={td}>
                        {r.matchedName || r.assignedName || '—'}
                      </td>

                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 10,
                            color:
                              STATUS_COLOR[r.payload.status] ||
                              'var(--text-muted)',
                            background: `${
                              STATUS_COLOR[r.payload.status] || '#888'
                            }18`,
                          }}
                        >
                          {r.payload.status}
                        </span>
                      </td>

                      <td
                        style={{
                          ...td,
                          fontWeight: 600,
                          color: bad
                            ? '#c62828'
                            : warn
                              ? '#e65100'
                              : '#2e7d32',
                        }}
                      >
                        {bad
                          ? `✖ ${errorsOf(r).join('; ')}`
                          : `${warn ? '⚠' : '✔'} ${
                              r.existing && mode === 'update'
                                ? '🔄 UPDATE'
                                : '➕ NEW'
                            }${warn ? ' — ' + r.warnings.join('; ') : ''}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FOOTER */}

      <div
        style={{
                    padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            marginRight: 'auto',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'update'
            ? 'Existing codes are updated (details + assigned person). Empty Excel cells never erase data.'
            : 'Only green (ready) rows will be added. Existing codes are skipped.'}
        </span>

        <button
          type="button"
          onClick={onCancel}
          disabled={importing}
          style={secondaryButtonStyle}
        >
          Close
        </button>

        <button
          type="button"
          onClick={runImport}
          disabled={importing || validRows.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 5,
            border: 'none',
            background:
              importing || validRows.length === 0
                ? '#aaa'
                : 'var(--red-primary)',
            color: '#fff',
            cursor:
              importing || validRows.length === 0
                ? 'not-allowed'
                : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <Upload size={15} />
          {importing
            ? `Importing ${progress}/${validRows.length}...`
            : mode === 'update' && toUpdate > 0
              ? `Apply ${validRows.length} Row(s) (${toCreate} new, ${toUpdate} update)`
              : `Import ${validRows.length} Asset(s)`}
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN ADMIN ASSETS
========================================================= */

export default function AdminAssets() {
  const isMobile = useIsMobile()
  /* =======================================================
     DATA
  ======================================================= */

  const [allAssets, setAllAssets] = useState<Asset[]>([])

  const [people, setPeople] = useState<Employee[]>([])

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    repair: 0,
  })

  /* =======================================================
     UI
  ======================================================= */

  const [msg, setMsg] = useState<Message | null>(null)

  const [loading, setLoading] = useState(false)

  const [showAdd, setShowAdd] = useState(false)

  const [editAsset, setEditAsset] = useState<Asset | null>(null)

  const [assignAsset, setAssignAsset] = useState<Asset | null>(null)

  const [showReplace, setShowReplace] = useState(false)

  const [showImport, setShowImport] = useState(false)

  const [unassignConfirm, setUnassignConfirm] = useState<string | null>(null)

  // Unassign reason (saved in asset history)
  const [unassignReason, setUnassignReason] = useState(UNASSIGN_REASONS[0])
  const [unassignOther, setUnassignOther] = useState('')

  /* =======================================================
     ASSET HISTORY
  ======================================================= */

  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const openHistory = async (asset: Asset) => {
    setHistoryAsset(asset)
    setHistory([])
    setHistoryLoading(true)

    try {
      const { data } = await api.get(
        `/assets/${asset._id || asset.id}/history`
      )
      setHistory(data.history || [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const [personView, setPersonView] = useState<{ id: string; name: string } | null>(null)
  const [personHistory, setPersonHistory] = useState<any[]>([])
  const [personLoading, setPersonLoading] = useState(false)

  const openPersonHistory = async (id: string, name: string) => {
    setPersonView({ id, name })
    setPersonHistory([])
    setPersonLoading(true)
    try {
      const { data } = await api.get(`/assets/employee/${id}/history`)
      setPersonHistory(data.history || [])
    } catch {
      setPersonHistory([])
    } finally {
      setPersonLoading(false)
    }
  }

  /* =======================================================
     SCROLL POSITION (fix: table jumping to top after
     edit/assign/unassign/delete actions trigger a reload)
  ======================================================= */

  const scrollYRef = useRef(0)

  const captureScroll = () => {
    scrollYRef.current = window.scrollY
  }

  const restoreScroll = () => {
    // Wait a tick so the DOM has re-rendered with the
    // refreshed data before we scroll back into place.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollYRef.current,
          behavior: 'auto',
        })
      })
    })
  }

  /* =======================================================
     FILTERS
  ======================================================= */

  const [statusF, setStatusF] = useState('')
  const [categoryF, setCategoryF] = useState('')
  const [locationF, setLocationF] = useState('')
  const [brandF, setBrandF] = useState('')
  const [assignedF, setAssignedF] = useState('')
  const [warrantyF, setWarrantyF] = useState('')
  const [q, setQ] = useState('')

  const [sortBy, setSortBy] = useState<
    'name' | 'asset_code' | 'status' | 'purchase_date'
  >('asset_code')

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  /* =======================================================
     EXPAND / COLLAPSE
  ======================================================= */

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  /* =======================================================
     LOAD ASSETS
  ======================================================= */

  const load = async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/assets')

      const assets: Asset[] = Array.isArray(data?.assets)
        ? data.assets
        : Array.isArray(data)
          ? data
          : []

      setAllAssets(assets)

      if (data?.stats) {
        setStats({
          total: Number(data.stats.total) || 0,
          available: Number(data.stats.available) || 0,
          assigned: Number(data.stats.assigned) || 0,
          repair: Number(data.stats.repair) || 0,
        })
      } else {
        calculateStats(assets)
      }
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Failed to load assets.',
      })

      setAllAssets([])

      setStats({
        total: 0,
        available: 0,
        assigned: 0,
        repair: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     CALCULATE STATS
  ======================================================= */

  const calculateStats = (assets: Asset[]) => {
    const total = assets.length

    const available = assets.filter(
      (asset) => asset.status === 'Available'
    ).length

    const assigned = assets.filter(
      (asset) => asset.status === 'Assigned'
    ).length

    const repair = assets.filter(
      (asset) =>
        asset.status === 'Under Repair' || asset.status === 'Damaged'
    ).length

    setStats({ total, available, assigned, repair })
  }

  /* =======================================================
     LOAD EMPLOYEES
  ======================================================= */

  const loadPeople = async () => {
    try {
      const { data } = await api.get('/employees')

      const empList = Array.isArray(data?.employees)
        ? data.employees
        : Array.isArray(data)
          ? data
          : []

      const adminList = Array.isArray(data?.admins) ? data.admins : []

      /*
        Combine employees + admins so assets
        can be assigned to either.
      */
      setPeople([
        ...empList.map((e: any) => ({
          ...e,
          kind: 'Employee' as const,
        })),
        ...adminList.map((a: any) => ({
          ...a,
          kind: 'Admin' as const,
        })),
      ])
    } catch (error) {
      console.error('Failed to load people:', error)

      setPeople([])
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    load()
    loadPeople()
  }, [])

  /* =======================================================
     AUTO HIDE MESSAGE
  ======================================================= */

  useEffect(() => {
    if (!msg) return

    const timer = setTimeout(() => {
      setMsg(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [msg])

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const filterCategories = useMemo(
    () =>
      Array.from(
        new Set(allAssets.map((asset) => asset.category).filter(Boolean))
      ).sort() as string[],
    [allAssets]
  )

  const filterLocations = useMemo(
    () =>
      Array.from(
        new Set(allAssets.map((asset) => asset.location).filter(Boolean))
      ).sort() as string[],
    [allAssets]
  )

  const filterBrands = useMemo(
    () =>
      Array.from(
        new Set(allAssets.map((asset) => asset.brand).filter(Boolean))
      ).sort() as string[],
    [allAssets]
  )

  /* =======================================================
     WARRANTY
  ======================================================= */

  const isWarrantyExpired = (date?: string) => {
    if (!date) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const warranty = new Date(date)
    warranty.setHours(0, 0, 0, 0)

    return warranty < today
  }

  /* =======================================================
     FILTER ASSETS
  ======================================================= */

  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      /* STATUS */

      if (statusF && asset.status !== statusF) return false

      /* CATEGORY */

      if (categoryF && asset.category !== categoryF) return false

      /* LOCATION */

      if (locationF && asset.location !== locationF) return false

      /* BRAND */

      if (brandF && asset.brand !== brandF) return false

      /* ASSIGNMENT */

      const assigned = !!(asset.assigned_to || asset.assigned_to_name)

      if (assignedF === 'Assigned' && !assigned) return false

      if (assignedF === 'Not Assigned' && assigned) return false

      /* WARRANTY */

      if (warrantyF) {
        const hasWarranty = !!asset.warranty_until

        const expired = isWarrantyExpired(asset.warranty_until)

        if (warrantyF === 'active' && (!hasWarranty || expired)) {
          return false
        }

        if (warrantyF === 'expired' && (!hasWarranty || !expired)) {
          return false
        }

        if (warrantyF === 'none' && hasWarranty) {
          return false
        }
      }

      /* SEARCH */

      if (q.trim()) {
        const search = q.trim().toLowerCase()

        const searchable = [
          asset.asset_code,
          asset.name,
          asset.serial_no,
          asset.category,
          asset.brand,
          asset.model,
          asset.location,
          asset.status,
          asset.assigned_to_name,
          asset.sim_number,
          asset.sim_provider,
          ...Object.values(asset.specs || {}),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!searchable.includes(search)) return false
      }

      return true
    })
  }, [
    allAssets,
    statusF,
    categoryF,
    locationF,
    brandF,
    assignedF,
    warrantyF,
    q,
  ])

  /* =======================================================
     SORT ASSETS
  ======================================================= */

    const sortedAssets = useMemo(() => {
    const list = [...filteredAssets]
    const dir = sortOrder === 'asc' ? 1 : -1

    list.sort((a, b) => {
      if (sortBy === 'purchase_date') {
        const x = a.purchase_date ? new Date(a.purchase_date).getTime() : 0
        const y = b.purchase_date ? new Date(b.purchase_date).getTime() : 0
        return (x - y) * dir
      }

      return naturalCompare(String(a[sortBy] || ''), String(b[sortBy] || '')) * dir
    })

    return list
  }, [filteredAssets, sortBy, sortOrder])

  /* =======================================================
     GROUP ASSETS
  ======================================================= */

  const groupedAssets = useMemo(() => {
    return sortedAssets.reduce(
      (result: Record<string, Asset[]>, asset) => {
        const category = asset.category || 'Uncategorized'

        if (!result[category]) {
          result[category] = []
        }

        result[category].push(asset)

        return result
      },
      {}
    )
  }, [sortedAssets])

  const categories = useMemo(
    () => Object.keys(groupedAssets).sort(),
    [groupedAssets]
  )

  /* =======================================================
     CATEGORY TOGGLE / EXPAND / COLLAPSE
  ======================================================= */

  const toggleCategory = (category: string) => {
    setExpandedCats((previous) => {
      const next = new Set(previous)

      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }

      return next
    })
  }

  const expandAll = () => {
    setExpandedCats(new Set(categories))
  }

  const collapseAll = () => {
    setExpandedCats(new Set())
  }

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setStatusF('')
    setCategoryF('')
    setLocationF('')
    setBrandF('')
    setAssignedF('')
    setWarrantyF('')
    setQ('')
    setSortBy('asset_code')
    setSortOrder('asc')

    setExpandedCats(new Set())
  }

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this asset?'
    )

    if (!confirmed) return

    captureScroll()

    try {
      await api.delete(`/assets/${id}`)

      setMsg({
        type: 'success',
        text: 'Asset deleted successfully.',
      })

      await load()
      restoreScroll()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Delete failed.',
      })
    }
  }

  /* =======================================================
     ASSIGN
  ======================================================= */

  const handleAssign = async (assetId: string, employeeId: string) => {
    captureScroll()

    try {
      await api.patch(`/assets/${assetId}/assign`, {
        employee_id: employeeId,
      })

      setMsg({
        type: 'success',
        text: 'Asset assigned successfully!',
      })

      setAssignAsset(null)

      await load()
      restoreScroll()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Assignment failed.',
      })
    }
  }

  /* =======================================================
     UNASSIGN (sends the reason to the backend history)
  ======================================================= */

  const handleUnassign = async (assetId: string, reason: string) => {
    captureScroll()

    try {
      await api.patch(`/assets/${assetId}/unassign`, { reason })

      setMsg({
        type: 'success',
        text: 'Asset unassigned successfully!',
      })

      await load()
      restoreScroll()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text: error?.response?.data?.error || 'Unassign failed.',
      })
    }
  }

    /* =======================================================
     DOWNLOAD ASSETS (generic)
  ======================================================= */

  const downloadAssets = (list: Asset[], label: string) => {
    if (list.length === 0) {
      setMsg({ type: 'error', text: `No assets to export for "${label.replace(/_/g, ' ')}".` })
      return
    }

    const rows = [...list]
      .sort((a, b) => naturalCompare(a.asset_code || '', b.asset_code || ''))
      .map((asset) => ({
        'Asset Code': asset.asset_code || '—',
        'Asset Name': asset.name || '—',
        Category: asset.category || '—',
        Brand: asset.brand || '—',
        Model: asset.model || '—',
        'Serial No': asset.serial_no || '—',
        'SIM Provider': asset.sim_provider || '—',
        'SIM Number': asset.sim_number || '—',
        Specs:
          Object.entries(asset.specs || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || '—',
        Status: asset.status || '—',
        'Assigned To': asset.assigned_to_name || 'Unassigned',
        Location: asset.location || '—',
        'Purchase Date': asset.purchase_date
          ? new Date(asset.purchase_date).toLocaleDateString('en-GB')
          : '—',
        'Warranty Until': asset.warranty_until
          ? new Date(asset.warranty_until).toLocaleDateString('en-GB')
          : '—',
        Notes: asset.notes || '—',
      }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [16, 22, 14, 14, 16, 18, 14, 14, 40, 14, 20, 16, 14, 14, 25].map(
      (w) => ({ wch: w })
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Assets')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${label}_${today}.xlsx`)

    setMsg({
      type: 'success',
      text: `${label.replace(/_/g, ' ')} downloaded (${list.length}).`,
    })
  }

  const downloadAll = () => downloadAssets(allAssets, 'All_Assets')
  const downloadFiltered = () => downloadAssets(sortedAssets, 'Filtered_Assets')
  const downloadAssigned = () =>
    downloadAssets(allAssets.filter((a) => a.assigned_to_name), 'Assigned_Assets')
  const downloadAvailable = () =>
    downloadAssets(allAssets.filter((a) => a.status === 'Available'), 'Available_Assets')
  const downloadRepair = () =>
    downloadAssets(
      allAssets.filter((a) => ['Under Repair', 'Damaged'].includes(a.status || '')),
      'Repair_Damaged_Assets'
    )
  const downloadCategory = (cat: string, list: Asset[]) =>
    downloadAssets(list, `${cat.replace(/\s+/g, '_')}_Assets`)

  /* =======================================================
     DOWNLOAD EMPLOYEE-WISE ASSET REPORT
  ======================================================= */

  const handleDownloadReport = () => {
    if (allAssets.length === 0) {
      setMsg({
        type: 'error',
        text: 'No assets available to export.',
      })
      return
    }

    const reportRows = allAssets.map((asset) => ({
      'Asset Code': asset.asset_code || '—',
      'Asset Name': asset.name || '—',
      Category: asset.category || '—',
      Brand: asset.brand || '—',
      Model: asset.model || '—',
      'Serial No': asset.serial_no || '—',
      'SIM Provider': asset.sim_provider || '—',
      'SIM Number': asset.sim_number || '—',
      Specs:
        Object.entries(asset.specs || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ') || '—',
      Status: asset.status || '—',
      'Assigned To': asset.assigned_to_name || 'Unassigned',
      Location: asset.location || '—',
      'Purchase Date': asset.purchase_date
        ? new Date(asset.purchase_date).toLocaleDateString('en-GB')
        : '—',
      'Warranty Until': asset.warranty_until
        ? new Date(asset.warranty_until).toLocaleDateString('en-GB')
        : '—',
      Notes: asset.notes || '—',
    }))

    const worksheet = XLSX.utils.json_to_sheet(reportRows)

    worksheet['!cols'] = [
      { wch: 16 }, // Asset Code
      { wch: 22 }, // Asset Name
      { wch: 14 }, // Category
      { wch: 14 }, // Brand
      { wch: 16 }, // Model
      { wch: 18 }, // Serial No
      { wch: 14 }, // SIM Provider
      { wch: 14 }, // SIM Number
      { wch: 40 }, // Specs
      { wch: 14 }, // Status
      { wch: 20 }, // Assigned To
      { wch: 16 }, // Location
      { wch: 14 }, // Purchase Date
      { wch: 14 }, // Warranty Until
      { wch: 25 }, // Notes
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Assets')

    /* -----------------------------------------------------
       EMPLOYEE-WISE SHEET (Grouped by Assigned Employee)
    ----------------------------------------------------- */

    const assignedAssets = allAssets.filter(
      (asset) => asset.assigned_to_name
    )

    const employeeGroups: Record<string, Asset[]> = {}

    assignedAssets.forEach((asset) => {
      const empName = asset.assigned_to_name || 'Unassigned'
      if (!employeeGroups[empName]) {
        employeeGroups[empName] = []
      }
      employeeGroups[empName].push(asset)
    })

    const employeeRows: any[] = []

    Object.keys(employeeGroups)
      .sort()
      .forEach((empName) => {
        employeeGroups[empName].forEach((asset, index) => {
          employeeRows.push({
            'Employee Name': index === 0 ? empName : '',
            'Asset Code': asset.asset_code || '—',
            'Asset Name': asset.name || '—',
            Category: asset.category || '—',
            'Brand / Model':
              (asset.category === 'SIM Card'
                ? [asset.sim_provider, asset.sim_number]
                : [asset.brand, asset.model]
              )
                .filter(Boolean)
                .join(' / ') || '—',
            'Serial No': asset.serial_no || '—',
            Status: asset.status || '—',
            'Warranty Until': asset.warranty_until
              ? new Date(asset.warranty_until).toLocaleDateString('en-GB')
              : '—',
          })
        })
      })

    const empWorksheet = XLSX.utils.json_to_sheet(employeeRows)

    empWorksheet['!cols'] = [
      { wch: 20 }, // Employee Name
      { wch: 16 }, // Asset Code
      { wch: 22 }, // Asset Name
      { wch: 14 }, // Category
      { wch: 24 }, // Brand/Model
      { wch: 18 }, // Serial No
      { wch: 14 }, // Status
      { wch: 14 }, // Warranty Until
    ]

    XLSX.utils.book_append_sheet(
      workbook,
      empWorksheet,
      'Employee-wise Assets'
    )

    const today = new Date().toISOString().split('T')[0]

    XLSX.writeFile(workbook, `Asset_Report_${today}.xlsx`)

    setMsg({
      type: 'success',
      text: 'Asset report downloaded successfully.',
    })
  }

    /* =======================================================
     ACTION BUTTONS (used in mobile cards)
  ======================================================= */

  const renderActions = (asset: Asset, id: string) => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: '7px 12px',
      borderRadius: 5,
      cursor: 'pointer',
      fontSize: '0.72rem',
      fontWeight: 600,
    }

    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {asset.status === 'Available' && (
          <button
            type="button"
            onClick={() => setAssignAsset(asset)}
            style={{ ...base, border: 'none', background: '#1565c0', color: '#fff' }}
          >
            <UserPlus size={13} /> Assign
          </button>
        )}

        {asset.status === 'Assigned' && (
          <button
            type="button"
            onClick={() => setUnassignConfirm(id)}
            style={{
              ...base,
              border: '1px solid #e65100',
              background: 'rgba(230,81,0,0.08)',
              color: '#e65100',
            }}
          >
            <Unlock size={13} /> Unassign
          </button>
        )}

        <button
          type="button"
          onClick={() => openHistory(asset)}
          style={{
            ...base,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-sub)',
          }}
        >
          <HistoryIcon size={13} /> History
        </button>

        <button
          type="button"
          onClick={() => setEditAsset(asset)}
          style={{ ...base, border: 'none', background: 'var(--red-primary)', color: '#fff' }}
        >
          <Pencil size={13} /> Edit
        </button>

        <button
          type="button"
          onClick={() => id && handleDelete(id)}
          style={{
            ...base,
            border: '1px solid rgba(198,40,40,0.25)',
            background: 'rgba(198,40,40,0.08)',
            color: '#c62828',
          }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    )
  }

  /* =======================================================
     RESET AFTER ADD / EDIT
  ======================================================= */

  const afterSave = async () => {
    captureScroll()
    await load()
    restoreScroll()
  }

  /* =======================================================
     MODAL CLOSE HANDLERS
  ======================================================= */

  const closeAdd = () => {
    captureScroll()
    setShowAdd(false)
    restoreScroll()
  }

  const closeEdit = () => {
    captureScroll()
    setEditAsset(null)
    restoreScroll()
  }

  const closeAssign = () => {
    captureScroll()
    setAssignAsset(null)
    restoreScroll()
  }

  const closeReplace = () => {
    captureScroll()
    setShowReplace(false)
    restoreScroll()
  }

  const closeImport = () => {
    captureScroll()
    setShowImport(false)
    restoreScroll()
  }

  const closeUnassignConfirm = () => {
    captureScroll()
    setUnassignConfirm(null)
    setUnassignReason(UNASSIGN_REASONS[0])
    setUnassignOther('')
    restoreScroll()
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
       <AppLayout role="admin">
            <style>{`
        @media (max-width: 768px) {
          [style*="repeat(4,"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          [style*="repeat(2,"],
          [style*="repeat(3,"] {
            grid-template-columns: 1fr !important;
          }
          button[title="Remove"] {
            grid-column: auto !important;
            grid-row: auto !important;
          }
          input, select, textarea {
            font-size: 16px !important;
          }
          html, body {
            overflow-x: hidden;
          }
        }
      `}</style>

      <PageHeader
        breadcrumb="ASSETS"
        title="Asset Management"
        subtitle="Track, assign and manage all company IT assets"
      />

      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem',
          marginBottom: '1.8rem',
        }}
      >
        <StatCard
          label="Total Assets"
          value={stats.total}
          sub="All inventory"
          color="var(--red-primary)"
        />

        <StatCard
          label="Available"
          value={stats.available}
          sub="Ready to assign"
          color="var(--green)"
        />

        <StatCard
          label="Assigned"
          value={stats.assigned}
          sub="With employees"
          color="#1565c0"
        />

        <StatCard
          label="Repair / Damaged"
          value={stats.repair}
          sub="Needs attention"
          color="var(--orange)"
        />
      </div>

      {/* ===================================================
          FILTER PANEL
      =================================================== */}

      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'var(--bg-card)',
        }}
      >
        {/* SEARCH + FIRST FILTERS */}

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          {/* SEARCH */}

          <div
            style={{
              position: 'relative',
              flex: '1 1 250px',
              minWidth: 200,
            }}
          >
            <Search
              size={14}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search asset code, name, serial, SIM..."
              style={{
                ...inputStyle,
                padding: '8px 12px 8px 32px',
              }}
            />
          </div>

          {/* STATUS */}

          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Status</option>

            {STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* CATEGORY */}

          <select
            value={categoryF}
            onChange={(e) => setCategoryF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Categories</option>

            {filterCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* LOCATION */}

          <select
            value={locationF}
            onChange={(e) => setLocationF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Locations</option>

            {filterLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* BRAND */}

          <select
            value={brandF}
            onChange={(e) => setBrandF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Brands</option>

            {filterBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* SECOND FILTER ROW */}

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* ASSIGNMENT */}

          <select
            value={assignedF}
            onChange={(e) => setAssignedF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Assignment</option>
            <option value="Assigned">Assigned</option>
            <option value="Not Assigned">Not Assigned</option>
          </select>

          {/* WARRANTY */}

          <select
            value={warrantyF}
            onChange={(e) => setWarrantyF(e.target.value)}
            style={filterStyle}
          >
            <option value="">All Warranty</option>
            <option value="active">Active Warranty</option>
            <option value="expired">Expired Warranty</option>
            <option value="none">No Warranty</option>
          </select>

          {/* SORT BY */}

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | 'name'
                  | 'asset_code'
                  | 'status'
                  | 'purchase_date'
              )
            }
            style={filterStyle}
          >
            <option value="asset_code">Sort: Asset Code</option>
            <option value="name">Sort: Asset Name</option>
            <option value="status">Sort: Status</option>
            <option value="purchase_date">Sort: Purchase Date</option>
          </select>

          {/* SORT ORDER */}

          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title={
              sortOrder === 'asc'
                ? 'Ascending (click for descending)'
                : 'Descending (click for ascending)'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            {sortOrder === 'asc' ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
            {sortOrder === 'asc' ? 'A–Z' : 'Z–A'}
          </button>

          {/* CLEAR */}

          <button
            type="button"
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            <X size={13} />
            Clear Filters
          </button>
        </div>

        {/* ACTION BUTTONS ROW */}

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          {/* FIND & REPLACE */}

          <button
            type="button"
            onClick={() => setShowReplace(true)}
            style={{
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-sub)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Find & Replace
          </button>

                   {/* DOWNLOAD BUTTONS */}

          {(
            [
              ['All Assets', downloadAll],
              ['Filtered', downloadFiltered],
              ['Assigned', downloadAssigned],
              ['Available', downloadAvailable],
              ['Repair / Damaged', downloadRepair],
              ['Employee-wise', handleDownloadReport],
            ] as [string, () => void][]
          ).map(([label, fn]) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 5,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-sub)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Boxes size={14} />
              {label}
            </button>
          ))}

          {/* IMPORT EXCEL */}

          <button
            type="button"
            onClick={() => setShowImport(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-sub)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={14} />
            Import Excel
          </button>

          {/* ADD */}

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 5,
              border: 'none',
              background: 'var(--red-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
                            fontWeight: 600,
              marginLeft: isMobile ? 0 : 'auto',
              width: isMobile ? '100%' : undefined,
              justifyContent: 'center',
            }}
          >
            <Plus size={15} />
            Add New Asset
          </button>
        </div>
      </div>

      {/* ===================================================
          ASSET TABLE CARD
      =================================================== */}

      <div className="card">
        {/* TABLE HEADER */}

        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-mid)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: '0.87rem',
              fontWeight: 600,
            }}
          >
            Assets ({filteredAssets.length})

            {filteredAssets.length !== allAssets.length && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}
              >
                of {allAssets.length}
              </span>
            )}
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={expandAll}
              style={smallActionButton}
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAll}
              style={smallActionButton}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* TABLE CONTENT */}

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              No assets found.
            </div>
          ) : (
            <div>
              {categories.map((category) => {
                const expanded = expandedCats.has(category)

                const categoryAssets = groupedAssets[category]

                return (
                  <div
                    key={category}
                    style={{
                      borderBottom: '1px solid var(--border-mid)',
                    }}
                  >
                    {/* CATEGORY HEADER */}

                    <div
                      onClick={() => toggleCategory(category)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 1.4rem',
                        background: 'rgba(198,40,40,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                                            <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <Boxes size={16} color="var(--red-primary)" />

                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {category}
                        </span>

                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-card)',
                            padding: '2px 8px',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                          }}
                        >
                                                    {categoryAssets.length} asset
                          {categoryAssets.length > 1 ? 's' : ''}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation() // don't expand/collapse
                            downloadCategory(category, categoryAssets)
                          }}
                          title={`Download ${category}`}
                          style={{ ...smallActionButton, padding: '2px 8px' }}
                        >
                          ⬇ Excel
                        </button>
                      </div>

                      {expanded ? (
                        <ChevronUp size={16} color="var(--text-muted)" />
                      ) : (
                        <ChevronDown size={16} color="var(--text-muted)" />
                      )}
                    </div>

                    {/* CATEGORY TABLE */}

                                       {/* MOBILE: CARD LIST */}

                    {expanded && isMobile && (
                      <div
                        style={{
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        {categoryAssets.map((asset) => {
                          const id = asset._id || asset.id || ''
                          const expired = isWarrantyExpired(asset.warranty_until)

                          return (
                            <div
                              key={id || asset.asset_code}
                              style={{
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '0.8rem',
                                background: 'var(--bg-card)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: 'IBM Plex Mono',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: 'var(--red-primary)',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {asset.asset_code}
                                </span>

                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '3px 9px',
                                    borderRadius: 12,
                                    whiteSpace: 'nowrap',
                                    color: STATUS_COLOR[asset.status || ''] || 'var(--text-muted)',
                                    background: `${STATUS_COLOR[asset.status || ''] || '#888'}18`,
                                  }}
                                >
                                  {asset.status}
                                </span>
                              </div>

                              <div
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 600,
                                  color: 'var(--text-main)',
                                  marginBottom: 4,
                                }}
                              >
                                {asset.name}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--text-muted)',
                                  marginBottom: 8,
                                }}
                              >
                                {assetSummary(asset)}
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: 8,
                                  marginBottom: 10,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <div>
                                  <span style={labelStyle}>Assigned To</span>
                                  <div style={{ marginTop: 2 }}>
                                    {asset.assigned_to_name ? (
                                      <span
                                        onClick={() =>
                                          asset.assigned_to &&
                                          openPersonHistory(
                                            String(asset.assigned_to),
                                            asset.assigned_to_name || ''
                                          )
                                        }
                                        style={{
                                          color: '#1565c0',
                                          textDecoration: 'underline',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {asset.assigned_to_name}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span style={labelStyle}>Warranty</span>
                                  <div
                                    style={{
                                      marginTop: 2,
                                      color: expired ? '#c62828' : 'var(--text-sub)',
                                      fontWeight: expired ? 600 : 400,
                                    }}
                                  >
                                    {asset.warranty_until
                                      ? new Date(asset.warranty_until).toLocaleDateString('en-GB')
                                      : '—'}
                                    {expired && asset.warranty_until ? ' (Expired)' : ''}
                                  </div>
                                </div>
                              </div>

                              {renderActions(asset, id)}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* DESKTOP: TABLE */}

                    {expanded && !isMobile && (
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          minWidth: 1000,
                        }}
                      >
                        <thead>
                          <tr>
                            <TableHeader title="Code" />
                            <TableHeader title="Assigned To" />
                            <TableHeader title="Asset Name" />
                            <TableHeader title="Status" />
                            <TableHeader title="Category" />
                            <TableHeader title="Brand / Model" />
                            <TableHeader title="Warranty" />
                            <TableHeader title="Actions" />
                          </tr>
                        </thead>

                        <tbody>
                          {categoryAssets.map((asset) => {
                            const id = asset._id || asset.id || ''
                            const expired = isWarrantyExpired(
                              asset.warranty_until
                            )

                            return (
                              <tr
                                key={id || asset.asset_code}
                                style={{
                                  borderBottom:
                                    '1px solid var(--border-mid)',
                                }}
                              >
                                {/* 1. CODE */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontFamily: 'IBM Plex Mono',
                                    color: 'var(--red-primary)',
                                    fontSize: '0.77rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {asset.asset_code}
                                </td>

                                {/* 2. ASSIGNED TO */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-sub)',
                                  }}
                                >
                                  {asset.assigned_to_name ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 22,
                                          height: 22,
                                          borderRadius: '50%',
                                          background: '#1565c0',
                                          color: '#fff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.6rem',
                                          fontWeight: 700,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {asset.assigned_to_name
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>

                                                                            <span
                                        onClick={() =>
                                          asset.assigned_to &&
                                          openPersonHistory(
                                            String(asset.assigned_to),
                                            asset.assigned_to_name || ''
                                          )
                                        }
                                        title="View all changes for this person"
                                        style={{
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          color: '#1565c0',
                                          textDecoration: 'underline',
                                        }}
                                      >
                                        {asset.assigned_to_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span
                                      style={{
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* 3. ASSET NAME */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontSize: '0.83rem',
                                    fontWeight: 500,
                                    color: 'var(--text-main)',
                                  }}
                                >
                                  {asset.name}
                                </td>

                                {/* 4. STATUS */}

                                <td style={{ padding: '12px 1.2rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '0.73rem',
                                      fontWeight: 600,
                                      padding: '3px 9px',
                                      borderRadius: 12,
                                      color:
                                        STATUS_COLOR[asset.status || ''] ||
                                        'var(--text-muted)',
                                      background: `${
                                        STATUS_COLOR[asset.status || ''] ||
                                        '#888'
                                      }18`,
                                    }}
                                  >
                                    {asset.status}
                                  </span>
                                </td>

                                {/* 5. CATEGORY */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-sub)',
                                  }}
                                >
                                  {asset.category || '—'}
                                </td>

                                {/* 6. BRAND / MODEL / SIM */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {assetSummary(asset)}
                                </td>

                                {/* 7. WARRANTY */}

                                <td
                                  style={{
                                    padding: '12px 1.2rem',
                                    fontSize: '0.75rem',
                                    color: expired
                                      ? '#c62828'
                                      : 'var(--text-muted)',
                                    fontWeight: expired ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {asset.warranty_until
                                    ? new Date(
                                        asset.warranty_until
                                      ).toLocaleDateString('en-GB')
                                    : '—'}

                                  {expired && asset.warranty_until && (
                                    <div
                                      style={{
                                        fontSize: '0.6rem',
                                        marginTop: 2,
                                      }}
                                    >
                                      Expired
                                    </div>
                                  )}
                                </td>

                                {/* 8. ACTIONS */}

                                <td style={{ padding: '12px 1.2rem' }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 4,
                                      flexWrap: 'nowrap',
                                    }}
                                  >
                                    {/* ASSIGN */}

                                    {asset.status === 'Available' && (
                                      <button
                                        type="button"
                                        onClick={() => setAssignAsset(asset)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '3px 7px',
                                          borderRadius: 5,
                                          border: 'none',
                                          background: '#1565c0',
                                          color: '#fff',
                                          cursor: 'pointer',
                                          fontSize: '0.65rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <UserPlus size={12} />
                                        Assign
                                      </button>
                                    )}

                                    {/* UNASSIGN */}

                                    {asset.status === 'Assigned' && (
                                      <button
                                        type="button"
                                        onClick={() => setUnassignConfirm(id)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '3px 8px',
                                          borderRadius: 5,
                                          border: '1px solid #e65100',
                                          background: 'rgba(230,81,0,0.08)',
                                          color: '#e65100',
                                          cursor: 'pointer',
                                          fontSize: '0.68rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Unlock size={12} />
                                        Unassign
                                      </button>
                                    )}

                                    {/* HISTORY */}

                                    <button
                                      type="button"
                                      onClick={() => openHistory(asset)}
                                      title="View history"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '3px 7px',
                                        borderRadius: 5,
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-sub)',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <HistoryIcon size={12} />
                                    </button>

                                    {/* EDIT */}

                                    <button
                                      type="button"
                                      onClick={() => setEditAsset(asset)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '3px 7px',
                                        borderRadius: 5,
                                        border: 'none',
                                        background: 'var(--red-primary)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Pencil size={12} />
                                      Edit
                                    </button>

                                    {/* DELETE */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (id) {
                                          handleDelete(id)
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '3px 7px',
                                        borderRadius: 5,
                                        border:
                                          '1px solid rgba(198,40,40,0.25)',
                                        background: 'rgba(198,40,40,0.08)',
                                        color: '#c62828',
                                        cursor: 'pointer',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Trash2 size={12} />
                                      Del
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          FIND & REPLACE MODAL
      =================================================== */}

      <Modal
        open={showReplace}
        onClose={closeReplace}
        title="Find & Replace Category"
      >
        <ReplaceCategoryForm
          onSuccess={afterSave}
          onCancel={closeReplace}
          setMsg={setMsg}
        />
      </Modal>

      {/* ===================================================
          IMPORT EXCEL MODAL
      =================================================== */}

      {showImport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2vh 2vw',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1500,
              height: '100%',
              background: 'var(--bg-card, #fff)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Import Assets from Excel
              </span>

              <button
                type="button"
                onClick={closeImport}
                title="Close"
                style={{
                  ...secondaryButtonStyle,
                  padding: '6px 8px',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <ImportExcelForm
              people={people}
              allAssets={allAssets}
              onSuccess={afterSave}
              onCancel={closeImport}
              setMsg={setMsg}
            />
          </div>
        </div>
      )}

      {/* ===================================================
          ADD ASSET MODAL
      =================================================== */}

      <Modal open={showAdd} onClose={closeAdd} title="Add New Asset">
        <AssetForm
          people={people}
          allAssets={allAssets}
          onSuccess={afterSave}
          onCancel={closeAdd}
          setMsg={setMsg}
        />
      </Modal>

      {/* ===================================================
          EDIT ASSET MODAL
      =================================================== */}

      {editAsset && (
        <Modal open={true} onClose={closeEdit} title="Edit Asset">
          <AssetForm
            existing={editAsset}
            people={people}
            allAssets={allAssets}
            onSuccess={afterSave}
            onCancel={closeEdit}
            setMsg={setMsg}
          />
        </Modal>
      )}

      {/* ===================================================
          ASSIGN MODAL
      =================================================== */}

      {assignAsset && (
        <Modal
          open={true}
          onClose={closeAssign}
          title="Assign Asset to Employee"
        >
          <AssignForm
            asset={assignAsset}
            people={people}
            onAssign={handleAssign}
            onCancel={closeAssign}
            setMsg={setMsg}
          />
        </Modal>
      )}

      {/* ===================================================
          UNASSIGN CONFIRMATION (with reason)
      =================================================== */}

      {unassignConfirm && (
        <Modal
          open={true}
          onClose={closeUnassignConfirm}
          title="Confirm Unassign"
        >
          <div
            style={{
              padding: '1rem',
                            minWidth: isMobile ? 0 : 360,
              maxWidth: 420,
            }}
          >
            <div
              style={{
                padding: '0.8rem',
                marginBottom: '1rem',
                borderRadius: 6,
                background: 'rgba(230,81,0,0.08)',
                border: '1px solid rgba(230,81,0,0.2)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              Are you sure you want to unassign this asset from the
              employee?
            </div>

            <FormGroup label="Reason">
              <select
                value={unassignReason}
                onChange={(e) => setUnassignReason(e.target.value)}
                style={inputStyle}
              >
                {UNASSIGN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormGroup>

            {unassignReason === 'Other' && (
              <FormGroup label="Specify reason">
                <input
                  value={unassignOther}
                  onChange={(e) => setUnassignOther(e.target.value)}
                  placeholder="Enter reason"
                  style={inputStyle}
                />
              </FormGroup>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={closeUnassignConfirm}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const id = unassignConfirm

                  const reason =
                    unassignReason === 'Other'
                      ? unassignOther.trim() || 'Other'
                      : unassignReason

                  setUnassignConfirm(null)
                  setUnassignReason(UNASSIGN_REASONS[0])
                  setUnassignOther('')

                  await handleUnassign(id, reason)
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 5,
                  border: 'none',
                  background: '#e65100',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Unassign
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================================================
          ASSET HISTORY MODAL
      =================================================== */}

      {historyAsset && (
  <AssetHistoryModal
    asset={historyAsset}
    history={history}
    loading={historyLoading}
    onClose={() => setHistoryAsset(null)}
  />
)}

      {personView && (
        <Modal
          open={true}
          onClose={() => setPersonView(null)}
          title={`History — ${personView.name}`}
        >
                    <div
            style={{
              minWidth: isMobile ? 0 : 520,
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            {personLoading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading...
              </div>
            ) : personHistory.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No history found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Action', 'Asset', 'Reason', 'By'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '8px 10px',
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {personHistory.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-mid)' }}>
                      <td style={{ padding: '8px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(h.date).toLocaleString('en-GB')}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: h.action === 'Assigned' ? '#1565c0' : '#e65100',
                        }}
                      >
                        {h.action}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '0.75rem' }}>
                        <b style={{ fontFamily: 'IBM Plex Mono', color: 'var(--red-primary)' }}>
                          {h.asset_code}
                        </b>{' '}
                        {h.asset_name}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '0.75rem' }}>{h.reason || '—'}</td>
                      <td style={{ padding: '8px 10px', fontSize: '0.75rem' }}>{h.done_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

    </AppLayout>
  )
}