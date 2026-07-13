import { useState, useEffect } from 'react'
import Marquee from 'react-fast-marquee'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'

function CampaignTitle({ name }) {
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  function handleEnter() {
    setPlaying(true)
  }

  function handleLeave() {
    setPlaying(false)
    setResetKey(k => k + 1)
  }

  return (
    <div
      style={{ overflow: 'hidden', maxWidth: '100%', marginBottom: '0.5rem' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {playing ? (
        <Marquee
          key={resetKey}
          play={true}
          speed={35}
          gradient={false}
          loop={1}
        >
          <span className="session-card-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem',
            color: 'var(--gold-lt)',
            lineHeight: 1.3,
            paddingRight: '3rem',
          }}>
            {name}
          </span>
        </Marquee>
      ) : (
        <div className="session-card-title" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.95rem',
          color: 'var(--gold-lt)',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
      )}
    </div>
  )
}

export default function LobbyPage({ onEnterSession }) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [masterName, setMasterName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)

    // Sessões onde sou mestre
    const { data: asMaster, error: e1 } = await supabase
      .from('sessions')
      .select('*')
      .eq('master_id', user.id)
      .order('created_at', { ascending: false })

    if (e1) { toast('Erro ao carregar campanhas', 'error'); setLoading(false); return }

    // IDs das sessões onde tenho personagem
    const { data: myChars, error: e2 } = await supabase
      .from('characters')
      .select('session_id')
      .eq('user_id', user.id)

    if (e2) { toast('Erro ao carregar fichas', 'error'); setLoading(false); return }

    // Buscar dados dessas sessões separadamente (evita o join que perde o apikey)
    let playerSessions = []
    if (myChars && myChars.length > 0) {
      const sessionIds = myChars.map(c => c.session_id)
      const { data: sessData } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds)
        .neq('master_id', user.id) // exclui sessões onde já sou mestre

      playerSessions = sessData || []
    }

    // Junta e deduplica
    const all = [...(asMaster || []), ...playerSessions]
    const seen = new Set()
    setSessions(all.filter(s => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    }))
    setLoading(false)
  }

  async function createSession(e) {
    e.preventDefault()
    if (!newName.trim()) return
    if (!masterName.trim()) { toast('Insira seu nome de mestre', 'error'); return }
    setCreating(true)
    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        name: newName.trim(), 
        description: newDescription.trim(), 
        master_id: user.id, 
        master_email: user.email,
        master_name: masterName.trim()
      })
      .select()
      .single()
    setCreating(false)
    if (error) { toast(error.message, 'error'); return }
    toast(`Campanha "${data.name}" criada! Código: ${data.invite_code}`)
    setNewName('')
    setNewDescription('')
    setMasterName('')
    loadSessions()
  }

  async function joinSession(e) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (error || !session) {
      toast('Código não encontrado', 'error')
      setJoining(false)
      return
    }

    // Verificar se já tem personagem nessa sessão
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await supabase
        .from('characters')
        .insert({
          session_id: session.id,
          user_id: user.id,
          name: 'Investigador',
        })
      if (insertError) {
        toast('Erro ao criar ficha: ' + insertError.message, 'error')
        setJoining(false)
        return
      }
    }

    setJoining(false)
    toast(`Entrou em "${session.name}"!`)
    setJoinCode('')
    loadSessions()
  }

  // Precisa buscar as sessões dos players também via política correta
  // Adiciona política de leitura de sessões para jogadores
  async function ensureSessionsPolicy() {
    // Apenas recarrega — a política é garantida pelo SQL abaixo
  }

  function isMaster(session) { return session.master_id === user.id }

  return (
    <div className="app-shell">
      <nav className="topnav">
        <img src="cosmos-titulo.png" alt="Cosmos" style={{ height: 28, width: 'auto', flex: 1, objectFit: 'contain', objectPosition: 'left' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-md)' }}>{user.email}</span>
        <button
          onClick={signOut}
          title="Sair"
          aria-label="Sair"
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 6,
            background: 'var(--red)',
            border: '1px solid var(--red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
            padding: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--red-lt)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(211, 56, 56, 0.7)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--red)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <img
            src="/sair.png"
            alt="Sair"
            style={{
              width: 10,
              height: 10,
              filter: 'invert(56%) sepia(54%) saturate(450%) hue-rotate(0deg) brightness(95%)',
            }}
          />
        </button>
      </nav>

      <div className="page">
        <h2 style={{ marginBottom: '1.25rem' }}>Suas campanhas</h2>

        {loading && (
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
        )}

        {!loading && sessions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-md)', fontStyle: 'italic' }}>
            Nenhuma campanha ainda. Crie uma ou entre com um código.
          </div>
        )}

        <div className="sessions-grid">
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className={`card session-card ${idx === 0 ? 'session-card-latest' : ''}`}
              onClick={() => onEnterSession(s, isMaster(s))}
            >
              <div>
                <CampaignTitle name={s.name} />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
                  Mestre: {s.master_name || s.master_email || 'Desconhecido'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.4, marginBottom: '0.4rem', minHeight: '2.1rem' }}>
                  {s.description ? (
                    <span>{s.description}</span>
                  ) : (
                    <em style={{ color: 'var(--text-dim)', opacity: 0.6 }}>Sem descrição</em>
                  )}
                </div>
              </div>
              <div className="session-card-footer">
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.1em',
                }}>
                  {s.invite_code}
                </span>
                <span
                  style={{ fontSize: '0.85rem' }}
                  title={isMaster(s) ? 'Você é o Mestre' : 'Você é um Jogador'}
                >
                  {isMaster(s) ? '👁' : '🗡'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '1.5rem 0' }}>nova campanha</div>

        <div className="card">
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

            {/* Criar como mestre */}
            <div style={{ flex: 2 }}>
              <div className="section-title">Criar como mestre</div>
              <form onSubmit={createSession} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Seu nome de mestre..."
                    value={masterName}
                    onChange={e => setMasterName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Nome da campanha..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
                <textarea
                  placeholder="Descrição (opcional)..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 60 }}
                />
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? '...' : '+ Criar'}
                </button>
              </form>
            </div>

            {/* Divisor vertical */}
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />

            {/* Entrar com código */}
            <div style={{ flex: 1 }}>
              <div className="section-title">Entrar com código</div>
              <form onSubmit={joinSession} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ex: ABC-123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                  maxLength={7}
                />
                <button type="submit" className="btn btn-primary" disabled={joining}>
                  {joining ? '...' : 'Entrar'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
