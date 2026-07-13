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
        <div className="spinner">
          <svg className="spinner-eye" width="28" height="18" viewBox="0 0 28 18">
            <defs>
              <radialGradient id="irisGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#af8434" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M1,9 Q14,-4 27,9 Q14,22 1,9 Z" fill="#0d2216" stroke="#af8434" strokeWidth="1.2" />
            <circle cx="14" cy="9" r="6" fill="#181301" stroke="#7a5510" strokeWidth="1" />
            <circle cx="14" cy="9" r="3.2" fill="#000" />
            <circle cx="14" cy="9" r="3.2" fill="url(#irisGlow)" opacity="0.6" />
            <circle cx="15.5" cy="7.5" r="1" fill="#e8b84b" opacity="0.7" />
          </svg>
        </div>
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
