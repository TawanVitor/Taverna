import { useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import PlayerPage from './pages/PlayerPage'
import MasterPage from './pages/MasterPage'
import { useState } from 'react'

export default function App() {
  const { user, configError } = useAuth()
  const [view, setView] = useState({ page: 'lobby' })

  if (configError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at 50% 30%, #072914 0%, #000000 65%)' }}>
        <div className="card" style={{ maxWidth: 520, width: '100%', padding: '2rem' }}>
          <h1>Configuração do Supabase faltando</h1>
          <p>O app precisa de um arquivo <code>.env</code> com as variáveis abaixo:</p>
          <pre style={{ background: '#111', color: '#a8ff94', padding: '1rem', borderRadius: 8 }}>VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...</pre>
          <p>Copie o modelo de <code>.env.example</code> e preencha seus dados do Supabase.</p>
        </div>
      </div>
    )
  }

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
