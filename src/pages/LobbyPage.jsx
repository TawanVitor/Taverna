import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'

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
        <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={signOut} title="Sair" aria-label="Sair">
          <img src="/sair.png" alt="Sair" style={{ width: 10, height: 10, filter: 'invert(56%) sepia(54%) saturate(450%) hue-rotate(0deg) brightness(95%)' }} />
        </button>
      </nav>

      <div className="page">
        <h2 style={{ marginBottom: '1.25rem' }}>Suas campanhas</h2>

        {loading && <div className="spinner" />}

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
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--gold-lt)', marginBottom: '0.5rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {s.name}
                </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
                  {s.invite_code}
                </div>
                <span className={`badge ${isMaster(s) ? 'badge-gold' : 'badge-ghost'}`}>
                  {isMaster(s) ? '👁' : '🗡'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '1.5rem 0' }}>nova campanha</div>

        <div className="card">
          <div className="section-title">Criar como mestre</div>
          <form onSubmit={createSession} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Seu nome de mestre..."
              value={masterName}
              onChange={e => setMasterName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Nome da campanha..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <textarea
              placeholder="Descrição (opcional)..."
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              style={{ minHeight: '60px', resize: 'vertical', fontFamily: 'var(--font-body)' }}
            />
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap' }}>
              {creating ? '...' : '+ Criar'}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="section-title">Entrar com código</div>
          <form onSubmit={joinSession} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Ex: ABC-123"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
              maxLength={7}
            />
            <button type="submit" className="btn btn-primary" disabled={joining} style={{ whiteSpace: 'nowrap' }}>
              {joining ? '...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
