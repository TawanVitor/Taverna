import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import {
  CARACTERISTICAS, STATUS, PERICIAS_GRUPOS, CHARACTER_DEFAULTS
} from '../lib/characterFields'

export default function PlayerPage({ session, onBack }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [char, setChar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState('status') // 'status' | 'caract' | 'pericias'

  useEffect(() => { loadChar() }, [session.id])

  async function loadChar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', user.id)
      .single()
    if (error) {
      toast('Erro ao carregar ficha', 'error')
    } else {
      setChar(data)
    }
    setLoading(false)
  }

  // Realtime: atualiza se o mestre editar remotamente
  useEffect(() => {
    if (!char) return
    const channel = supabase
      .channel(`char-${char.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `id=eq.${char.id}`,
      }, payload => {
        setChar(payload.new)
        setDirty(false)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [char?.id])

  function update(key, value) {
    setChar(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function nudge(key, delta, min = 0, max = 999) {
    setChar(prev => {
      const next = Math.max(min, Math.min(max, (prev[key] ?? 0) + delta))
      return { ...prev, [key]: next }
    })
    setDirty(true)
  }

  async function save() {
    if (!char || !dirty) return
    setSaving(true)
    const { id, created_at, ...fields } = char
    const { error } = await supabase.from('characters').update(fields).eq('id', id)
    setSaving(false)
    if (error) { toast('Erro ao salvar: ' + error.message, 'error'); return }
    toast('Ficha salva!')
    setDirty(false)
  }

  // Calcula esquivar e língua natural automaticamente
  const esquivar = char ? Math.floor((char.des_destreza ?? 0) / 2) : 0
  const linguaNatural = char ? (char.edu_educacao ?? 0) : 0

  function periciaDisplayVal(p) {
    if (p.calculado === 'des/2') return esquivar
    if (p.calculado === 'edu') return linguaNatural
    return char?.[p.key] ?? p.base
  }

  function periciaClass(val, base) {
    if (val >= base * 2) return 'above-half'
    if (val <= Math.floor(base / 5)) return 'below-fifth'
    return ''
  }

  if (loading) return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" onClick={onBack}>← Voltar</button>
        <span className="topnav-title">{session.name}</span>
      </nav>
      <div className="spinner" />
    </div>
  )

  if (!char) return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" onClick={onBack}>← Voltar</button>
      </nav>
      <div className="page" style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-md)' }}>
        Ficha não encontrada.
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} onClick={onBack}>←</button>
        <span className="topnav-title" style={{ fontSize: '0.75rem' }}>{session.name}</span>
        {dirty && (
          <button className="btn btn-primary" style={{ padding: '0.35rem 0.9rem' }} onClick={save} disabled={saving}>
            {saving ? '...' : 'Salvar'}
          </button>
        )}
      </nav>

      <div className="page">
        {/* Cabeçalho do personagem */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>Nome do Investigador</label>
              <input
                type="text"
                value={char.name || ''}
                onChange={e => update('name', e.target.value)}
                placeholder="Nome..."
              />
            </div>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>Ocupação</label>
              <input
                type="text"
                value={char.occupation || ''}
                onChange={e => update('occupation', e.target.value)}
                placeholder="Detetive, Médico..."
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'status',   label: 'Status' },
            { key: 'caract',   label: 'Características' },
            { key: 'pericias', label: 'Perícias' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* ── TAB: STATUS ── */}
        {tab === 'status' && (
          <div>
            {STATUS.map(s => {
              const cur = char[`${s.key}_atual`] ?? 0
              const max = char[`${s.key}_max`] ?? 0
              const pct = max > 0 ? Math.round((cur / max) * 100) : 0
              return (
                <div key={s.key} className="card" style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-md)', textTransform: 'uppercase' }}>
                      {s.icon} {s.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: s.color }}>
                      {cur} / {max}
                    </span>
                  </div>
                  <div className="bar-track" style={{ marginBottom: '0.75rem' }}>
                    <div className="bar-fill" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label>Atual</label>
                      <div className="stat-ctrl">
                        <button className="stat-ctrl-btn" onClick={() => nudge(`${s.key}_atual`, -1, 0, char[`${s.key}_max`] ?? 999)}>−</button>
                        <span className="stat-ctrl-val">{cur}</span>
                        <button className="stat-ctrl-btn" onClick={() => nudge(`${s.key}_atual`, +1, 0, char[`${s.key}_max`] ?? 999)}>+</button>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Máximo</label>
                      <div className="stat-ctrl">
                        <button className="stat-ctrl-btn" onClick={() => nudge(`${s.key}_max`, -1, 0)}>−</button>
                        <span className="stat-ctrl-val">{max}</span>
                        <button className="stat-ctrl-btn" onClick={() => nudge(`${s.key}_max`, +1, 0)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB: CARACTERÍSTICAS ── */}
        {tab === 'caract' && (
          <div className="card">
            <div className="section-title">Atributos do Investigador</div>
            <div className="field-grid">
              {CARACTERISTICAS.map(c => (
                <div key={c.key}>
                  <label title={c.full}>{c.label} — {c.full}</label>
                  <div className="stat-ctrl">
                    <button className="stat-ctrl-btn" onClick={() => nudge(c.key, -1, 0, 99)}>−</button>
                    <span className="stat-ctrl-val" style={{ color: 'var(--gold-lt)' }}>
                      {char[c.key] ?? 0}
                    </span>
                    <button className="stat-ctrl-btn" onClick={() => nudge(c.key, +1, 0, 99)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-md)' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text-md)' }}>CALCULADOS AUTOMATICAMENTE</strong><br />
              Esquivar = DES ÷ 2 = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{esquivar}%</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              Língua Natural = EDU = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{linguaNatural}%</strong>
            </div>
          </div>
        )}

        {/* ── TAB: PERÍCIAS ── */}
        {tab === 'pericias' && (
          <div>
            {PERICIAS_GRUPOS.map(grupo => (
              <div key={grupo.grupo} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="section-title">{grupo.grupo}</div>
                {grupo.pericias.map(p => {
                  const val = periciaDisplayVal(p)
                  const isAuto = !!p.calculado
                  return (
                    <div key={p.key} className="pericia-row">
                      <span className="pericia-label">{p.label}</span>
                      <span className="pericia-base">{p.base}%</span>
                      {isAuto ? (
                        <span className={`pericia-val ${periciaClass(val, p.base || 1)}`} style={{ color: 'var(--text-md)', fontStyle: 'italic' }}>
                          {val}%
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            className="stat-ctrl-btn"
                            style={{ width: 22, height: 22, fontSize: '0.8rem' }}
                            onClick={() => nudge(p.key, -1, 0, 99)}
                          >−</button>
                          <span className={`pericia-val ${periciaClass(val, p.base || 1)}`}>
                            {val}%
                          </span>
                          <button
                            className="stat-ctrl-btn"
                            style={{ width: 22, height: 22, fontSize: '0.8rem' }}
                            onClick={() => nudge(p.key, +1, 0, 99)}
                          >+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {dirty && (
          <div style={{ position: 'sticky', bottom: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar ficha'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
