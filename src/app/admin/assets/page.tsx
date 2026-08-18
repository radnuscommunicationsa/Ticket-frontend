'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
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
  'Other',
]

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
}

type Employee = {
  _id?: string
  id?: string
  name?: string
  full_name?: string
  email?: string
  department?: string
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
  employees,
  onAssign,
  onCancel,
  setMsg,
}: {
  asset: Asset
  employees: Employee[]
  onAssign: (assetId: string, employeeId: string) => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [selectedEmployee, setSelectedEmployee] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee) {
      setMsg({
        type: 'error',
        text: 'Please select an employee.',
      })
      return
    }

    const assetId = asset._id || asset.id

    if (!assetId) {
      setMsg({
        type: 'error',
        text: 'Asset ID not found.',
      })
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
            <p style={valueSubStyle}>
              {asset.category || '—'}
            </p>
          </div>

          <div>
            <span style={labelStyle}>Status</span>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: '0.8rem',
                color:
                  STATUS_COLOR[asset.status || ''] ||
                  'var(--text-muted)',
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
          onChange={(e) =>
            setSelectedEmployee(e.target.value)
          }
          style={inputStyle}
        >
          <option value="">
            — Choose an Employee —
          </option>

          {employees.map((employee) => {
            const id = employee._id || employee.id

            return (
              <option key={id} value={id}>
                {employee.name ||
                  employee.full_name ||
                  'Unnamed Employee'}

                {employee.email
                  ? ` (${employee.email})`
                  : ''}

                {employee.department
                  ? ` - ${employee.department}`
                  : ''}
              </option>
            )
          })}
        </select>
      </FormGroup>

      {employees.length === 0 && (
        <div
          style={{
            padding: '0.8rem',
            background: 'rgba(198,40,40,0.06)',
            borderRadius: 6,
            border:
              '1px solid rgba(198,40,40,0.2)',
            fontSize: '0.78rem',
            color: '#c62828',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} />
          No employees found. Please add employees
          first.
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
        <button
          type="button"
          onClick={onCancel}
          style={secondaryButtonStyle}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={employees.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 5,
            border: 'none',
            background:
              employees.length === 0
                ? '#aaa'
                : '#1565c0',
            color: '#fff',
            cursor:
              employees.length === 0
                ? 'not-allowed'
                : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <UserPlus size={15} />
          Assign to Employee
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
      setMsg({
        type: 'error',
        text: 'Please select both categories.',
      })
      return
    }

    if (find === replace) {
      setMsg({
        type: 'error',
        text:
          'Find and Replace category cannot be same.',
      })
      return
    }

    try {
      setSaving(true)

      await api.patch('/assets/find-replace', {
        find,
        replace,
      })

      setMsg({
        type: 'success',
        text:
          `All "${find}" assets changed to "${replace}".`,
      })

      onSuccess()
      onCancel()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          'Category replacement failed.',
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
          <option value="">
            — Select Category —
          </option>

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
          onChange={(e) =>
            setReplace(e.target.value)
          }
          style={inputStyle}
        >
          <option value="">
            — Select Category —
          </option>

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
        This will change the category of all
        matching assets.
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={secondaryButtonStyle}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: 5,
            background: saving
              ? '#aaa'
              : '#1565c0',
            color: '#fff',
            cursor: saving
              ? 'not-allowed'
              : 'pointer',
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
  employees,
  onSuccess,
  onCancel,
  setMsg,
}: {
  existing?: Asset | null
  employees: Employee[]
  onSuccess: () => void
  onCancel: () => void
  setMsg: (msg: Message) => void
}) {
  const [shared, setShared] =
    useState<SharedAsset>({
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
    })

  const [rows, setRows] = useState<AssetRow[]>(
    existing
      ? [
          {
            asset_code: existing.asset_code || '',
            name: existing.name || '',
            serial_no: existing.serial_no || '',
          },
        ]
      : [
          {
            asset_code: '',
            name: '',
            serial_no: '',
          },
        ]
  )

  const [saving, setSaving] = useState(false)

  const updateShared = (
    field: keyof SharedAsset,
    value: string
  ) => {
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
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    )
  }

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        asset_code: '',
        name: '',
        serial_no: '',
      },
    ])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return

    setRows((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!shared.category) {
      setMsg({
        type: 'error',
        text: 'Please select a category.',
      })
      return
    }

    if (
      shared.purchase_date &&
      shared.warranty_until &&
      new Date(shared.purchase_date) >
        new Date(shared.warranty_until)
    ) {
      setMsg({
        type: 'error',
        text:
          'Warranty date must be after purchase date.',
      })
      return
    }

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].asset_code.trim()) {
        setMsg({
          type: 'error',
          text:
            `Row ${i + 1}: Asset Code is required.`,
        })
        return
      }

      if (!rows[i].name.trim()) {
        setMsg({
          type: 'error',
          text:
            `Row ${i + 1}: Asset Name is required.`,
        })
        return
      }
    }

    try {
      setSaving(true)

      /* =================================================
         EDIT
      ================================================= */

      if (existing) {
        const assetId =
          existing._id || existing.id

        if (!assetId) {
          throw new Error('Asset ID not found.')
        }

        const payload = {
          ...shared,
          ...rows[0],
        }

        /*
          assigned_to is not changed from edit form.
          Assignment is handled separately.
        */
        delete (payload as any).assigned_to

        await api.patch(
          `/assets/${assetId}`,
          payload
        )

        setMsg({
          type: 'success',
          text: 'Asset updated successfully!',
        })
      }

      /* =================================================
         ADD / BULK ADD
      ================================================= */

      else {
        const payloads = rows.map((row) => ({
          ...shared,
          ...row,
          status: shared.assigned_to
            ? 'Assigned'
            : shared.status,
          assigned_to:
            shared.assigned_to || undefined,
        }))

        await Promise.all(
          payloads.map((payload) =>
            api.post('/assets', payload)
          )
        )

        let employeeName = ''

        if (shared.assigned_to) {
          const employee = employees.find(
            (emp) =>
              (emp._id || emp.id) ===
              shared.assigned_to
          )

          employeeName =
            employee?.name ||
            employee?.full_name ||
            ''
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

  return (
    <form onSubmit={submit}>
      {/* ASSIGN TO */}

      {!existing && (
        <>
          <FormGroup label="Assign To (Optional)">
            <select
              value={shared.assigned_to}
              onChange={(e) =>
                updateShared(
                  'assigned_to',
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                — Select Employee (Optional) —
              </option>

              {employees.map((employee) => {
                const id =
                  employee._id || employee.id

                return (
                  <option key={id} value={id}>
                    {employee.name ||
                      employee.full_name ||
                      'Unnamed Employee'}

                    {employee.department
                      ? ` - ${employee.department}`
                      : ''}
                  </option>
                )
              })}
            </select>
          </FormGroup>

          <div
            style={{
              borderBottom:
                '1px solid var(--border)',
              marginBottom: '1rem',
            }}
          />
        </>
      )}

      {/* CATEGORY + STATUS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <FormGroup label="Category *">
          <select
            required
            value={shared.category}
            onChange={(e) =>
              updateShared(
                'category',
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              — Select —
            </option>

            {CATS.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Status">
          <select
            value={shared.status}
            onChange={(e) =>
              updateShared(
                'status',
                e.target.value
              )
            }
            disabled={
              !existing &&
              !!shared.assigned_to
            }
            style={inputStyle}
          >
            {STATUS_LIST.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </FormGroup>
      </div>

      {/* BRAND + MODEL */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
      <FormGroup label="Brand">
  <select
    value={
      shared.brand === '' || BRANDS.includes(shared.brand)
        ? shared.brand
        : 'Other'
    }
    onChange={(e) => {
      if (e.target.value === 'Other') {
        updateShared('brand', '__other__')
      } else {
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

  {shared.brand === '__other__' && (
    <input
      value=""
      onChange={(e) => updateShared('brand', e.target.value)}
      placeholder="Enter brand name"
      autoFocus
      style={{ ...inputStyle, marginTop: 6 }}
    />
  )}
</FormGroup>


        <FormGroup label="Model">
          <input
            value={shared.model}
            onChange={(e) =>
              updateShared(
                'model',
                e.target.value
              )
            }
            placeholder="Latitude 5520"
            style={inputStyle}
          />
        </FormGroup>
      </div>

      {/* DATES */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <FormGroup label="Purchase Date">
          <input
            type="date"
            value={shared.purchase_date}
            onChange={(e) =>
              updateShared(
                'purchase_date',
                e.target.value
              )
            }
            style={inputStyle}
          />
        </FormGroup>

        <FormGroup label="Warranty Until">
          <input
            type="date"
            value={shared.warranty_until}
            onChange={(e) =>
              updateShared(
                'warranty_until',
                e.target.value
              )
            }
            style={inputStyle}
          />
        </FormGroup>
      </div>

      {/* LOCATION */}

      <FormGroup label="Location">
        <input
          value={shared.location}
          onChange={(e) =>
            updateShared(
              'location',
              e.target.value
            )
          }
          placeholder="Office Floor 2"
          style={inputStyle}
        />
      </FormGroup>

      {/* NOTES */}

      <FormGroup label="Notes">
        <textarea
          value={shared.notes}
          onChange={(e) =>
            updateShared(
              'notes',
              e.target.value
            )
          }
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
          borderBottom:
            '1px solid var(--border)',
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
          {existing
            ? 'Asset Details'
            : `Assets to Add (${rows.length})`}
        </span>
      </div>

      {rows.map((row, index) => (
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
            background:
              'rgba(198,40,40,0.02)',
            borderRadius: 6,
            border:
              '1px solid var(--border)',
          }}
        >
          <div>
            <label style={smallLabelStyle}>
              Asset Code *
            </label>

            <input
              required
              value={row.asset_code}
              onChange={(e) =>
                updateRow(
                  index,
                  'asset_code',
                  e.target.value
                )
              }
              placeholder="ASSET-001"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={smallLabelStyle}>
              Asset Name *
            </label>

            <input
              required
              value={row.name}
              onChange={(e) =>
                updateRow(
                  index,
                  'name',
                  e.target.value
                )
              }
              placeholder="Dell Laptop"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={smallLabelStyle}>
              Serial No
            </label>

            <input
              value={row.serial_no}
              onChange={(e) =>
                updateRow(
                  index,
                  'serial_no',
                  e.target.value
                )
              }
              placeholder="Serial number"
              style={inputStyle}
            />
          </div>

          {!existing && rows.length > 1 && (
            <button
              type="button"
              onClick={() =>
                removeRow(index)
              }
              title="Remove"
              style={{
                padding: 8,
                borderRadius: 5,
                border:
                  '1px solid rgba(198,40,40,0.3)',
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
      ))}

      {/* ADD ANOTHER */}

      {!existing && (
        <button
          type="button"
          onClick={addRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 5,
            border:
              '1px dashed var(--border)',
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
      )}

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
            background: saving
              ? '#aaa'
              : 'var(--red-primary)',
            color: '#fff',
            cursor: saving
              ? 'not-allowed'
              : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <Save size={15} />

          {saving
            ? 'Saving...'
            : existing
              ? 'Save Changes'
              : `Add ${rows.length} Asset${
                  rows.length > 1
                    ? 's'
                    : ''
                }`}
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   MAIN ADMIN ASSETS
========================================================= */

export default function AdminAssets() {
  /* =======================================================
     DATA
  ======================================================= */

  const [allAssets, setAllAssets] =
    useState<Asset[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    repair: 0,
  })

  /* =======================================================
     UI
  ======================================================= */

  const [msg, setMsg] =
    useState<Message | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [showAdd, setShowAdd] =
    useState(false)

  const [editAsset, setEditAsset] =
    useState<Asset | null>(null)

  const [assignAsset, setAssignAsset] =
    useState<Asset | null>(null)

  const [showReplace, setShowReplace] =
    useState(false)

  const [unassignConfirm, setUnassignConfirm] =
    useState<string | null>(null)

  /* =======================================================
     FILTERS
  ======================================================= */

  const [statusF, setStatusF] =
    useState('')

  const [categoryF, setCategoryF] =
    useState('')

  const [locationF, setLocationF] =
    useState('')

  const [brandF, setBrandF] =
    useState('')

  const [assignedF, setAssignedF] =
    useState('')

  const [warrantyF, setWarrantyF] =
    useState('')

  const [q, setQ] = useState('')

  /* =======================================================
     EXPAND / COLLAPSE
  ======================================================= */

  const [expandedCats, setExpandedCats] =
    useState<Set<string>>(new Set())

  /* =======================================================
     LOAD ASSETS
  ======================================================= */

  const load = async () => {
    setLoading(true)

    try {
      const { data } =
        await api.get('/assets')

      const assets: Asset[] =
        Array.isArray(data?.assets)
          ? data.assets
          : Array.isArray(data)
            ? data
            : []

      setAllAssets(assets)

      if (data?.stats) {
        setStats({
          total:
            Number(data.stats.total) || 0,
          available:
            Number(data.stats.available) || 0,
          assigned:
            Number(data.stats.assigned) || 0,
          repair:
            Number(data.stats.repair) || 0,
        })
      } else {
        calculateStats(assets)
      }
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          'Failed to load assets.',
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

  const calculateStats = (
    assets: Asset[]
  ) => {
    const total = assets.length

    const available = assets.filter(
      (asset) =>
        asset.status === 'Available'
    ).length

    const assigned = assets.filter(
      (asset) =>
        asset.status === 'Assigned'
    ).length

    const repair = assets.filter(
      (asset) =>
        asset.status === 'Under Repair' ||
        asset.status === 'Damaged'
    ).length

    setStats({
      total,
      available,
      assigned,
      repair,
    })
  }

  /* =======================================================
     LOAD EMPLOYEES
  ======================================================= */

  const loadEmployees = async () => {
    try {
      const { data } =
        await api.get('/employees')

      const list = Array.isArray(
        data?.employees
      )
        ? data.employees
        : Array.isArray(data)
          ? data
          : []

      setEmployees(list)
    } catch (error) {
      console.error(
        'Failed to load employees:',
        error
      )

      setEmployees([])
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    load()
    loadEmployees()
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
        new Set(
          allAssets
            .map(
              (asset) => asset.category
            )
            .filter(Boolean)
        )
      ).sort() as string[],
    [allAssets]
  )

  const filterLocations = useMemo(
    () =>
      Array.from(
        new Set(
          allAssets
            .map(
              (asset) => asset.location
            )
            .filter(Boolean)
        )
      ).sort() as string[],
    [allAssets]
  )

  const filterBrands = useMemo(
    () =>
      Array.from(
        new Set(
          allAssets
            .map(
              (asset) => asset.brand
            )
            .filter(Boolean)
        )
      ).sort() as string[],
    [allAssets]
  )

  /* =======================================================
     WARRANTY
  ======================================================= */

  const isWarrantyExpired = (
    date?: string
  ) => {
    if (!date) return false

    const today = new Date()

    today.setHours(
      0,
      0,
      0,
      0
    )

    const warranty = new Date(date)

    warranty.setHours(
      0,
      0,
      0,
      0
    )

    return warranty < today
  }

  /* =======================================================
     FILTER ASSETS
  ======================================================= */

  const filteredAssets = useMemo(() => {
    return allAssets.filter(
      (asset) => {
        /* STATUS */

        if (
          statusF &&
          asset.status !== statusF
        ) {
          return false
        }

        /* CATEGORY */

        if (
          categoryF &&
          asset.category !== categoryF
        ) {
          return false
        }

        /* LOCATION */

        if (
          locationF &&
          asset.location !== locationF
        ) {
          return false
        }

        /* BRAND */

        if (
          brandF &&
          asset.brand !== brandF
        ) {
          return false
        }

        /* ASSIGNMENT */

        const assigned =
          !!(
            asset.assigned_to ||
            asset.assigned_to_name
          )

        if (
          assignedF === 'Assigned' &&
          !assigned
        ) {
          return false
        }

        if (
          assignedF === 'Not Assigned' &&
          assigned
        ) {
          return false
        }

        /* WARRANTY */

        if (warrantyF) {
          const hasWarranty =
            !!asset.warranty_until

          const expired =
            isWarrantyExpired(
              asset.warranty_until
            )

          if (
            warrantyF === 'active' &&
            (!hasWarranty || expired)
          ) {
            return false
          }

          if (
            warrantyF === 'expired' &&
            (!hasWarranty || !expired)
          ) {
            return false
          }

          if (
            warrantyF === 'none' &&
            hasWarranty
          ) {
            return false
          }
        }

        /* SEARCH */

        if (q.trim()) {
          const search =
            q.trim().toLowerCase()

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
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          if (
            !searchable.includes(search)
          ) {
            return false
          }
        }

        return true
      }
    )
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
     GROUP ASSETS
  ======================================================= */

  const groupedAssets = useMemo(() => {
    return filteredAssets.reduce(
      (
        result: Record<
          string,
          Asset[]
        >,
        asset
      ) => {
        const category =
          asset.category ||
          'Uncategorized'

        if (!result[category]) {
          result[category] = []
        }

        result[category].push(asset)

        return result
      },
      {}
    )
  }, [filteredAssets])

  const categories = useMemo(
    () =>
      Object.keys(
        groupedAssets
      ).sort(),
    [groupedAssets]
  )

  /* =======================================================
     CATEGORY TOGGLE
  ======================================================= */

  const toggleCategory = (
    category: string
  ) => {
    setExpandedCats((previous) => {
      const next =
        new Set(previous)

      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }

      return next
    })
  }

  /* =======================================================
     EXPAND ALL
  ======================================================= */

  const expandAll = () => {
    setExpandedCats(
      new Set(categories)
    )
  }

  /* =======================================================
     COLLAPSE ALL
  ======================================================= */

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

    setExpandedCats(new Set())
  }

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this asset?'
      )

    if (!confirmed) return

    try {
      await api.delete(
        `/assets/${id}`
      )

      setMsg({
        type: 'success',
        text:
          'Asset deleted successfully.',
      })

      await load()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          'Delete failed.',
      })
    }
  }

  /* =======================================================
     ASSIGN
  ======================================================= */

  const handleAssign = async (
    assetId: string,
    employeeId: string
  ) => {
    try {
      await api.patch(
        `/assets/${assetId}/assign`,
        {
          employee_id: employeeId,
        }
      )

      setMsg({
        type: 'success',
        text:
          'Asset assigned successfully!',
      })

      setAssignAsset(null)

      await load()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          'Assignment failed.',
      })
    }
  }

  /* =======================================================
     UNASSIGN
  ======================================================= */

  const handleUnassign = async (
    assetId: string
  ) => {
    try {
      await api.patch(
        `/assets/${assetId}/unassign`
      )

      setMsg({
        type: 'success',
        text:
          'Asset unassigned successfully!',
      })

      await load()
    } catch (error: any) {
      setMsg({
        type: 'error',
        text:
          error?.response?.data?.error ||
          'Unassign failed.',
      })
    }
  }

  /* =======================================================
     RESET AFTER ADD / EDIT
  ======================================================= */

  const afterSave = async () => {
    await load()
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="ASSETS"
        title="Asset Management"
        subtitle="Track, assign and manage all company IT assets"
      />

      {msg && (
        <Alert
          type={msg.type}
          message={msg.text}
        />
      )}

      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
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
          border:
            '1px solid var(--border)',
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
              flex:
                '1 1 250px',
              minWidth: 200,
            }}
          >
            <Search
              size={14}
              color="var(--text-muted)"
              style={{
                position:
                  'absolute',
                left: 10,
                top: '50%',
                transform:
                  'translateY(-50%)',
              }}
            />

            <input
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search asset code, name, serial..."
              style={{
                ...inputStyle,
                padding:
                  '8px 12px 8px 32px',
              }}
            />
          </div>

          {/* STATUS */}

          <select
            value={statusF}
            onChange={(e) =>
              setStatusF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Status
            </option>

            {STATUS_LIST.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>

          {/* CATEGORY */}

          <select
            value={categoryF}
            onChange={(e) =>
              setCategoryF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Categories
            </option>

            {filterCategories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>

          {/* LOCATION */}

          <select
            value={locationF}
            onChange={(e) =>
              setLocationF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Locations
            </option>

            {filterLocations.map(
              (location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              )
            )}
          </select>

          {/* BRAND */}

          <select
            value={brandF}
            onChange={(e) =>
              setBrandF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Brands
            </option>

            {filterBrands.map(
              (brand) => (
                <option
                  key={brand}
                  value={brand}
                >
                  {brand}
                </option>
              )
            )}
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
            onChange={(e) =>
              setAssignedF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Assignment
            </option>

            <option value="Assigned">
              Assigned
            </option>

            <option value="Not Assigned">
              Not Assigned
            </option>
          </select>

          {/* WARRANTY */}

          <select
            value={warrantyF}
            onChange={(e) =>
              setWarrantyF(
                e.target.value
              )
            }
            style={filterStyle}
          >
            <option value="">
              All Warranty
            </option>

            <option value="active">
              Active Warranty
            </option>

            <option value="expired">
              Expired Warranty
            </option>

            <option value="none">
              No Warranty
            </option>
          </select>

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
              border:
                '1px solid var(--border)',
              background:
                'var(--bg-card)',
              color:
                'var(--text-sub)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            <X size={13} />
            Clear Filters
          </button>

          {/* FIND & REPLACE */}

          <button
            type="button"
            onClick={() =>
              setShowReplace(true)
            }
            style={{
              padding: '8px 12px',
              borderRadius: 5,
              border:
                '1px solid var(--border)',
              background:
                'var(--bg-card)',
              color:
                'var(--text-sub)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Find & Replace
          </button>

          {/* ADD */}

          <button
            type="button"
            onClick={() =>
              setShowAdd(true)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 5,
              border: 'none',
              background:
                'var(--red-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginLeft: 'auto',
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
            padding:
              '1rem 1.4rem',
            borderBottom:
              '1px solid var(--border)',
            background:
              'var(--bg-mid)',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize:
                '0.87rem',
              fontWeight: 600,
            }}
          >
            Assets ({filteredAssets.length})

            {filteredAssets.length !==
              allAssets.length && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize:
                    '0.7rem',
                  color:
                    'var(--text-muted)',
                }}
              >
                of {allAssets.length}
              </span>
            )}
          </span>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={expandAll}
              style={smallActionButton}
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={
                collapseAll
              }
              style={smallActionButton}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* TABLE CONTENT */}

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '2rem',
                textAlign:
                  'center',
                color:
                  'var(--text-muted)',
              }}
            >
              Loading assets...
            </div>
          ) : filteredAssets.length ===
            0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign:
                  'center',
                color:
                  'var(--text-muted)',
              }}
            >
              No assets found.
            </div>
          ) : (
            <div>
              {categories.map(
                (category) => {
                  const expanded =
                    expandedCats.has(
                      category
                    )

                  const categoryAssets =
                    groupedAssets[
                      category
                    ]

                  return (
                    <div
                      key={category}
                      style={{
                        borderBottom:
                          '1px solid var(--border-mid)',
                      }}
                    >
                      {/* CATEGORY HEADER */}

                      <div
                        onClick={() =>
                          toggleCategory(
                            category
                          )
                        }
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          padding:
                            '12px 1.4rem',
                          background:
                            'rgba(198,40,40,0.04)',
                          cursor:
                            'pointer',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 10,
                          }}
                        >
                          <Boxes
                            size={16}
                            color="var(--red-primary)"
                          />

                          <span
                            style={{
                              fontSize:
                                '0.82rem',
                              fontWeight: 700,
                              color:
                                'var(--text-main)',
                              textTransform:
                                'uppercase',
                              letterSpacing:
                                '0.05em',
                            }}
                          >
                            {category}
                          </span>

                          <span
                            style={{
                              fontSize:
                                '0.65rem',
                              color:
                                'var(--text-muted)',
                              background:
                                'var(--bg-card)',
                              padding:
                                '2px 8px',
                              borderRadius:
                                10,
                              border:
                                '1px solid var(--border)',
                            }}
                          >
                            {
                              categoryAssets.length
                            }{' '}
                            asset
                            {categoryAssets.length >
                            1
                              ? 's'
                              : ''}
                          </span>
                        </div>

                        {expanded ? (
                          <ChevronUp
                            size={16}
                            color="var(--text-muted)"
                          />
                        ) : (
                          <ChevronDown
                            size={16}
                            color="var(--text-muted)"
                          />
                        )}
                      </div>

                      {/* CATEGORY TABLE */}

                      {expanded && (
                        <table
                          style={{
                            width:
                              '100%',
                            borderCollapse:
                              'collapse',
                            minWidth:
                              1000,
                          }}
                        >
                          <thead>
                            <tr>
                              <TableHeader title="Code" />
                              <TableHeader title="Asset Name" />
                              <TableHeader title="Category" />
                              <TableHeader title="Brand / Model" />
                              <TableHeader title="Status" />
                              <TableHeader title="Assigned To" />
                              <TableHeader title="Warranty" />
                              <TableHeader title="Actions" />
                            </tr>
                          </thead>

                          <tbody>
                            {categoryAssets.map(
                              (asset) => {
                                const id =
                                  asset._id ||
                                  asset.id ||
                                  ''

                                const expired =
                                  isWarrantyExpired(
                                    asset.warranty_until
                                  )

                                return (
                                  <tr
                                    key={
                                      id ||
                                      asset.asset_code
                                    }
                                    style={{
                                      borderBottom:
                                        '1px solid var(--border-mid)',
                                    }}
                                  >
                                    {/* CODE */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontFamily:
                                          'IBM Plex Mono',
                                        color:
                                          'var(--red-primary)',
                                        fontSize:
                                          '0.77rem',
                                        whiteSpace:
                                          'nowrap',
                                      }}
                                    >
                                      {
                                        asset.asset_code
                                      }
                                    </td>

                                    {/* NAME */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontSize:
                                          '0.83rem',
                                        fontWeight: 500,
                                        color:
                                          'var(--text-main)',
                                      }}
                                    >
                                      {
                                        asset.name
                                      }
                                    </td>

                                    {/* CATEGORY */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontSize:
                                          '0.8rem',
                                        color:
                                          'var(--text-sub)',
                                      }}
                                    >
                                      {
                                        asset.category ||
                                        '—'
                                      }
                                    </td>

                                    {/* BRAND MODEL */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontSize:
                                          '0.78rem',
                                        color:
                                          'var(--text-muted)',
                                      }}
                                    >
                                      {[
                                        asset.brand,
                                        asset.model,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          ' / '
                                        ) ||
                                        '—'}
                                    </td>

                                    {/* STATUS */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                      }}
                                    >
                                      <span
                                        style={{
                                          display:
                                            'inline-block',
                                          fontSize:
                                            '0.73rem',
                                          fontWeight: 600,
                                          padding:
                                            '3px 9px',
                                          borderRadius:
                                            12,
                                          color:
                                            STATUS_COLOR[
                                              asset.status ||
                                                ''
                                            ] ||
                                            'var(--text-muted)',
                                          background:
                                            `${
                                              STATUS_COLOR[
                                                asset.status ||
                                                  ''
                                              ] ||
                                              '#888'
                                            }18`,
                                        }}
                                      >
                                        {
                                          asset.status
                                        }
                                      </span>
                                    </td>

                                    {/* ASSIGNED */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontSize:
                                          '0.78rem',
                                        color:
                                          'var(--text-sub)',
                                      }}
                                    >
                                      {asset.assigned_to_name ? (
                                        <div
                                          style={{
                                            display:
                                              'flex',
                                            alignItems:
                                              'center',
                                            gap: 6,
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: 22,
                                              height: 22,
                                              borderRadius:
                                                '50%',
                                              background:
                                                '#1565c0',
                                              color:
                                                '#fff',
                                              display:
                                                'flex',
                                              alignItems:
                                                'center',
                                              justifyContent:
                                                'center',
                                              fontSize:
                                                '0.6rem',
                                              fontWeight: 700,
                                            }}
                                          >
                                            {asset.assigned_to_name
                                              .charAt(
                                                0
                                              )
                                              .toUpperCase()}
                                          </span>

                                          <span
                                            style={{
                                              fontWeight: 500,
                                            }}
                                          >
                                            {
                                              asset.assigned_to_name
                                            }
                                          </span>
                                        </div>
                                      ) : (
                                        <span
                                          style={{
                                            color:
                                              'var(--text-muted)',
                                          }}
                                        >
                                          —
                                        </span>
                                      )}
                                    </td>

                                    {/* WARRANTY */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                        fontSize:
                                          '0.75rem',
                                        color:
                                          expired
                                            ? '#c62828'
                                            : 'var(--text-muted)',
                                        fontWeight:
                                          expired
                                            ? 600
                                            : 400,
                                        whiteSpace:
                                          'nowrap',
                                      }}
                                    >
                                      {asset.warranty_until
                                        ? new Date(
                                            asset.warranty_until
                                          ).toLocaleDateString(
                                            'en-GB'
                                          )
                                        : '—'}

                                      {expired &&
                                        asset.warranty_until && (
                                          <div
                                            style={{
                                              fontSize:
                                                '0.6rem',
                                              marginTop: 2,
                                            }}
                                          >
                                            Expired
                                          </div>
                                        )}
                                    </td>

                                    {/* ACTIONS */}

                                    <td
                                      style={{
                                        padding:
                                          '12px 1.2rem',
                                      }}
                                    >
                                      <div
                                        style={{
                                          display:
                                            'flex',
                                          gap: 4,
                                          flexWrap:
                                            'nowrap',
                                        }}
                                      >
                                        {/* ASSIGN */}

                                        {asset.status ===
                                          'Available' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setAssignAsset(
                                                asset
                                              )
                                            }
                                            style={{
                                              display:
                                                'flex',
                                              alignItems:
                                                'center',
                                              gap: 4,
                                              padding:
                                                '3px 7px',
                                              borderRadius:
                                                5,
                                              border:
                                                'none',
                                              background:
                                                '#1565c0',
                                              color:
                                                '#fff',
                                              cursor:
                                                'pointer',
                                              fontSize:
                                                '0.65rem',
                                              fontWeight: 600,
                                            }}
                                          >
                                            <UserPlus
                                              size={
                                                12
                                              }
                                            />
                                            Assign
                                          </button>
                                        )}

                                        {/* UNASSIGN */}

                                        {asset.status ===
                                          'Assigned' && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setUnassignConfirm(
                                                id
                                              )
                                            }
                                            style={{
                                              display:
                                                'flex',
                                              alignItems:
                                                'center',
                                              gap: 4,
                                              padding:
                                                '3px 8px',
                                              borderRadius:
                                                5,
                                              border:
                                                '1px solid #e65100',
                                              background:
                                                'rgba(230,81,0,0.08)',
                                              color:
                                                '#e65100',
                                              cursor:
                                                'pointer',
                                              fontSize:
                                                '0.68rem',
                                              fontWeight: 600,
                                            }}
                                          >
                                            <Unlock
                                              size={
                                                12
                                              }
                                            />
                                            Unassign
                                          </button>
                                        )}

                                        {/* EDIT */}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditAsset(
                                              asset
                                            )
                                          }
                                          style={{
                                            display:
                                              'flex',
                                            alignItems:
                                              'center',
                                            gap: 4,
                                            padding:
                                              '3px 7px',
                                            borderRadius:
                                              5,
                                            border:
                                              'none',
                                            background:
                                              'var(--red-primary)',
                                            color:
                                              '#fff',
                                            cursor:
                                              'pointer',
                                            fontSize:
                                              '0.65rem',
                                            fontWeight: 600,
                                          }}
                                        >
                                          <Pencil
                                            size={
                                              12
                                            }
                                          />
                                          Edit
                                        </button>

                                        {/* DELETE */}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (
                                              id
                                            ) {
                                              handleDelete(
                                                id
                                              )
                                            }
                                          }}
                                          style={{
                                            display:
                                              'flex',
                                            alignItems:
                                              'center',
                                            gap: 4,
                                            padding:
                                              '3px 7px',
                                            borderRadius:
                                              5,
                                            border:
                                              '1px solid rgba(198,40,40,0.25)',
                                            background:
                                              'rgba(198,40,40,0.08)',
                                            color:
                                              '#c62828',
                                            cursor:
                                              'pointer',
                                            fontSize:
                                              '0.65rem',
                                            fontWeight: 600,
                                          }}
                                        >
                                          <Trash2
                                            size={
                                              12
                                            }
                                          />
                                          Del
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              }
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          FIND & REPLACE MODAL
      =================================================== */}

      <Modal
        open={showReplace}
        onClose={() =>
          setShowReplace(false)
        }
        title="Find & Replace Category"
      >
        <ReplaceCategoryForm
          onSuccess={afterSave}
          onCancel={() =>
            setShowReplace(false)
          }
          setMsg={setMsg}
        />
      </Modal>

      {/* ===================================================
          ADD ASSET MODAL
      =================================================== */}

      <Modal
        open={showAdd}
        onClose={() =>
          setShowAdd(false)
        }
        title="Add New Asset"
      >
        <AssetForm
          employees={employees}
          onSuccess={afterSave}
          onCancel={() =>
            setShowAdd(false)
          }
          setMsg={setMsg}
        />
      </Modal>

      {/* ===================================================
          EDIT ASSET MODAL
      =================================================== */}

      {editAsset && (
        <Modal
          open={true}
          onClose={() =>
            setEditAsset(null)
          }
          title="Edit Asset"
        >
          <AssetForm
            existing={editAsset}
            employees={employees}
            onSuccess={afterSave}
            onCancel={() =>
              setEditAsset(null)
            }
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
          onClose={() =>
            setAssignAsset(null)
          }
          title="Assign Asset to Employee"
        >
          <AssignForm
            asset={assignAsset}
            employees={employees}
            onAssign={handleAssign}
            onCancel={() =>
              setAssignAsset(null)
            }
            setMsg={setMsg}
          />
        </Modal>
      )}

      {/* ===================================================
          UNASSIGN CONFIRMATION
      =================================================== */}

      {unassignConfirm && (
        <Modal
          open={true}
          onClose={() =>
            setUnassignConfirm(null)
          }
          title="Confirm Unassign"
        >
          <div
            style={{
              padding: '1rem',
              maxWidth: 400,
            }}
          >
            <div
              style={{
                padding: '0.8rem',
                marginBottom: '1rem',
                borderRadius: 6,
                background:
                  'rgba(230,81,0,0.08)',
                border:
                  '1px solid rgba(230,81,0,0.2)',
                color:
                  'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              Are you sure you want to unassign
              this asset from the employee?
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent:
                  'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setUnassignConfirm(
                    null
                  )
                }
                style={
                  secondaryButtonStyle
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const id =
                    unassignConfirm

                  setUnassignConfirm(
                    null
                  )

                  await handleUnassign(
                    id
                  )
                }}
                style={{
                  padding:
                    '8px 18px',
                  borderRadius: 5,
                  border: 'none',
                  background:
                    '#e65100',
                  color: '#fff',
                  cursor:
                    'pointer',
                  fontSize:
                    '0.8rem',
                  fontWeight: 600,
                }}
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