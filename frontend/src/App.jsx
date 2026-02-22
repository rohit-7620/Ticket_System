import { useState } from 'react'
import TicketForm from './components/TicketForm'
import TicketList from './components/TicketList'
import TicketStats from './components/TicketStats'

const TABS = [
  { id: 'submit', label: '+ New Ticket' },
  { id: 'list', label: '🎫 Tickets' },
  { id: 'stats', label: '📊 Statistics' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('list')
  const [refreshSignal, setRefreshSignal] = useState(0)

  const handleTicketCreated = () => {
    setRefreshSignal((n) => n + 1)
    setActiveTab('list')
  }

  return (
    <div className="app">
      <header>
        <span style={{ fontSize: '1.8rem' }}>🎧</span>
        <h1>Support Ticket System</h1>
      </header>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'submit' && (
        <TicketForm onTicketCreated={handleTicketCreated} />
      )}
      {activeTab === 'list' && (
        <TicketList refreshSignal={refreshSignal} />
      )}
      {activeTab === 'stats' && (
        <TicketStats />
      )}
    </div>
  )
}
