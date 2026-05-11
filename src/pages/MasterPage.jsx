import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { STATUS, PERICIAS_GRUPOS, CARACTERISTICAS } from '../lib/characterFields'

export default function MasterPage({ session, onBack }) {
  const { toast } = useToast()
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // char selecionado para detalhe
  const [detailTab, setDetailTab] = useState('status')

  useEffect(() => {
    loadChars()

    // Realtime: ouvir qualquer update nos personagens dessa sessão
    const channel = supabase
      .channel(`master-session-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${session.id}`,
      }, payload => {
        setChars(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        if (selected?.id === payload.new.id) setSelected(payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${session.id}`,
      }, payload => {
        setChars(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session.id])

  async function loadChars() {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at')
    if (error) { toast('Erro ao carregar', 'error') }
    else setChars(data || [])
    setLoading(false)
  }

  function pctColor(pct) {
    if (pct >= 60) return '#27ae60'
    if (pct >= 30) return '#c9922a'
    return '#c0392b'
  }

  const allPericias = PERICIAS_GRUPOS.flatMap(g => g.pericias)

  return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} onClick={onBack}>←</button>
        <span className="topnav-title" style={{ fontSize: '0.75rem' }}>{session.name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-md)' }}>
          <span className="pulse-dot online" />
          {chars.length} investigadores
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color: 'var(--text-dim)', marginLeft: 8,
        }}>
          {session.invite_code}
        </span>
      </nav>

      <div className="page">
        {loading && <div className="spinner" />}

        {!loading && chars.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-md)', fontStyle: 'italic' }}>
            Nenhum jogador entrou ainda. Compartilhe o código <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{session.invite_code}</strong>.
          </div>
        )}

        {/* Grid de cards dos jogadores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {chars.map(c => {
            const pvPct = c.pv_max > 0 ? Math.round((c.pv_atual / c.pv_max) * 100) : 0
            const sanPct = c.san_max > 0 ? Math.round((c.san_atual / c.san_max) * 100) : 0
            const srtPct = c.sorte_max > 0 ? Math.round((c.sorte_atual / c.sorte_max) * 100) : 0
            return (
              <div
                key={c.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: selected?.id === c.id ? 'var(--gold)' : '' }}
                onClick={() => { setSelected(selected?.id === c.id ? null : c); setDetailTab('status') }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--surface3)',
                    border: '1.5px solid var(--border-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>🔍</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold-lt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name || 'Sem nome'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.occupation || 'Ocupação não definida'}</div>
                  </div>
                </div>

                {/* Barras de status resumidas */}
                {[
                  { label: '❤ PV',  cur: c.pv_atual,    max: c.pv_max,    pct: pvPct  },
                  { label: '🧠 SAN', cur: c.san_atual,   max: c.san_max,   pct: sanPct },
                  { label: '✦ SRT', cur: c.sorte_atual,  max: c.sorte_max, pct: srtPct },
                ].map(stat => (
                  <div key={stat.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-md)', marginBottom: 3 }}>
                      <span>{stat.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: pctColor(stat.pct) }}>{stat.cur}/{stat.max}</span>
                    </div>
                    <div className="bar-track" style={{ height: 5 }}>
                      <div className="bar-fill" style={{ width: `${stat.pct}%`, background: pctColor(stat.pct) }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Painel de detalhe do personagem selecionado */}
        {selected && (
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{selected.name}</h2>
              <button className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => setSelected(null)}>✕ Fechar</button>
            </div>

            <div className="tabs">
              {[
                { key: 'status',   label: 'Status' },
                { key: 'caract',   label: 'Características' },
                { key: 'pericias', label: 'Perícias' },
              ].map(t => (
                <button key={t.key} className={`tab-btn${detailTab === t.key ? ' active' : ''}`} onClick={() => setDetailTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status detalhado */}
            {detailTab === 'status' && (
              <div className="grid-3" style={{ gap: '0.75rem' }}>
                {STATUS.map(s => {
                  const cur = selected[`${s.key}_atual`] ?? 0
                  const max = selected[`${s.key}_max`] ?? 0
                  const pct = max > 0 ? Math.round((cur / max) * 100) : 0
                  return (
                    <div key={s.key} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-md)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 500, color: s.color }}>{cur}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/ {max}</div>
                      <div className="bar-track" style={{ marginTop: 8, height: 4 }}>
                        <div className="bar-fill" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Características */}
            {detailTab === 'caract' && (
              <div className="field-grid">
                {CARACTERISTICAS.map(c => (
                  <div key={c.key} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-md)', marginBottom: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{c.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--gold-lt)', fontWeight: 500 }}>{selected[c.key] ?? 0}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Perícias */}
            {detailTab === 'pericias' && (
              <div>
                {PERICIAS_GRUPOS.map(grupo => (
                  <div key={grupo.grupo} style={{ marginBottom: '1rem' }}>
                    <div className="section-title">{grupo.grupo}</div>
                    {grupo.pericias.map(p => {
                      let val
                      if (p.calculado === 'des/2') val = Math.floor((selected.des_destreza ?? 0) / 2)
                      else if (p.calculado === 'edu') val = selected.edu_educacao ?? 0
                      else val = selected[p.key] ?? p.base
                      return (
                        <div key={p.key} className="pericia-row">
                          <span className="pericia-label">{p.label}</span>
                          <span className="pericia-base">{p.base}%</span>
                          <span className={`pericia-val ${val >= (p.base || 1) * 2 ? 'above-half' : val <= Math.floor((p.base || 1) / 5) ? 'below-fifth' : ''}`}>
                            {val}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
