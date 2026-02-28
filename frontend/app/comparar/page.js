'use client';
/**
 * Página de Comparación de Jugadores — Fase 2.1
 *
 * Flujo:
 * 1. Buscar y seleccionar Jugador A
 * 2. Buscar y seleccionar Jugador B
 * 3. Elegir métricas a comparar (checkboxes por categoría)
 * 4. Ver tabla Cara a Cara y gráfico de barras SVG
 */
import { useState, useEffect, useCallback } from 'react';
import './comparar.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

// ─── Grupos de métricas ───────────────────────────────────────
const METRIC_GROUPS = [
    {
        id: 'contacto',
        label: '🏏 Contacto',
        metrics: [
            { key: 'avg', label: 'AVG', desc: 'Promedio de bateo', higher: true, format: v => v?.toFixed(3) ?? '.000' },
            { key: 'total_h', label: 'H', desc: 'Hits', higher: true, format: v => v ?? 0 },
            { key: 'total_ab', label: 'AB', desc: 'Turnos al bate', higher: false, format: v => v ?? 0 },
            { key: 'total_so', label: 'K', desc: 'Ponches recibidos', higher: false, format: v => v ?? 0 },
        ],
    },
    {
        id: 'fuerza',
        label: '💪 Fuerza',
        metrics: [
            { key: 'total_hr', label: 'HR', desc: 'Jonrones', higher: true, format: v => v ?? 0 },
            { key: 'total_rbi', label: 'RBI', desc: 'Carreras impulsadas', higher: true, format: v => v ?? 0 },
            { key: 'slg', label: 'SLG', desc: 'Slugging', higher: true, format: v => v?.toFixed(3) ?? '.000' },
            { key: 'ops', label: 'OPS', desc: 'On-base + Slugging', higher: true, format: v => v?.toFixed(3) ?? '.000' },
        ],
    },
    {
        id: 'velocidad',
        label: '⚡ Velocidad',
        metrics: [
            { key: 'total_sb', label: 'SB', desc: 'Bases robadas', higher: true, format: v => v ?? 0 },
            { key: 'total_cs', label: 'CS', desc: 'Atrapado robando', higher: false, format: v => v ?? 0 },
            { key: 'total_r', label: 'R', desc: 'Carreras anotadas', higher: true, format: v => v ?? 0 },
        ],
    },
    {
        id: 'pitcheo',
        label: '⚾ Pitcheo',
        metrics: [
            { key: 'era', label: 'ERA', desc: 'Carreras limpias x9', higher: false, format: v => v?.toFixed(2) ?? '—' },
            { key: 'whip', label: 'WHIP', desc: 'Bases + Hits x entrada', higher: false, format: v => v?.toFixed(2) ?? '—' },
            { key: 'pitch_so', label: 'K', desc: 'Ponches lanzados', higher: true, format: v => v ?? 0 },
            { key: 'pitch_bb', label: 'BB', desc: 'Bases por bolas', higher: false, format: v => v ?? 0 },
        ],
    },
];

const ALL_METRICS = METRIC_GROUPS.flatMap(g => g.metrics);

// ─── Helpers ──────────────────────────────────────────────────
async function fetchJSON(path) {
    try {
        const r = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
        return r.ok ? r.json() : null;
    } catch { return null; }
}

function getStatValue(stats, key) {
    if (!stats) return null;
    const b = stats.batting ?? {};
    const p = stats.pitching ?? {};
    const map = {
        avg: b.avg, total_h: b.total_h, total_ab: b.total_ab, total_so: b.total_so,
        total_hr: b.total_hr, total_rbi: b.total_rbi, slg: b.slg, ops: b.ops,
        total_sb: b.total_sb, total_cs: b.total_cs, total_r: b.total_r,
        era: p.era, whip: p.whip, pitch_so: p.total_so, pitch_bb: p.total_bb,
    };
    return map[key] ?? null;
}

// ─── Componente de buscador de jugadores ──────────────────────
function PlayerSelector({ label, selected, onSelect, otherSelectedId }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const search = useCallback(async (q) => {
        setLoading(true);
        const endpoint = q.length >= 2
            ? `/players/?search=${encodeURIComponent(q)}`
            : `/players/?limit=5`;

        const data = await fetchJSON(endpoint);
        let list = Array.isArray(data) ? data : (data?.results ?? []);

        if (otherSelectedId) {
            list = list.filter(p => p.id !== otherSelectedId);
        }

        setResults(list);
        setLoading(false);
    }, [otherSelectedId]);

    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => search(query), 300);
        return () => clearTimeout(t);
    }, [query, search, isOpen]);

    return (
        <div className="player-selector">
            <div className="ps-label">{label}</div>
            {selected ? (
                <div className="ps-selected animate-in">
                    <div className="ps-avatar">
                        {selected.full_name?.[0] ?? '?'}{selected.full_name?.split(' ')[1]?.[0] ?? ''}
                    </div>
                    <div className="ps-info">
                        <div className="ps-name">{selected.full_name}</div>
                        <div className="ps-meta">
                            {selected.rosters?.[0] && (
                                <span className="ps-badge">
                                    #{selected.rosters[0].jersey_number} {selected.rosters[0].position}
                                </span>
                            )}
                            <span className="ps-team-name">
                                {selected.rosters?.[0]?.team_name || 'Sin equipo'}
                            </span>
                        </div>
                    </div>
                    <button className="ps-clear" onClick={() => { onSelect(null); setQuery(''); }}>✕</button>
                </div>
            ) : (
                <div className="ps-search-wrap">
                    <input
                        className="ps-input"
                        type="text"
                        placeholder="Buscar o click para sugerencias…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => { setIsOpen(true); search(''); }}
                        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                        autoComplete="off"
                    />

                    {isOpen && (
                        <div className="ps-dropdown shadow-lg">
                            {loading && <div className="ps-hint">Buscando…</div>}

                            {!loading && results.length > 0 && results.map(p => (
                                <button
                                    key={p.id}
                                    className="ps-option"
                                    onClick={() => { onSelect(p); setQuery(''); setIsOpen(false); }}
                                >
                                    <div className="ps-opt-avatar">{p.full_name?.[0]}</div>
                                    <div className="ps-opt-content">
                                        <span className="ps-opt-name">{p.full_name}</span>
                                        <span className="ps-opt-meta">
                                            {p.rosters?.[0]?.team_name} · {p.rosters?.[0]?.category_name}
                                        </span>
                                    </div>
                                    <span className="ps-opt-pos">{p.rosters?.[0]?.position}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Gráfico de Barras SVG ────────────────────────────────────
function BarChart({ metricKey, metricLabel, valueA, valueB, nameA, nameB, higherIsBetter }) {
    const a = parseFloat(valueA) || 0;
    const b = parseFloat(valueB) || 0;
    const max = Math.max(a, b, 0.001);
    const pctA = (a / max) * 100;
    const pctB = (b / max) * 100;

    const winA = higherIsBetter ? a >= b : a <= b;
    const winB = higherIsBetter ? b >= a : b <= a;

    return (
        <div className="bar-chart">
            <div className="bar-title">{metricLabel} <span className="bar-desc">— {metricKey}</span></div>
            <div className="bar-row">
                <span className="bar-player-label">{nameA?.split(' ')[0]}</span>
                <div className="bar-track">
                    <div
                        className={`bar-fill bar-a${winA ? ' bar-winner' : ''}`}
                        style={{ width: `${pctA}%` }}
                    />
                </div>
                <span className={`bar-value${winA ? ' bar-value-winner' : ''}`}>{valueA}</span>
            </div>
            <div className="bar-row">
                <span className="bar-player-label">{nameB?.split(' ')[0]}</span>
                <div className="bar-track">
                    <div
                        className={`bar-fill bar-b${winB ? ' bar-winner' : ''}`}
                        style={{ width: `${pctB}%` }}
                    />
                </div>
                <span className={`bar-value${winB ? ' bar-value-winner' : ''}`}>{valueB}</span>
            </div>
        </div>
    );
}

// ─── Tabla Cara a Cara ────────────────────────────────────────
function HeadToHeadTable({ statsA, statsB, playerA, playerB, selectedMetrics }) {
    return (
        <div className="h2h-wrap">
            <div className="h2h-header">
                <div className="h2h-player h2h-player-a">
                    <div className="h2h-avatar">{playerA.full_name?.[0]}{playerA.full_name?.split(' ')[1]?.[0]}</div>
                    <div className="h2h-pname">{playerA.full_name}</div>
                </div>
                <div className="h2h-center-label">VS</div>
                <div className="h2h-player h2h-player-b">
                    <div className="h2h-avatar h2h-avatar-b">{playerB.full_name?.[0]}{playerB.full_name?.split(' ')[1]?.[0]}</div>
                    <div className="h2h-pname">{playerB.full_name}</div>
                </div>
            </div>

            <div className="h2h-table">
                {selectedMetrics.map(m => {
                    const rawA = getStatValue(statsA, m.key);
                    const rawB = getStatValue(statsB, m.key);
                    const fmtA = m.format(rawA);
                    const fmtB = m.format(rawB);
                    const numA = parseFloat(rawA) || 0;
                    const numB = parseFloat(rawB) || 0;
                    const winA = rawA !== null && (m.higher ? numA >= numB : numA <= numB);
                    const winB = rawB !== null && (m.higher ? numB >= numA : numB <= numA);

                    return (
                        <div key={m.key} className="h2h-row">
                            <span className={`h2h-val${winA ? ' h2h-win' : ''}`}>{fmtA}</span>
                            <span className="h2h-metric">{m.label}<span className="h2h-metric-desc">{m.desc}</span></span>
                            <span className={`h2h-val${winB ? ' h2h-win' : ''}`}>{fmtB}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────
export default function CompararPage() {
    const [playerA, setPlayerA] = useState(null);
    const [playerB, setPlayerB] = useState(null);
    const [statsA, setStatsA] = useState(null);
    const [statsB, setStatsB] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState({ contacto: true, fuerza: true, velocidad: false, pitcheo: false });
    const [view, setView] = useState('table'); // 'table' | 'bars'
    const [loading, setLoading] = useState({ a: false, b: false });

    // Cargar stats cuando cambian los jugadores
    useEffect(() => {
        if (!playerA) { setStatsA(null); return; }
        setLoading(l => ({ ...l, a: true }));
        fetchJSON(`/players/${playerA.id}/stats/`).then(d => {
            setStatsA(d);
            setLoading(l => ({ ...l, a: false }));
        });
    }, [playerA]);

    useEffect(() => {
        if (!playerB) { setStatsB(null); return; }
        setLoading(l => ({ ...l, b: true }));
        fetchJSON(`/players/${playerB.id}/stats/`).then(d => {
            setStatsB(d);
            setLoading(l => ({ ...l, b: false }));
        });
    }, [playerB]);

    const toggleGroup = (id) => setSelectedGroups(prev => ({ ...prev, [id]: !prev[id] }));

    const activeMetrics = METRIC_GROUPS
        .filter(g => selectedGroups[g.id])
        .flatMap(g => g.metrics);

    const canCompare = playerA && playerB && (statsA || statsB);

    return (
        <div className="comparar-root">
            {/* Hero strip */}
            <section className="hero-strip">
                <div className="container">
                    <h1>🆚 Comparación de <span>Jugadores</span></h1>
                    <p>Selecciona dos jugadores y compara sus estadísticas cara a cara</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">

                    {/* Selección de jugadores */}
                    <div className="comp-selectors">
                        <PlayerSelector label="Jugador A" selected={playerA} onSelect={setPlayerA} otherSelectedId={playerB?.id} />
                        <div className="comp-vs-badge">VS</div>
                        <PlayerSelector label="Jugador B" selected={playerB} onSelect={setPlayerB} otherSelectedId={playerA?.id} />
                    </div>

                    {/* Filtros de métricas */}
                    <div className="metric-filters">
                        <span className="mf-label">Métricas a comparar:</span>
                        {METRIC_GROUPS.map(g => (
                            <label key={g.id} className={`mf-chip${selectedGroups[g.id] ? ' mf-active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={!!selectedGroups[g.id]}
                                    onChange={() => toggleGroup(g.id)}
                                    style={{ display: 'none' }}
                                />
                                {g.label}
                            </label>
                        ))}
                    </div>

                    {/* Tabs de vista */}
                    {canCompare && (
                        <div className="tabs" style={{ marginTop: '1.5rem' }}>
                            <button className={`tab-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>📊 Tabla Cara a Cara</button>
                            <button className={`tab-btn${view === 'bars' ? ' active' : ''}`} onClick={() => setView('bars')}>📈 Gráfico de Barras</button>
                        </div>
                    )}

                    {/* Estado de carga */}
                    {(loading.a || loading.b) && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Cargando estadísticas…
                        </div>
                    )}

                    {/* Instrucción inicial */}
                    {!playerA && !playerB && (
                        <div className="comp-empty">
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🆚</div>
                            <p>Busca dos jugadores para iniciar la comparación</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                Escribe al menos 2 letras del nombre en cada selector
                            </p>
                        </div>
                    )}

                    {/* Vista: Tabla Cara a Cara */}
                    {canCompare && view === 'table' && activeMetrics.length > 0 && (
                        <HeadToHeadTable
                            statsA={statsA}
                            statsB={statsB}
                            playerA={playerA}
                            playerB={playerB}
                            selectedMetrics={activeMetrics}
                        />
                    )}

                    {/* Vista: Gráfico de Barras */}
                    {canCompare && view === 'bars' && activeMetrics.length > 0 && (
                        <div className="bars-grid">
                            {activeMetrics.map(m => {
                                const rawA = getStatValue(statsA, m.key);
                                const rawB = getStatValue(statsB, m.key);
                                return (
                                    <BarChart
                                        key={m.key}
                                        metricKey={m.key}
                                        metricLabel={m.label}
                                        valueA={m.format(rawA)}
                                        valueB={m.format(rawB)}
                                        nameA={playerA?.full_name}
                                        nameB={playerB?.full_name}
                                        higherIsBetter={m.higher}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {canCompare && activeMetrics.length === 0 && (
                        <div className="comp-empty">
                            <p>Selecciona al menos un grupo de métricas para comparar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
