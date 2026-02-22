import { useState } from 'react'
import { createTicket, classifyTicket } from '../api'

const CATEGORIES = ['billing', 'technical', 'account', 'general']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

export default function TicketForm({ onTicketCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  })
  const [classifying, setClassifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleClassify = async () => {
    if (!form.title && !form.description) {
      setMessage({ type: 'error', text: 'Enter a title or description before classifying.' })
      return
    }
    setClassifying(true)
    setMessage(null)
    try {
      const res = await classifyTicket(form.title, form.description)
      setForm((prev) => ({
        ...prev,
        category: res.data.category,
        priority: res.data.priority,
      }))
      setMessage({ type: 'success', text: `AI suggested: category="${res.data.category}", priority="${res.data.priority}"` })
    } catch {
      setMessage({ type: 'error', text: 'Classification failed. Defaults retained.' })
    } finally {
      setClassifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Title and description are required.' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await createTicket(form)
      setForm({ title: '', description: '', category: 'general', priority: 'medium' })
      setMessage({ type: 'success', text: 'Ticket submitted successfully!' })
      if (onTicketCreated) onTicketCreated()
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit ticket. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>Submit a Support Ticket</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Brief summary of your issue"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your issue in detail..."
            required
          />
        </div>

        <div className="classify-bar">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClassify}
            disabled={classifying}
          >
            {classifying ? 'Classifying...' : '✨ AI Classify'}
          </button>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Auto-suggest category &amp; priority using AI
          </span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
