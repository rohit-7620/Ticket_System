import { useEffect, useMemo, useState } from 'react'
import { classifyDescription, createTicket, fetchStats, fetchTickets, updateTicket } from './api'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS } from './constants'

const initialForm = {
  title: '',
  description: '',
  category: 'general',
  priority: 'medium',
}

function truncate(text, max = 140) {
  if (!text) return ''
  return text.length <= max ? text : `${text.slice(0, max)}...`
}

export default function App() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClassifying, setIsClassifying] = useState(false)
  const [classifyError, setClassifyError] = useState('')
  const [error, setError] = useState('')
  const [hasOverriddenCategory, setHasOverriddenCategory] = useState(false)
  const [hasOverriddenPriority, setHasOverriddenPriority] = useState(false)

  const canClassify = useMemo(() => form.description.trim().length >= 15, [form.description])

  const loadTickets = async () => {
    const data = await fetchTickets(filters)
    setTickets(data)
  }

  const loadStats = async () => {
    const data = await fetchStats()
    setStats(data)
  }

  useEffect(() => {
    loadTickets().catch(() => setError('Could not load tickets.'))
  }, [filters])

  useEffect(() => {
    loadStats().catch(() => setError('Could not load stats.'))
  }, [])

  useEffect(() => {
    if (!canClassify) return

    const timer = setTimeout(async () => {
      setClassifyError('')
      setIsClassifying(true)
      try {
        const suggestion = await classifyDescription(form.description)
        setForm((prev) => ({
          ...prev,
          category: hasOverriddenCategory ? prev.category : suggestion.suggested_category,
          priority: hasOverriddenPriority ? prev.priority : suggestion.suggested_priority,
        }))
      } catch {
        setClassifyError('LLM suggestion unavailable. You can still submit manually.')
      } finally {
        setIsClassifying(false)
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [form.description, canClassify, hasOverriddenCategory, hasOverriddenPriority])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createTicket(form)
      setForm(initialForm)
      setHasOverriddenCategory(false)
      setHasOverriddenPriority(false)
      await Promise.all([loadTickets(), loadStats()])
    } catch (submitError) {
      setError(`Could not submit ticket: ${submitError.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      await updateTicket(ticketId, { status: nextStatus })
      await Promise.all([loadTickets(), loadStats()])
    } catch {
      setError('Could not update ticket status.')
    }
  }

  return (
    <div className="container">
      <h1>Support Ticket System</h1>

      <section className="panel">
        <h2>Submit Ticket</h2>
        <form onSubmit={handleSubmit} className="grid">
          <label>
            Title
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          <label>
            Description
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => {
                setHasOverriddenCategory(true)
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }}
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => {
                setHasOverriddenPriority(true)
                setForm((prev) => ({ ...prev, priority: e.target.value }))
              }}
            >
              {PRIORITY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={isSubmitting || isClassifying}>
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>

          {isClassifying ? <p className="hint">Classifying description...</p> : null}
          {classifyError ? <p className="hint warning">{classifyError}</p> : null}
        </form>
      </section>

      <section className="panel">
        <h2>Stats</h2>
        {stats ? (
          <div className="stats-grid">
            <div>Total Tickets: {stats.total_tickets}</div>
            <div>Open Tickets: {stats.open_tickets}</div>
            <div>Avg Tickets/Day: {stats.avg_tickets_per_day}</div>
            <div>
              Priority Breakdown:{' '}
              {Object.entries(stats.priority_breakdown)
                .map(([key, value]) => `${key}: ${value}`)
                .join(' | ')}
            </div>
            <div>
              Category Breakdown:{' '}
              {Object.entries(stats.category_breakdown)
                .map(([key, value]) => `${key}: ${value}`)
                .join(' | ')}
            </div>
          </div>
        ) : (
          <p>Loading stats...</p>
        )}
      </section>

      <section className="panel">
        <h2>Tickets</h2>

        <div className="filters">
          <input
            placeholder="Search title and description"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="hint warning">{error}</p> : null}

        <div className="list">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="ticket-card">
              <h3>{ticket.title}</h3>
              <p>{truncate(ticket.description)}</p>
              <p>
                Category: <strong>{ticket.category}</strong> | Priority: <strong>{ticket.priority}</strong>
              </p>
              <p>Created At: {new Date(ticket.created_at).toLocaleString()}</p>
              <label>
                Status:
                <select value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)}>
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
