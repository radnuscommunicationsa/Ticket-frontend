'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { PageHeader, Alert } from '@/components/ui'
import api from '@/lib/api'
import { RefreshCw, Trash2 as TrashIcon, AlertTriangle } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  open: '#1565c0',
  'in-progress': '#ef6c00',
  resolved: '#2e7d32',
  closed: '#616161',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#2e7d32',
  medium: '#ef6c00',
  high: '#c62828',
  critical: '#b71c1c',
}

const STATUS_OPTIONS = [
  'all',
  'open',
  'in-progress',
  'resolved',
  'closed',
]

/* =========================================================
   MAIN PAGE CONTENT
   ========================================================= */

function AdminTicketsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [selected, setSelected] = useState<string[]>([])

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    type: 'single' | 'bulk'
    id?: string
  }>({
    show: false,
    type: 'single',
  })

  const [refreshing, setRefreshing] = useState(false)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  /* =========================================================
     SYNC FILTERS FROM URL
     ========================================================= */

  useEffect(() => {
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority') || 'all'

    setStatusFilter(status)
    setPriorityFilter(priority)
  }, [searchParams])

  /* =========================================================
     LOAD TICKETS
     ========================================================= */

  const loadTickets = async () => {
    try {
      setLoading(true)
      setMsg(null)

      const res = await api.get('/tickets')

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.tickets)
          ? res.data.tickets
          : []

      setTickets(data)
    } catch (err: any) {
      console.error('Failed to load tickets:', err)

      setMsg({
        type: 'error',
        text:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to load tickets',
      })

      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  /* =========================================================
     RESET SELECTION WHEN FILTER CHANGES
     ========================================================= */

  useEffect(() => {
    setSelected([])
  }, [statusFilter, priorityFilter])

  /* =========================================================
     REFRESH
     ========================================================= */

  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)

    try {
      await loadTickets()
    } finally {
      setRefreshing(false)
    }
  }

  /* =========================================================
     SINGLE DELETE
     ========================================================= */

  const handleDelete = (
    id: string,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.stopPropagation()

    if (!id) return

    setConfirmModal({
      show: true,
      type: 'single',
      id,
    })
  }

  const confirmSingleDelete = async () => {
    const id = confirmModal.id

    if (!id) {
      setConfirmModal({
        show: false,
        type: 'single',
      })
      return
    }

    setConfirmModal({
      show: false,
      type: 'single',
    })

    try {
      await api.delete(`/tickets/${id}`)

      setMsg({
        type: 'success',
        text: 'Ticket deleted successfully.',
      })

      setSelected((prev) => prev.filter((item) => item !== id))

      await loadTickets()
    } catch (err: any) {
      console.error('Delete ticket error:', err)

      setMsg({
        type: 'error',
        text:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to delete ticket',
      })
    }
  }

  /* =========================================================
     FILTER TICKETS
     ========================================================= */

  const filteredTickets = tickets.filter((ticket: any) => {
    const statusOk =
      statusFilter === 'all' ||
      ticket?.status === statusFilter

    const priorityOk =
      priorityFilter === 'all' ||
      ticket?.priority === priorityFilter

    return statusOk && priorityOk
  })

  /* =========================================================
     SELECT ALL
     ========================================================= */

  const getTicketId = (ticket: any): string => {
    return String(ticket?._id || ticket?.id || '')
  }

  const toggleSelectAll = () => {
    const validIds = filteredTickets
      .map(getTicketId)
      .filter(Boolean)

    if (
      validIds.length > 0 &&
      selected.length === validIds.length &&
      validIds.every((id) => selected.includes(id))
    ) {
      setSelected([])
    } else {
      setSelected(validIds)
    }
  }

  /* =========================================================
     SELECT ONE
     ========================================================= */

  const toggleSelectOne = (id: string) => {
    if (!id) return

    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  /* =========================================================
     BULK DELETE
     ========================================================= */

  const handleBulkDelete = () => {
    if (selected.length === 0) return

    setConfirmModal({
      show: true,
      type: 'bulk',
    })
  }

  const confirmBulkDelete = async () => {
    if (selected.length === 0) {
      setConfirmModal({
        show: false,
        type: 'bulk',
      })
      return
    }

    const idsToDelete = [...selected]

    setConfirmModal({
      show: false,
      type: 'bulk',
    })

    try {
      await Promise.all(
        idsToDelete.map((id) =>
          api.delete(`/tickets/${id}`)
        )
      )

      setMsg({
        type: 'success',
        text: `${idsToDelete.length} ticket(s) deleted successfully.`,
      })

      setSelected([])

      await loadTickets()
    } catch (err: any) {
      console.error('Bulk delete error:', err)

      setMsg({
        type: 'error',
        text:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to delete tickets',
      })

      await loadTickets()
    }
  }

  /* =========================================================
     STATUS FILTER CHANGE
     ========================================================= */

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)

    const params = new URLSearchParams(
      searchParams.toString()
    )

    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }

    const query = params.toString()

    router.push(
      `/admin/tickets${query ? `?${query}` : ''}`
    )
  }

  /* =========================================================
     PRIORITY FILTER CHANGE
     ========================================================= */

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value)

    const params = new URLSearchParams(
      searchParams.toString()
    )

    if (value === 'all') {
      params.delete('priority')
    } else {
      params.set('priority', value)
    }

    const query = params.toString()

    router.push(
      `/admin/tickets${query ? `?${query}` : ''}`
    )
  }

  /* =========================================================
     STATUS COUNTS
     ========================================================= */

  const statusCounts: Record<string, number> =
    tickets.reduce(
      (
        acc: Record<string, number>,
        ticket: any
      ) => {
        const status = ticket?.status || 'unknown'

        acc[status] = (acc[status] || 0) + 1

        return acc
      },
      {}
    )

  /* =========================================================
     PRIORITY COUNTS
     ========================================================= */

  const priorityCounts: Record<string, number> =
    tickets.reduce(
      (
        acc: Record<string, number>,
        ticket: any
      ) => {
        const priority = ticket?.priority || 'unknown'

        acc[priority] = (acc[priority] || 0) + 1

        return acc
      },
      {}
    )

  /* =========================================================
     SAFE DATE FORMAT
     ========================================================= */

  const formatDate = (value: any) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleDateString()
  }

  /* =========================================================
     SAFE COLORS
     ========================================================= */

  const getStatusColor = (status: string) => {
    return STATUS_COLOR[status] || '#616161'
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLOR[priority] || '#616161'
  }

  /* =========================================================
     MODAL CLOSE
     ========================================================= */

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({
      ...prev,
      show: false,
    }))
  }

  const allVisibleSelected =
    filteredTickets.length > 0 &&
    filteredTickets.every((ticket) =>
      selected.includes(getTicketId(ticket))
    )

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <AppLayout role="admin">
      <PageHeader
        breadcrumb="TICKETS"
        title="All Tickets"
        subtitle="Manage all employee support tickets"
      />

      {/* MESSAGE */}

      {msg && (
        <Alert
          type={msg.type}
          message={msg.text}
        />
      )}

      {/* =====================================================
          MAIN CARD
          ===================================================== */}

      <div
        className="card"
        style={{
          overflow: 'hidden',
          marginTop: '1rem',
        }}
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <div
          style={{
            padding: '0.8rem 1.1rem',
            borderBottom:
              '1px solid var(--border)',
            background: 'var(--bg-mid)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* TITLE */}

          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-main)',
            }}
          >
            Total Tickets (
            {filteredTickets.length}
            {statusFilter !== 'all' ||
            priorityFilter !== 'all'
              ? ` of ${tickets.length}`
              : ''}
            )
          </span>

          {/* CONTROLS */}

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value
                )
              }
              style={{
                padding: '6px 10px',
                background:
                  'var(--bg-card)',
                color:
                  'var(--text-sub)',
                border:
                  '1px solid var(--border)',
                borderRadius: 5,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === 'all'
                      ? `All Statuses (${tickets.length})`
                      : `${
                          status
                            .charAt(0)
                            .toUpperCase() +
                          status.slice(1)
                        } (${
                          statusCounts[
                            status
                          ] || 0
                        })`}
                  </option>
                )
              )}
            </select>

            {/* PRIORITY FILTER */}

            <select
              value={priorityFilter}
              onChange={(e) =>
                handlePriorityChange(
                  e.target.value
                )
              }
              style={{
                padding: '6px 10px',
                background:
                  'var(--bg-card)',
                color:
                  'var(--text-sub)',
                border:
                  '1px solid var(--border)',
                borderRadius: 5,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">
                All Priorities (
                {tickets.length})
              </option>

              <option value="low">
                Low (
                {priorityCounts.low || 0})
              </option>

              <option value="medium">
                Medium (
                {priorityCounts.medium || 0})
              </option>

              <option value="high">
                High (
                {priorityCounts.high || 0})
              </option>

              <option value="critical">
                Critical (
                {priorityCounts.critical ||
                  0}
                )
              </option>
            </select>

            {/* BULK DELETE */}

            {selected.length > 0 && (
              <button
                onClick={
                  handleBulkDelete
                }
                style={{
                  padding:
                    '6px 14px',
                  background:
                    '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 5,
                  fontSize:
                    '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete Selected (
                {selected.length})
              </button>
            )}

            {/* REFRESH */}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh list"
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 6,
                padding:
                  '6px 12px',
                background:
                  'var(--bg-card)',
                color:
                  'var(--text-sub)',
                border:
                  '1px solid var(--border)',
                borderRadius: 5,
                fontSize:
                  '0.75rem',
                fontWeight: 600,
                cursor:
                  refreshing
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation:
                    refreshing
                      ? 'spin 0.8s linear infinite'
                      : 'none',
                }}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ===================================================
            TABLE
            =================================================== */}

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse',
            }}
          >
            <thead>
              <tr>
                {/* SELECT ALL */}

                <th
                  style={{
                    padding:
                      '9px 0.9rem',
                    borderBottom:
                      '1px solid var(--border)',
                    background:
                      'var(--bg-mid)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      allVisibleSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                    disabled={
                      filteredTickets.length ===
                      0
                    }
                  />
                </th>

                {/* HEADERS */}

                {[
                  'Ticket No',
                  'Subject',
                  'Employee',
                  'Department',
                  'Priority',
                  'Status',
                  'Created',
                  'Action',
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding:
                        '9px 0.9rem',
                      textAlign:
                        'left',
                      fontSize:
                        '0.63rem',
                      textTransform:
                        'uppercase',
                      letterSpacing:
                        '0.07em',
                      color:
                        'var(--text-muted)',
                      borderBottom:
                        '1px solid var(--border)',
                      background:
                        'var(--bg-mid)',
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding:
                        '2rem',
                      textAlign:
                        'center',
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length ===
                0 ? (
                /* EMPTY */

                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding:
                        '2rem',
                      textAlign:
                        'center',
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    {statusFilter ===
                      'all' &&
                    priorityFilter ===
                      'all'
                      ? 'No tickets found.'
                      : 'No tickets found for the selected filter.'}
                  </td>
                </tr>
              ) : (
                /* DATA */

                filteredTickets.map(
                  (ticket: any) => {
                    const ticketId =
                      getTicketId(
                        ticket
                      )

                    const status =
                      ticket?.status ||
                      'unknown'

                    const priority =
                      ticket?.priority ||
                      'unknown'

                    const statusColor =
                      getStatusColor(
                        status
                      )

                    const priorityColor =
                      getPriorityColor(
                        priority
                      )

                    return (
                      <tr
                        key={
                          ticketId ||
                          ticket.ticket_no
                        }
                        style={{
                          borderBottom:
                            '1px solid var(--border-mid)',
                        }}
                      >
                        {/* CHECKBOX */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(
                              ticketId
                            )}
                            onChange={() =>
                              toggleSelectOne(
                                ticketId
                              )
                            }
                            disabled={
                              !ticketId
                            }
                          />
                        </td>

                        {/* TICKET NO */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                            fontFamily:
                              'monospace',
                            fontWeight: 700,
                            color:
                              'var(--red-primary)',
                            whiteSpace:
                              'nowrap',
                            fontSize:
                              '0.78rem',
                          }}
                        >
                          {ticket?.ticket_no ||
                            '—'}
                        </td>

                        {/* SUBJECT */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                            color:
                              'var(--text-main)',
                            minWidth: 200,
                            fontSize:
                              '0.8rem',
                          }}
                        >
                          {ticket?.subject ||
                            '—'}
                        </td>

                        {/* EMPLOYEE */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                            whiteSpace:
                              'nowrap',
                            fontSize:
                              '0.8rem',
                          }}
                        >
                          {ticket?.emp_name ||
                            ticket?.employee_name ||
                            '—'}
                        </td>

                        {/* DEPARTMENT */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                            whiteSpace:
                              'nowrap',
                            fontSize:
                              '0.8rem',
                          }}
                        >
                          {ticket?.department ||
                            '—'}
                        </td>

                        {/* PRIORITY */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                          }}
                        >
                          <span
                            style={{
                              background: `${priorityColor}20`,
                              color:
                                priorityColor,
                              padding:
                                '3px 8px',
                              borderRadius:
                                20,
                              fontSize:
                                '0.66rem',
                              fontWeight: 700,
                              textTransform:
                                'uppercase',
                            }}
                          >
                            {priority}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                          }}
                        >
                          <span
                            style={{
                              background: `${statusColor}20`,
                              color:
                                statusColor,
                              padding:
                                '3px 8px',
                              borderRadius:
                                20,
                              fontSize:
                                '0.66rem',
                              fontWeight: 700,
                              textTransform:
                                'uppercase',
                            }}
                          >
                            {status}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                            color:
                              'var(--text-muted)',
                            whiteSpace:
                              'nowrap',
                            fontSize:
                              '0.72rem',
                          }}
                        >
                          {formatDate(
                            ticket?.created_at ||
                              ticket?.createdAt
                          )}
                        </td>

                        {/* ACTION */}

                        <td
                          style={{
                            padding:
                              '9px 0.9rem',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              gap: 5,
                            }}
                          >
                            {/* VIEW */}

                            <button
                              onClick={() =>
                                ticketId &&
                                router.push(
                                  `/admin/tickets/${ticketId}`
                                )
                              }
                              disabled={
                                !ticketId
                              }
                              style={{
                                padding:
                                  '4px 10px',
                                background:
                                  'var(--red-primary)',
                                color:
                                  '#fff',
                                border:
                                  'none',
                                borderRadius:
                                  5,
                                fontSize:
                                  '0.68rem',
                                fontWeight:
                                  600,
                                cursor:
                                  ticketId
                                    ? 'pointer'
                                    : 'not-allowed',
                                opacity:
                                  ticketId
                                    ? 1
                                    : 0.5,
                              }}
                            >
                              View
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={(
                                e
                              ) =>
                                handleDelete(
                                  ticketId,
                                  e
                                )
                              }
                              disabled={
                                !ticketId
                              }
                              style={{
                                padding:
                                  '4px 10px',
                                background:
                                  'transparent',
                                color:
                                  '#c62828',
                                border:
                                  '1px solid rgba(198,40,40,0.3)',
                                borderRadius:
                                  5,
                                fontSize:
                                  '0.68rem',
                                fontWeight:
                                  600,
                                cursor:
                                  ticketId
                                    ? 'pointer'
                                    : 'not-allowed',
                                opacity:
                                  ticketId
                                    ? 1
                                    : 0.5,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          CONFIRM DELETE MODAL
          ===================================================== */}

      {confirmModal.show && (
        <div
          onClick={
            closeConfirmModal
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              background:
                'var(--bg-card)',
              borderRadius: 12,
              width: '100%',
              maxWidth: 380,
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* MODAL CONTENT */}

            <div
              style={{
                padding:
                  '1.4rem',
                textAlign:
                  'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius:
                    '50%',
                  background:
                    'rgba(198,40,40,0.1)',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  margin:
                    '0 auto 14px',
                }}
              >
                <AlertTriangle
                  size={26}
                  color="#c62828"
                />
              </div>

              <h3
                style={{
                  fontSize:
                    '1rem',
                  fontWeight: 700,
                  color:
                    'var(--text-main)',
                  marginBottom: 6,
                }}
              >
                {confirmModal.type ===
                'bulk'
                  ? `Delete ${selected.length} selected ticket(s)?`
                  : 'Delete this ticket?'}
              </h3>

              <p
                style={{
                  fontSize:
                    '0.82rem',
                  color:
                    'var(--text-muted)',
                }}
              >
                This action cannot
                be undone.
              </p>
            </div>

            {/* MODAL BUTTONS */}

            <div
              style={{
                display:
                  'flex',
                borderTop:
                  '1px solid var(--border)',
              }}
            >
              {/* CANCEL */}

              <button
                onClick={
                  closeConfirmModal
                }
                style={{
                  flex: 1,
                  padding:
                    '12px',
                  border: 'none',
                  borderRight:
                    '1px solid var(--border)',
                  background:
                    'transparent',
                  color:
                    'var(--text-sub)',
                  cursor:
                    'pointer',
                  fontSize:
                    '0.85rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              {/* DELETE */}

              <button
                onClick={
                  confirmModal.type ===
                  'bulk'
                    ? confirmBulkDelete
                    : confirmSingleDelete
                }
                style={{
                  flex: 1,
                  padding:
                    '12px',
                  border: 'none',
                  background:
                    '#c62828',
                  color:
                    '#fff',
                  cursor:
                    'pointer',
                  fontSize:
                    '0.85rem',
                  fontWeight: 600,
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: 6,
                }}
              >
                <TrashIcon
                  size={14}
                />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

/* =========================================================
   PAGE WRAPPER

   IMPORTANT:
   useSearchParams() is inside AdminTicketsContent.
   Suspense boundary prevents Vercel prerender/build error.
   ========================================================= */

export default function AdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout role="admin">
          <div
            style={{
              minHeight:
                '50vh',
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              color:
                'var(--text-muted)',
              fontSize:
                '0.9rem',
            }}
          >
            Loading tickets...
          </div>
        </AppLayout>
      }
    >
      <AdminTicketsContent />
    </Suspense>
  )
}