const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function buildQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value)
  })
  return query.toString()
}

export async function fetchTickets(filters = {}) {
  const qs = buildQuery(filters)
  const response = await fetch(`${API_BASE}/tickets/${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch tickets')
  return response.json()
}

export async function createTicket(payload) {
  const response = await fetch(`${API_BASE}/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(JSON.stringify(errorData))
  }
  return response.json()
}

export async function updateTicket(ticketId, payload) {
  const response = await fetch(`${API_BASE}/tickets/${ticketId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to update ticket')
  return response.json()
}

export async function classifyDescription(description) {
  const response = await fetch(`${API_BASE}/tickets/classify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!response.ok) throw new Error('Failed to classify description')
  return response.json()
}

export async function fetchStats() {
  const response = await fetch(`${API_BASE}/tickets/stats/`)
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}
