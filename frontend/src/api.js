import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const getTickets = (params = {}) => api.get('/tickets/', { params })

export const createTicket = (data) => api.post('/tickets/', data)

export const updateTicket = (id, data) => api.patch(`/tickets/${id}/`, data)

export const getStats = () => api.get('/tickets/stats/')

export const classifyTicket = (title, description) =>
  api.post('/tickets/classify/', { title, description })

export default api
