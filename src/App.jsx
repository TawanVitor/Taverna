import { useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import PlayerPage from './pages/PlayerPage'
import MasterPage from './pages/MasterPage'
import { useState } from 'react'

export default function App() {
  const { user } = useAuth()
  const [view, setView] = useState({ page: 'lobby' })

  // Ainda carregando a sessão de auth
  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (view.page === 'player') {
    return (
      <PlayerPage
        session={view.session}
        onBack={() => setView({ page: 'lobby' })}
      />
    )
  }

  if (view.page === 'master') {
    return (
      <MasterPage
        session={view.session}
        onBack={() => setView({ page: 'lobby' })}
      />
    )
  }

  return (
    <LobbyPage
      onEnterSession={(session, isMaster) =>
        setView({ page: isMaster ? 'master' : 'player', session })
      }
    />
  )
}
