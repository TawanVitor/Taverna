import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { STATUS, PERICIAS_GRUPOS, CARACTERISTICAS, CHARACTER_DEFAULTS } from '../lib/characterFields'

export default function MasterPage({ session, onBack }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailTab, setDetailTab] = useState('status')

  // Edição de ficha pelo mestre
  const [editingChar, setEditingChar] = useState(null)
  const [editTab, setEditTab] = useState('status')
  const [editDirty, setEditDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Criação de ficha
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCharName, setNewCharName] = useState('')
  const [newCharOccupation, setNewCharOccupation] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadChars()

    const channel = supabase
      .channel(`master-session-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${session.id}`,
      }, payload => {
        setChars(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        if (editingChar?.id === payload.new.id && !editDirty) {
          setEditingChar(payload.new)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${session.id}`,
      }, payload => {
        setChars(prev => [...prev, payload.new])
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${session.id}`,
      }, payload => {
        setChars(prev => prev.filter(c => c.id !== payload.old.id))
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

  async function createChar(e) {
    e.preventDefault()
    if (!newCharName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('characters')
      .insert({
        ...CHARACTER_DEFAULTS,
        session_id: session.id,
        user_id: user.id,
        name: newCharName.trim(),
        occupation: newCharOccupation.trim(),
      })
      .select()
      .single()
    setCreating(false)
    if (error) { toast('Erro ao criar ficha: ' + error.message, 'error'); return }
    toast(`Ficha "${data.name}" criada!`)
    setNewCharName('')
    setNewCharOccupation('')
    setShowCreateForm(false)
  }

  async function deleteChar(id, name) {
    if (!window.confirm(`Remover a ficha de "${name}" da campanha?`)) return
    const { error } = await supabase.from('characters').delete().eq('id', id)
    if (error) { toast('Erro ao remover', 'error'); return }
    if (editingChar?.id === id) setEditingChar(null)
    if (selected?.id === id) setSelected(null)
    toast('Ficha removida.')
  }

  function openEdit(char) {
    setEditingChar({ ...char })
    setEditTab('status')
    setEditDirty(false)
    setSelected(null)
  }

  function nudgeEdit(key, delta, min = 0, max = 999) {
    setEditingChar(prev => {
      const next = Math.max(min, Math.min(max, (prev[key] ?? 0) + delta))
      return { ...prev, [key]: next }
    })
    setEditDirty(true)
  }

  function updateEdit(key, value) {
    setEditingChar(prev => ({ ...prev, [key]: value }))
    setEditDirty(true)
  }

  async function saveEdit() {
    if (!editingChar || !editDirty) return
    setSaving(true)
    const { id, created_at, ...fields } = editingChar
    const { error } = await supabase.from('characters').update(fields).eq('id', id)
    setSaving(false)
    if (error) { toast('Erro ao salvar: ' + error.message, 'error'); return }
    toast('Ficha salva!')
    setEditDirty(false)
    setChars(prev => prev.map(c => c.id === editingChar.id ? { ...editingChar } : c))
  }

  function pctColor(pct) {
    if (pct >= 60) return '#27ae60'
    if (pct >= 30) return '#c9922a'
    return '#c0392b'
  }

  function periciaVal(char, p) {
    if (p.calculado === 'des/2') return Math.floor((char.des_destreza ?? 0) / 2)
    if (p.calculado === 'edu') return char.edu_educacao ?? 0
    return char[p.key] ?? p.base
  }

  const esquivarEdit = editingChar ? Math.floor((editingChar.des_destreza ?? 0) / 2) : 0
  const linguaEdit   = editingChar ? (editingChar.edu_educacao ?? 0) : 0

  // ─── Tela de edição de ficha ───
  if (editingChar) {
    return (
      <div className="app-shell">
        <nav className="topnav">
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setEditingChar(null)}>←</button>
          <span className="topnav-title" style={{ fontSize: '0.75rem' }}>
            Editando: {editingChar.name}
          </span>
          <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>👁 Mestre</span>
          {editDirty && (
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.9rem' }} onClick={saveEdit} disabled={saving}>
              {saving ? '...' : 'Salvar'}
            </button>
          )}
        </nav>

        <div className="page">
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Nome do Investigador</label>
                <input
                  type="text"
                  value={editingChar.name || ''}
                  onChange={e => updateEdit('name', e.target.value)}
                />
              </div>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Ocupação</label>
                <input
                  type="text"
                  value={editingChar.occupation || ''}
                  onChange={e => updateEdit('occupation', e.target.value)}
                  placeholder="Detetive, Médico..."
                />
              </div>
            </div>
          </div>

          <div className="tabs">
            {[
              { key: 'status',   label: 'Status' },
              { key: 'caract',   label: 'Características' },
              { key: 'pericias', label: 'Perícias' },
            ].map(t => (
              <button
                key={t.key}
                className={`tab-btn${editTab === t.key ? ' active' : ''}`}
                onClick={() => setEditTab(t.key)}
              >{t.label}</button>
            ))}
          </div>

          {editTab === 'status' && STATUS.map(s => {
            const cur = editingChar[`${s.key}_atual`] ?? 0
            const max = editingChar[`${s.key}_max`] ?? 0
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
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label>Atual</label>
                    <div className="stat-ctrl">
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(`${s.key}_atual`, -1, 0, editingChar[`${s.key}_max`] ?? 999)}>−</button>
                      <span className="stat-ctrl-val">{cur}</span>
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(`${s.key}_atual`, +1, 0, editingChar[`${s.key}_max`] ?? 999)}>+</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Máximo</label>
                    <div className="stat-ctrl">
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(`${s.key}_max`, -1, 0)}>−</button>
                      <span className="stat-ctrl-val">{max}</span>
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(`${s.key}_max`, +1, 0)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {editTab === 'caract' && (
            <div className="card">
              <div className="section-title">Atributos do Investigador</div>
              <div className="field-grid">
                {CARACTERISTICAS.map(c => (
                  <div key={c.key}>
                    <label title={c.full}>{c.label} — {c.full}</label>
                    <div className="stat-ctrl">
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(c.key, -1, 0, 99)}>−</button>
                      <span className="stat-ctrl-val" style={{ color: 'var(--gold-lt)' }}>
                        {editingChar[c.key] ?? 0}
                      </span>
                      <button className="stat-ctrl-btn" onClick={() => nudgeEdit(c.key, +1, 0, 99)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-md)' }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem' }}>CALCULADOS</strong><br />
                Esquivar = DES ÷ 2 = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{esquivarEdit}%</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                Língua Natural = EDU = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{linguaEdit}%</strong>
              </div>
            </div>
          )}

          {editTab === 'pericias' && PERICIAS_GRUPOS.map(grupo => (
            <div key={grupo.grupo} className="card" style={{ marginBottom: '0.75rem' }}>
              <div className="section-title">{grupo.grupo}</div>
              {grupo.pericias.map(p => {
                const val = periciaVal(editingChar, p)
                const isAuto = !!p.calculado
                return (
                  <div key={p.key} className="pericia-row">
                    <span className="pericia-label">{p.label}</span>
                    <span className="pericia-base">{p.base}%</span>
                    {isAuto ? (
                      <span className="pericia-val" style={{ color: 'var(--text-md)', fontStyle: 'italic' }}>{val}%</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="stat-ctrl-btn" style={{ width: 22, height: 22, fontSize: '0.8rem' }} onClick={() => nudgeEdit(p.key, -1, 0, 99)}>−</button>
                        <span className="pericia-val">{val}%</span>
                        <button className="stat-ctrl-btn" style={{ width: 22, height: 22, fontSize: '0.8rem' }} onClick={() => nudgeEdit(p.key, +1, 0, 99)}>+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {editDirty && (
            <div style={{ position: 'sticky', bottom: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary btn-full" onClick={saveEdit} disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar ficha'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Tela principal do mestre ───
  return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem' }} onClick={onBack}>←</button>
        <span className="topnav-title" style={{ fontSize: '0.75rem' }}>{session.name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-md)' }}>
          <span className="pulse-dot online" />
          {chars.length} investigadores
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          {session.invite_code}
        </span>
      </nav>

      <div className="page">

        {/* Botão criar ficha */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(v => !v)}>
            {showCreateForm ? '✕ Cancelar' : '+ Criar ficha'}
          </button>
        </div>

        {/* Formulário de criação */}
        {showCreateForm && (
          <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--border-md)' }}>
            <div className="section-title">Nova ficha de investigador</div>
            <form onSubmit={createChar}>
              <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div>
                  <label>Nome do investigador *</label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Henry Armitage"
                    value={newCharName}
                    onChange={e => setNewCharName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label>Ocupação</label>
                  <input
                    type="text"
                    placeholder="Ex: Professor, Detetive..."
                    value={newCharOccupation}
                    onChange={e => setNewCharOccupation(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Criando...' : '+ Adicionar à campanha'}
              </button>
            </form>
          </div>
        )}

        {loading && <div className="spinner" />}

        {!loading && chars.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-md)', fontStyle: 'italic' }}>
            Nenhum investigador ainda. Crie uma ficha ou compartilhe o código{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{session.invite_code}</strong>.
          </div>
        )}

        {/* Grid de cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {chars.map(c => {
            const pvPct  = c.pv_max    > 0 ? Math.round((c.pv_atual    / c.pv_max)    * 100) : 0
            const sanPct = c.san_max   > 0 ? Math.round((c.san_atual   / c.san_max)   * 100) : 0
            const srtPct = c.sorte_max > 0 ? Math.round((c.sorte_atual / c.sorte_max) * 100) : 0
            return (
              <div key={c.id} className="card" style={{ borderColor: selected?.id === c.id ? 'var(--gold)' : '' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--surface3)', border: '1.5px solid var(--border-md)',
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

                {[
                  { label: '❤ PV',   cur: c.pv_atual,    max: c.pv_max,    pct: pvPct  },
                  { label: '🧠 SAN', cur: c.san_atual,   max: c.san_max,   pct: sanPct },
                  { label: '✦ SRT',  cur: c.sorte_atual, max: c.sorte_max, pct: srtPct },
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

                <div style={{ display: 'flex', gap: 6, marginTop: '0.875rem' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: '0.7rem', padding: '0.35rem' }}
                    onClick={() => { setSelected(selected?.id === c.id ? null : c); setDetailTab('status') }}
                  >
                    {selected?.id === c.id ? '▲ Fechar' : '▼ Ver'}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.7rem', padding: '0.35rem' }}
                    onClick={() => openEdit(c)}
                  >
                    ✏ Editar
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem' }}
                    onClick={() => deleteChar(c.id, c.name)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Painel de visualização rápida */}
        {selected && (
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{selected.name}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }} onClick={() => openEdit(selected)}>
                  ✏ Editar ficha
                </button>
                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => setSelected(null)}>✕</button>
              </div>
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

            {detailTab === 'pericias' && (
              <div>
                {PERICIAS_GRUPOS.map(grupo => (
                  <div key={grupo.grupo} style={{ marginBottom: '1rem' }}>
                    <div className="section-title">{grupo.grupo}</div>
                    {grupo.pericias.map(p => {
                      const val = periciaVal(selected, p)
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
