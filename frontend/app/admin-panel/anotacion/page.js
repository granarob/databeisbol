'use client';
/**
 * Hoja de Anotación Digital — carga de stats post-juego.
 * Flujo:
 *   1. Seleccionar un juego (status = scheduled o live) — también pre-carga desde ?game=ID
 *   2. Cargar roster del equipo local y visitante
 *   3. Ingresar stats de bateo por jugador (con totales automáticos)
 *   4. Ingresar stats de pitcheo por jugador
 *   5. Seleccionar decisiones del juego (W/L/S pitcher)
 *   6. Guardar todo → el backend recalcula scores y standings
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const BATTING_COLS = ['pa', 'ab', 'r', 'h', '2b', '3b', 'hr', 'rbi', 'bb', 'so', 'sb', 'cs', 'hbp', 'sf'];
const BATTING_KEYS = ['pa', 'ab', 'r', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'sb', 'cs', 'hbp', 'sf'];

const PITCHING_COLS = ['ip', 'h', 'r', 'er', 'bb', 'so', 'hr', 'wp', 'bk', 'hbp'];
const PITCHING_KEYS = ['ip_outs', 'h', 'r', 'er', 'bb', 'so', 'hr', 'wp', 'bk', 'hbp'];

const DECISIONS = [
    { value: '', label: '—' },
    { value: 'win', label: 'W (Victoria)' },
    { value: 'loss', label: 'L (Derrota)' },
    { value: 'save', label: 'S (Save)' },
    { value: 'hold', label: 'H (Hold)' },
];

function emptyBatting() { return Object.fromEntries(BATTING_KEYS.map(k => [k, 0])); }
function emptyPitching() { return Object.fromEntries(PITCHING_KEYS.map(k => [k, 0])); }

/** Suma totales de bateo para una fila de totales del equipo */
function calcTotals(roster, batting, key) {
    return roster.reduce((sum, r) => sum + (batting[r.player]?.[key] ?? 0), 0);
}

export default function AnotacionPage() {
    const { authFetch } = useAuth();
    const searchParams = useSearchParams();

    // Paso 1: juego
    const [games, setGames] = useState([]);
    const [gameId, setGameId] = useState('');
    const [game, setGame] = useState(null);

    // Paso 2: rosters
    const [homeRoster, setHomeRoster] = useState([]);
    const [awayRoster, setAwayRoster] = useState([]);

    // Paso 3/4: stats por jugador
    const [batting, setBatting] = useState({});
    const [pitching, setPitching] = useState({});

    // Paso 5: decisiones
    const [winPitcher, setWinPitcher] = useState('');
    const [losePitcher, setLosePitcher] = useState('');
    const [savePitcher, setSavePitcher] = useState('');

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('batting');

    // Cargar juegos pendientes: scheduled + live
    useEffect(() => {
        Promise.all([
            authFetch('/games/?status=scheduled').then(r => r.ok ? r.json() : {}).then(d => Array.isArray(d) ? d : (d.results ?? [])),
            authFetch('/games/?status=live').then(r => r.ok ? r.json() : {}).then(d => Array.isArray(d) ? d : (d.results ?? [])),
        ]).then(([scheduled, live]) => {
            setGames([...live, ...scheduled]); // live primero
        });
    }, [authFetch]);

    // Al seleccionar juego → cargar detalles y rosters
    const loadGame = useCallback(async (id) => {
        setGameId(id);
        setSuccess('');
        setError('');
        if (!id) { setGame(null); setHomeRoster([]); setAwayRoster([]); return; }

        const gameRes = await authFetch(`/games/${id}/`);
        if (!gameRes.ok) return;
        const g = await gameRes.json();
        setGame(g);

        const [hRes, aRes] = await Promise.all([
            authFetch(`/rosters/?team=${g.home_team}&is_active=true`),
            authFetch(`/rosters/?team=${g.away_team}&is_active=true`),
        ]);

        const hRoster = hRes.ok ? await hRes.json() : { results: [] };
        const aRoster = aRes.ok ? await aRes.json() : { results: [] };

        const hList = Array.isArray(hRoster) ? hRoster : (hRoster.results ?? []);
        const aList = Array.isArray(aRoster) ? aRoster : (aRoster.results ?? []);

        // Ordenar por número de camiseta
        const sortByNum = arr => [...arr].sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99));
        setHomeRoster(sortByNum(hList));
        setAwayRoster(sortByNum(aList));

        // Inicializar stats vacías
        const initBatting = {};
        const initPitching = {};
        [...hList, ...aList].forEach(r => {
            initBatting[r.player] = emptyBatting();
            initPitching[r.player] = { ...emptyPitching(), decision: '' };
        });
        setBatting(initBatting);
        setPitching(initPitching);
    }, [authFetch]);

    // Pre-cargar game desde ?game=ID en la URL
    useEffect(() => {
        const gid = searchParams.get('game');
        if (gid && gid !== gameId) {
            loadGame(gid);
        }
    }, [searchParams, loadGame, gameId]);

    const handleBatting = (playerId, col, value) => {
        setBatting(prev => ({
            ...prev,
            [playerId]: { ...prev[playerId], [col]: parseInt(value) || 0 }
        }));
    };

    const handlePitching = (playerId, col, value) => {
        setPitching(prev => ({
            ...prev,
            [playerId]: { ...prev[playerId], [col]: col === 'decision' ? value : (parseInt(value) || 0) }
        }));
    };

    const handleSave = async () => {
        if (!gameId) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const allRosters = [
                ...homeRoster.map(r => ({ ...r, team: game.home_team })),
                ...awayRoster.map(r => ({ ...r, team: game.away_team })),
            ];

            // Subir stats de bateo (solo jugadores con al menos 1 PA)
            const battingPromises = allRosters.map(async r => {
                const stats = batting[r.player];
                if (!stats || stats.pa === 0) return;
                return authFetch('/stats/batting/', {
                    method: 'POST',
                    body: JSON.stringify({ game: parseInt(gameId), team: r.team, player: r.player, ...stats }),
                });
            });

            // Subir stats de pitcheo (solo pitchers con al menos 1 out)
            const pitchingPromises = allRosters.map(async r => {
                const stats = pitching[r.player];
                if (!stats || stats.ip_outs === 0) return;
                return authFetch('/stats/pitching/', {
                    method: 'POST',
                    body: JSON.stringify({ game: parseInt(gameId), team: r.team, player: r.player, ...stats }),
                });
            });

            await Promise.all([...battingPromises, ...pitchingPromises]);

            // Actualizar decisiones del juego
            await authFetch(`/games/${gameId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    winning_pitcher: winPitcher || null,
                    losing_pitcher: losePitcher || null,
                    save_pitcher: savePitcher || null,
                }),
            });

            // Cerrar el juego (triggea signal de standings)
            await authFetch(`/games/${gameId}/status/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'finished' }),
            });

            setSuccess('✅ Hoja guardada. Scores y standings actualizados automáticamente.');
            setGame(null);
            setGameId('');
            setWinPitcher('');
            setLosePitcher('');
            setSavePitcher('');
        } catch (e) {
            setError('Error al guardar. Verifica los datos e intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const allPitchers = [...homeRoster, ...awayRoster].filter(r => r.position === 'P');
    const pitcherOpts = allPitchers.map(r => ({ value: r.player, label: `${r.player_name} (${r.team_name ?? ''})` }));

    return (
        <>
            <div className="admin-topbar">
                <h1>✏️ Hoja de Anotación Digital</h1>
            </div>
            <div className="admin-content">

                {/* Selección de juego */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-body">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Seleccionar juego a anotar</label>
                            <select
                                className="form-select"
                                value={gameId}
                                onChange={e => loadGame(e.target.value)}
                                style={{ maxWidth: 520 }}
                            >
                                <option value="">— Seleccionar juego —</option>
                                {games.length > 0 && (
                                    <>
                                        {games.filter(g => g.status === 'live').length > 0 && (
                                            <optgroup label="🔴 En progreso">
                                                {games.filter(g => g.status === 'live').map(g => {
                                                    const d = new Date(g.game_date).toLocaleDateString('es-VE');
                                                    return <option key={g.id} value={g.id}>{d} · {g.away_team_name} @ {g.home_team_name}</option>;
                                                })}
                                            </optgroup>
                                        )}
                                        {games.filter(g => g.status === 'scheduled').length > 0 && (
                                            <optgroup label="📅 Programados">
                                                {games.filter(g => g.status === 'scheduled').map(g => {
                                                    const d = new Date(g.game_date).toLocaleDateString('es-VE');
                                                    return <option key={g.id} value={g.id}>{d} · {g.away_team_name} @ {g.home_team_name}</option>;
                                                })}
                                            </optgroup>
                                        )}
                                    </>
                                )}
                            </select>
                            {games.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    No hay juegos activos. Crea uno en <a href="/admin-panel/juegos" style={{ color: 'var(--accent)' }}>Gestión de Juegos</a>.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {game && (
                    <>
                        {/* Info del juego */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', fontSize: '1.25rem', fontFamily: 'Bebas Neue', letterSpacing: 2 }}>
                                {game.away_team_name} <span style={{ color: 'var(--text-muted)' }}>@</span> {game.home_team_name}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {new Date(game.game_date).toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long' })}
                                {game.stadium_name && ` · 🏟 ${game.stadium_name}`}
                            </span>
                            {game.status === 'live' && (
                                <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, animation: 'pulse 2s infinite' }}>
                                    ● EN VIVO
                                </span>
                            )}
                        </div>

                        {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--green)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>{success}</div>}
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        {/* Tabs Bateo / Pitcheo */}
                        <div className="tabs">
                            <button className={`tab-btn${activeTab === 'batting' ? ' active' : ''}`} onClick={() => setActiveTab('batting')}>🏏 Bateo</button>
                            <button className={`tab-btn${activeTab === 'pitching' ? ' active' : ''}`} onClick={() => setActiveTab('pitching')}>⚡ Pitcheo</button>
                        </div>

                        {activeTab === 'batting' && (
                            <div>
                                {[
                                    { label: game.away_team_name + ' (Visitante)', roster: awayRoster, team: game.away_team },
                                    { label: game.home_team_name + ' (Local)', roster: homeRoster, team: game.home_team },
                                ].map(({ label, roster }) => (
                                    <div key={label} style={{ marginBottom: '2rem' }}>
                                        <h3 className="section-title">{label}</h3>
                                        {roster.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                Sin jugadores en el roster. Agrégalos en <a href="/admin-panel/rosters" style={{ color: 'var(--accent)' }}>Rosters</a>.
                                            </p>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                {/* Header */}
                                                <div className="score-header-row">
                                                    <div className="score-header-cell" style={{ textAlign: 'left', paddingLeft: 4 }}>Jugador</div>
                                                    {BATTING_COLS.map(c => <div key={c} className="score-header-cell">{c}</div>)}
                                                </div>
                                                {/* Rows */}
                                                {roster.map(r => (
                                                    <div key={r.player} className="score-player-row">
                                                        <div className="player-label">#{r.jersey_number} {r.player_name}</div>
                                                        {BATTING_KEYS.map(k => (
                                                            <input
                                                                key={k}
                                                                type="number"
                                                                min={0}
                                                                className="score-input"
                                                                value={batting[r.player]?.[k] ?? 0}
                                                                onChange={e => handleBatting(r.player, k, e.target.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                ))}
                                                {/* Fila de totales */}
                                                <div className="score-player-row" style={{ background: 'rgba(212,175,55,0.07)', borderTop: '1px solid var(--border)' }}>
                                                    <div className="player-label" style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTALES</div>
                                                    {BATTING_KEYS.map(k => (
                                                        <div key={k} className="score-input" style={{ textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: '1rem', color: 'var(--gold)', padding: '0 0.25rem', lineHeight: '32px' }}>
                                                            {calcTotals(roster, batting, k)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'pitching' && (
                            <div>
                                {[
                                    { label: game.away_team_name + ' (Visitante)', roster: awayRoster.filter(r => r.position === 'P') },
                                    { label: game.home_team_name + ' (Local)', roster: homeRoster.filter(r => r.position === 'P') },
                                ].map(({ label, roster }) => (
                                    <div key={label} style={{ marginBottom: '2rem' }}>
                                        <h3 className="section-title">{label}</h3>
                                        {roster.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin pitchers en el roster para este equipo.</p>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <div className="score-header-row" style={{ gridTemplateColumns: '160px repeat(10, 1fr) 130px' }}>
                                                    <div className="score-header-cell" style={{ textAlign: 'left', paddingLeft: 4 }}>Lanzador</div>
                                                    {PITCHING_COLS.map(c => <div key={c} className="score-header-cell">{c}</div>)}
                                                    <div className="score-header-cell">Decisión</div>
                                                </div>
                                                {roster.map(r => (
                                                    <div key={r.player} className="score-player-row" style={{ gridTemplateColumns: '160px repeat(10, 1fr) 130px' }}>
                                                        <div className="player-label">#{r.jersey_number} {r.player_name}</div>
                                                        {PITCHING_KEYS.map(k => (
                                                            <input
                                                                key={k}
                                                                type="number"
                                                                min={0}
                                                                className="score-input"
                                                                value={pitching[r.player]?.[k] ?? 0}
                                                                onChange={e => handlePitching(r.player, k, e.target.value)}
                                                            />
                                                        ))}
                                                        <select
                                                            className="score-input"
                                                            style={{ textAlign: 'center', padding: '0.3rem 0.1rem', fontSize: '0.7rem' }}
                                                            value={pitching[r.player]?.decision ?? ''}
                                                            onChange={e => handlePitching(r.player, 'decision', e.target.value)}
                                                        >
                                                            {DECISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Decisiones del juego */}
                                {allPitchers.length > 0 && (
                                    <div className="card" style={{ marginTop: '1.5rem' }}>
                                        <div className="card-body">
                                            <h3 className="section-title">🏆 Decisiones del juego</h3>
                                            <div className="form-grid-2">
                                                {[
                                                    { label: 'Pitcher ganador (W)', val: winPitcher, set: setWinPitcher },
                                                    { label: 'Pitcher perdedor (L)', val: losePitcher, set: setLosePitcher },
                                                    { label: 'Pitcher salvado (SV)', val: savePitcher, set: setSavePitcher },
                                                ].map(({ label, val, set }) => (
                                                    <div key={label} className="form-group">
                                                        <label className="form-label">{label}</label>
                                                        <select className="form-select" value={val} onChange={e => set(e.target.value)}>
                                                            <option value="">— No asignar —</option>
                                                            {pitcherOpts.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Guardar */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setGameId(''); setGame(null); }}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 200 }}>
                                {saving ? 'Guardando…' : '💾 Guardar y cerrar juego'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
