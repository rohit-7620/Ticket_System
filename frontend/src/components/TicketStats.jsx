import { useState, useEffect } from 'react'
import { getStats } from '../api'

export default function TicketStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getStats()
      setStats(res.data)
    } catch {
      setError('Failed to load statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <div className="loading">Loading statistics...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!stats) return null

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.by_status?.open ?? 0}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.by_status?.in_progress ?? 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.by_status?.resolved ?? 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="stat-breakdown">
        <div className="stat-breakdown-card">
          <h3>By Status</h3>
          {Object.entries(stats.by_status).map(([key, val]) => (
            <div className="stat-row" key={key}>
              <span className={`badge badge-${key}`}>{key.replace('_', ' ')}</span>
              <span className="stat-row-count">{val}</span>
            </div>
          ))}
        </div>

        <div className="stat-breakdown-card">
          <h3>By Category</h3>
          {Object.entries(stats.by_category).map(([key, val]) => (
            <div className="stat-row" key={key}>
              <span className={`badge badge-${key}`}>{key}</span>
              <span className="stat-row-count">{val}</span>
            </div>
          ))}
        </div>

        <div className="stat-breakdown-card">
          <h3>By Priority</h3>
          {Object.entries(stats.by_priority).map(([key, val]) => (
            <div className="stat-row" key={key}>
              <span className={`badge badge-${key}`}>{key}</span>
              <span className="stat-row-count">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
          ↻ Refresh Stats
        </button>
      </div>
    </div>
  )
}
