import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        toast('Conta criada! Verifique seu e-mail para confirmar.')
      }
    } catch (err) {
      toast(err.message || 'Erro ao entrar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(ellipse at 50% 30%, #1a1208 0%, #0c0a08 65%)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #e8b84b, #7a5510)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 1rem',
          boxShadow: '0 0 40px rgba(200,150,40,0.25)',
        }}>🐙</div>
        <h1 style={{ marginBottom: '0.25rem' }}>Taverna</h1>
        <p style={{ color: 'var(--text-md)', fontSize: '0.9rem', fontStyle: 'italic' }}>
          Call of Cthulhu — Gestão de Fichas
        </p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          <button
            className={`tab-btn${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
          >Entrar</button>
          <button
            className={`tab-btn${mode === 'register' ? ' active' : ''}`}
            onClick={() => setMode('register')}
          >Criar conta</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="investigador@arkham.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field-row">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? '...' : mode === 'login' ? 'Entrar na taverna' : 'Criar conta gratuita'}
          </button>
        </form>

        {mode === 'register' && (
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            Após criar a conta, confirme seu e-mail para ativar o acesso.
          </p>
        )}
      </div>
    </div>
  )
}
