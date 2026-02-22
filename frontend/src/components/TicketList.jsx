import { useState, useEffect, useCallback } from 'react'
import { getTickets, updateTicket } from '../api'

const CATEGORIES = ['', 'billing', 'technical', 'account', 'general']
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical']
const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed']

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
}

function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>
}

function CategoryBadge({ category }) {
  return <span className={`badge badge-${category}`}>{category}</span>
}

export default function TicketList({ refreshSignal }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', category: '', priority: '', status: '' })
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.category) params.category = filters.category
      if (filters.priority) params.priority = filters.priority
      if (filters.status) params.status = filters.status
      const res = await getTickets(params)
      setTickets(res.data.results ?? res.data)
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchTickets() }, [fetchTickets, refreshSignal])

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const res = await updateTicket(id, { status: newStatus })
      setTickets((prev) => prev.map((t) => (t.id === id ? res.data : t)))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="card">
      <h2>
        Tickets
        <button className="btn btn-secondary btn-sm refresh-btn" onClick={fetchTickets}>
          ↻ Refresh
        </button>
      </h2>

      <div className="filters">
        <input
          name="search"
          placeholder="Search title or description..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>
          ))}
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}</option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '2rem' }}>🎫</div>
          <p>No tickets found. Try adjusting your filters.</p>
        </div>
      ) : (
        <table className="ticket-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <div className="ticket-title">{t.title}</div>
                  <div className="ticket-desc">{t.description}</div>
                </td>
                <td><CategoryBadge category={t.category} /></td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  <select
                    className="status-select"
                    value={t.status}
                    disabled={updatingId === t.id}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  >
                    {STATUSES.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
