import { useState, useEffect } from 'react'
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
  const [tab, setTab] = useState('info')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => { loadChar() }, [session.id])

  async function loadChar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', user.id)
      .single()
    if (error) toast('Erro ao carregar ficha', 'error')
    else setChar(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!char) return
    const channel = supabase
      .channel(`char-${char.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${char.id}`,
      }, payload => { setChar(payload.new); setDirty(false) })
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

  async function resetChar() {
    if (!char) return
    setResetting(true)
    const resetFields = {
      ...CHARACTER_DEFAULTS,
      name: char.name,
      occupation: char.occupation,
      age: char.age,
      birthplace: char.birthplace,
      sex: char.sex,
      residence: char.residence,
    }
    const { error } = await supabase.from('characters').update(resetFields).eq('id', char.id)
    setResetting(false)
    if (error) { toast('Erro ao resetar: ' + error.message, 'error'); return }
    setChar(prev => ({ ...prev, ...resetFields }))
    setDirty(false)
    setConfirmReset(false)
    toast('Ficha resetada para os valores base!')
  }

  const esquivar = char ? Math.floor((char.des_destreza ?? 0) / 2) : 0
  const linguaNatural = char ? (char.edu_educacao ?? 0) : 0

  function periciaDisplayVal(p) {
    if (p.calculado === 'des/2') return esquivar
    if (p.calculado === 'edu') return linguaNatural
    return char?.[p.key] ?? p.base
  }

  if (loading) return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" onClick={onBack}>←</button>
        <span className="topnav-title">{session.name}</span>
      </nav>
      <div className="spinner" />
    </div>
  )

  if (!char) return (
    <div className="app-shell">
      <nav className="topnav">
        <button className="btn btn-ghost" onClick={onBack}>←</button>
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

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'info',     label: 'Informações' },
            { key: 'status',   label: 'Status' },
            { key: 'caract',   label: 'Atributos' },
            { key: 'pericias', label: 'Perícias' },
          ].map(t => (
            <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: INFORMAÇÕES ── */}
        {tab === 'info' && (
          <div>
            <div className="card" style={{ marginBottom: '0.75rem' }}>
              <div className="section-title">Dados do Investigador</div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="field-row">
                  <label>Nome</label>
                  <input type="text" value={char.name || ''} onChange={e => update('name', e.target.value)} placeholder="Nome completo..." />
                </div>
                <div className="field-row">
                  <label>Ocupação</label>
                  <input type="text" value={char.occupation || ''} onChange={e => update('occupation', e.target.value)} placeholder="Detetive, Médico..." />
                </div>
                <div className="field-row">
                  <label>Idade</label>
                  <input type="number" value={char.age || ''} onChange={e => update('age', parseInt(e.target.value) || 0)} min={1} max={120} />
                </div>
                <div className="field-row">
                  <label>Sexo</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['M', 'F'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('sex', s)}
                        style={{
                          flex: 1, padding: '0.6rem',
                          background: char.sex === s ? 'var(--surface3)' : 'var(--bg)',
                          border: `1px solid ${char.sex === s ? 'var(--gold)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          color: char.sex === s ? 'var(--gold-lt)' : 'var(--text-md)',
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.8rem', letterSpacing: '0.1em',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {s === 'M' ? '♂ Masculino' : '♀ Feminino'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field-row">
                  <label>Local de Nascimento</label>
                  <input type="text" value={char.birthplace || ''} onChange={e => update('birthplace', e.target.value)} placeholder="Cidade, País..." />
                </div>
                <div className="field-row">
                  <label>Residência</label>
                  <input type="text" value={char.residence || ''} onChange={e => update('residence', e.target.value)} placeholder="Endereço atual..." />
                </div>
              </div>
            </div>

            {/* Botão resetar */}
            <div className="card">
              <div className="section-title">Zona de perigo</div>
              {!confirmReset ? (
                <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmReset(true)}>
                  🔄 Resetar ficha (valores base)
                </button>
              ) : (
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--red)',
                  borderRadius: 'var(--radius)', padding: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-md)' }}>
                    Apaga todos os valores. Confirma?
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => setConfirmReset(false)}>
                      Cancelar
                    </button>
                    <button className="btn btn-danger" style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem' }} onClick={resetChar} disabled={resetting}>
                      {resetting ? '...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: STATUS ── */}
        {tab === 'status' && STATUS.map(s => {
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
              <div style={{ display: 'flex', gap: '1rem' }}>
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

        {/* ── TAB: ATRIBUTOS ── */}
        {tab === 'caract' && (
          <div className="card">
            <div className="section-title">Características</div>
            <div className="field-grid">
              {CARACTERISTICAS.map(c => (
                <div key={c.key}>
                  <label title={c.full}>{c.label} — {c.full}</label>
                  <div className="stat-ctrl">
                    <button className="stat-ctrl-btn" onClick={() => nudge(c.key, -1, 0, 99)}>−</button>
                    <span className="stat-ctrl-val" style={{ color: 'var(--gold-lt)' }}>{char[c.key] ?? 0}</span>
                    <button className="stat-ctrl-btn" onClick={() => nudge(c.key, +1, 0, 99)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-md)' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem' }}>CALCULADOS</strong><br />
              Esquivar = DES ÷ 2 = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{esquivar}%</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              Língua Natural = EDU = <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{linguaNatural}%</strong>
            </div>
          </div>
        )}

        {/* ── TAB: PERÍCIAS ── */}
        {tab === 'pericias' && (
          <div>
            <div style={{
              display: 'flex', gap: 6, marginBottom: '0.875rem',
              padding: '0.6rem 0.875rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>Legenda:</span>
              <span style={{ fontSize: '0.7rem', color: '#c9922a', fontFamily: 'var(--font-mono)' }}>Regular = valor cheio</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: '#3498db', fontFamily: 'var(--font-mono)' }}>Difícil = ÷2</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: '#8e44ad', fontFamily: 'var(--font-mono)' }}>Extremo = ÷5</span>
            </div>

            {PERICIAS_GRUPOS.map(grupo => (
              <div key={grupo.grupo} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="section-title">{grupo.grupo}</div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0.2rem 0.5rem', marginBottom: '0.25rem', gap: '0.5rem' }}>
                  <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Perícia</span>
                  <span style={{ fontSize: '0.65rem', color: '#c9922a', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 52, textAlign: 'center' }}>Regular</span>
                  <span style={{ fontSize: '0.65rem', color: '#3498db', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 44, textAlign: 'center' }}>Difícil</span>
                  <span style={{ fontSize: '0.65rem', color: '#8e44ad', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 44, textAlign: 'center' }}>Extremo</span>
                </div>

                {grupo.pericias.map(p => {
                  const val = periciaDisplayVal(p)
                  const isAuto = !!p.calculado
                  return (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', padding: '0.35rem 0.5rem', borderRadius: 6, gap: '0.5rem', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        {isAuto ? (
                          <span style={{ fontSize: '0.9rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                        ) : (
                          <>
                            <button className="stat-ctrl-btn" style={{ width: 20, height: 20, fontSize: '0.75rem', flexShrink: 0 }} onClick={() => nudge(p.key, -1, 0, 99)}>−</button>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                            <button className="stat-ctrl-btn" style={{ width: 20, height: 20, fontSize: '0.75rem', flexShrink: 0 }} onClick={() => nudge(p.key, +1, 0, 99)}>+</button>
                          </>
                        )}
                      </div>
                      <div style={{ minWidth: 52, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 500, color: '#c9922a' }}>{val}%</div>
                      <div style={{ minWidth: 44, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#3498db' }}>{Math.floor(val / 2)}%</div>
                      <div style={{ minWidth: 44, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8e44ad' }}>{Math.floor(val / 5)}%</div>
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
