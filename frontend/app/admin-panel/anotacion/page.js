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

const BATTING_COLS = ['VB', 'CA', 'HC', 'BB', 'SH', 'SF', 'GP', 'I', 'AL', 'H2', 'H3', 'HR', 'CI', 'BR', 'OR', 'K'];
const BATTING_KEYS = ['ab', 'r', 'h', 'bb', 'sh', 'sf', 'hbp', 'ibb', 'pa', 'doubles', 'triples', 'hr', 'rbi', 'sb', 'cs', 'so'];

const PITCHING_COLS = ['I', 'R', 'C', 'G', 'P', 'S', 'VB', 'IP', 'CP', 'CL', 'HP', 'BB', 'K', 'H2', 'H3', 'HR', 'SH', 'SF', 'GP', 'LZ'];
const PITCHING_KEYS = ['is_starter', 'is_reliever', 'complete_game', 'win', 'loss', 'save', 'ab_against', 'ip_outs', 'r', 'er', 'h', 'bb', 'so', 'h2_allowed', 'h3_allowed', 'hr', 'sh_allowed', 'sf_allowed', 'hbp', 'pitch_count'];

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

    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('batting');

    // Estado para lanzadores activos (permitir múltiples por equipo)
    const [homePitchers, setHomePitchers] = useState([]);
    const [awayPitchers, setAwayPitchers] = useState([]);

    // Estado para lineup activo (orden al bate)
    const [homeLineup, setHomeLineup] = useState([]);
    const [awayLineup, setAwayLineup] = useState([]);

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
        setHomeScore(0);
        setAwayScore(0);

        // Inicializar lanzadores con los que tengan posición 'P'
        setHomePitchers(hList.filter(r => r.position === 'P').map(r => r.player));
        setAwayPitchers(aList.filter(r => r.position === 'P').map(r => r.player));

        // Iniciar lineup vacío para que el usuario lo arme
        setHomeLineup([]);
        setAwayLineup([]);
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
        setPitching(prev => {
            const current = prev[playerId] || emptyPitching();
            let val = value;
            // Manejar booleans para I, R, C, G, P, S
            if (['is_starter', 'is_reliever', 'complete_game', 'win', 'loss', 'save'].includes(col)) {
                val = value === 'true' || value === true;
            } else if (col !== 'decision') {
                val = parseInt(value) || 0;
            }
            return {
                ...prev,
                [playerId]: { ...current, [col]: val }
            };
        });
    };

    const moveLineupPlayer = (teamType, index, direction) => {
        const setLineup = teamType === 'home' ? setHomeLineup : setAwayLineup;
        setLineup(prev => {
            const newList = [...prev];
            if (direction === 'up' && index > 0) {
                [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
            } else if (direction === 'down' && index < newList.length - 1) {
                [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
            }
            return newList;
        });
    };

    const removeLineupPlayer = (teamType, playerId) => {
        const setLineup = teamType === 'home' ? setHomeLineup : setAwayLineup;
        setLineup(prev => prev.filter(id => id !== playerId));
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

            const activeBatters = [...homeLineup, ...awayLineup];

            // Subir stats de bateo (solo jugadores con al menos 1 PA o que estén en el lineup)
            const battingPromises = allRosters.map(async r => {
                const stats = batting[r.player];
                const inLineup = activeBatters.includes(r.player);
                if (!stats || (stats.pa === 0 && !inLineup)) return;
                return authFetch('/stats/batting/', {
                    method: 'POST',
                    body: JSON.stringify({ game: parseInt(gameId), team: r.team, player: r.player, ...stats }),
                });
            });

            // Subir stats de pitcheo
            const homePitchingPromises = homePitchers.map(async pId => {
                const stats = pitching[pId];
                if (!stats) return;
                return authFetch('/stats/pitching/', {
                    method: 'POST',
                    body: JSON.stringify({ game: parseInt(gameId), team: game.home_team, player: pId, ...stats }),
                });
            });

            const awayPitchingPromises = awayPitchers.map(async pId => {
                const stats = pitching[pId];
                if (!stats) return;
                return authFetch('/stats/pitching/', {
                    method: 'POST',
                    body: JSON.stringify({ game: parseInt(gameId), team: game.away_team, player: pId, ...stats }),
                });
            });

            await Promise.all([...battingPromises, ...homePitchingPromises, ...awayPitchingPromises]);

            // Actualizar decisiones y marcador final del juego
            await authFetch(`/games/${gameId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    winning_pitcher: winPitcher || null,
                    losing_pitcher: losePitcher || null,
                    save_pitcher: savePitcher || null,
                    home_score: homeScore,
                    away_score: awayScore,
                    status: 'finished'
                }),
            });

            setSuccess('✅ Hoja guardada. Marcadores y standings actualizados.');
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

    const allPitchers = [...homeRoster.filter(r => homePitchers.includes(r.player)), ...awayRoster.filter(r => awayPitchers.includes(r.player))];
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
                                    { 
                                        label: game.away_team_name + ' (Visitante)', 
                                        roster: awayRoster, 
                                        team: game.away_team, 
                                        lineup: awayLineup, 
                                        setLineup: setAwayLineup,
                                        type: 'away'
                                    },
                                    { 
                                        label: game.home_team_name + ' (Local)', 
                                        roster: homeRoster, 
                                        team: game.home_team, 
                                        lineup: homeLineup, 
                                        setLineup: setHomeLineup,
                                        type: 'home' 
                                    },
                                ].map(({ label, roster, lineup, setLineup, type }) => (
                                    <div key={label} style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 className="section-title" style={{ margin: 0 }}>{label}</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select 
                                                    className="score-input" 
                                                    style={{ width: '220px', textAlign: 'left' }}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        if (id && !lineup.includes(id)) {
                                                            setLineup([...lineup, id]);
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">+ Añadir bateador al Lineup...</option>
                                                    {roster.filter(r => !lineup.includes(r.player)).map(r => (
                                                        <option key={r.player} value={r.player}>
                                                            #{r.jersey_number} {r.player_name} ({r.position})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {lineup.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                Alineación vacía. Agrega los jugadores en su orden al bate usando el menú superior.
                                            </p>
                                        ) : (
                                            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                                {/* Header */}
                                                <div className="score-header-row" style={{ gridTemplateColumns: 'minmax(200px, auto) repeat(16, 1fr)', minWidth: '1100px', background: 'var(--bg-elevated)', padding: '0.5rem 0' }}>
                                                    <div className="score-header-cell" style={{ textAlign: 'left', paddingLeft: 10 }}>Turno / Jugador</div>
                                                    {BATTING_COLS.map(c => <div key={c} className="score-header-cell">{c}</div>)}
                                                </div>
                                                {/* Rows */}
                                                {lineup.map((pId, index) => {
                                                    const r = roster.find(player => player.player === pId);
                                                    if (!r) return null;
                                                    return (
                                                        <div key={pId} className="score-player-row" style={{ gridTemplateColumns: 'minmax(200px, auto) repeat(16, 1fr)', minWidth: '1100px', padding: '0.2rem 0', borderTop: '1px solid var(--border)' }}>
                                                            <div className="player-label" style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <button onClick={() => moveLineupPlayer(type, index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: index === 0 ? 'default' : 'pointer', padding: 0, fontSize: '10px' }}>▲</button>
                                                                    <button onClick={() => moveLineupPlayer(type, index, 'down')} disabled={index === lineup.length - 1} style={{ background: 'none', border: 'none', color: index === lineup.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: index === lineup.length - 1 ? 'default' : 'pointer', padding: 0, fontSize: '10px' }}>▼</button>
                                                                </div>
                                                                <button onClick={() => removeLineupPlayer(type, pId)} style={{ color: 'var(--red)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }} title="Quitar">✕</button>
                                                                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', width: '15px' }}>{index + 1}.</span>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>#{r.jersey_number} {r.player_name}</span>
                                                            </div>
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
                                                    );
                                                })}
                                                {/* Fila de totales */}
                                                <div className="score-player-row" style={{ gridTemplateColumns: 'minmax(200px, auto) repeat(16, 1fr)', minWidth: '1100px', background: 'rgba(212,175,55,0.07)', borderTop: '1px solid var(--border)', padding: '0.5rem 0' }}>
                                                    <div className="player-label" style={{ paddingLeft: 10, fontWeight: 700, color: 'var(--gold)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTALES DEL EQUIPO</div>
                                                    {BATTING_KEYS.map(k => (
                                                        <div key={k} className="score-input" style={{ textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: '1rem', color: 'var(--gold)', padding: '0 0.25rem' }}>
                                                            {calcTotals(roster.filter(r => lineup.includes(r.player)), batting, k)}
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
                                    { 
                                        label: game.away_team_name + ' (Visitante)', 
                                        pitcherIds: awayPitchers, 
                                        roster: awayRoster,
                                        setList: setAwayPitchers 
                                    },
                                    { 
                                        label: game.home_team_name + ' (Local)', 
                                        pitcherIds: homePitchers, 
                                        roster: homeRoster,
                                        setList: setHomePitchers 
                                    },
                                ].map(({ label, pitcherIds, roster, setList }) => (
                                    <div key={label} style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 className="section-title" style={{ margin: 0 }}>{label}</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select 
                                                    className="score-input" 
                                                    style={{ width: '180px', textAlign: 'left' }}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        if (id && !pitcherIds.includes(id)) {
                                                            setList([...pitcherIds, id]);
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">+ Añadir Lanzador...</option>
                                                    {roster.filter(r => !pitcherIds.includes(r.player)).map(r => (
                                                        <option key={r.player} value={r.player}>
                                                            #{r.jersey_number} {r.player_name} ({r.position})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {pitcherIds.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay lanzadores registrados para este equipo.</p>
                                        ) : (
                                            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                                <div className="score-header-row" style={{ gridTemplateColumns: 'minmax(140px, auto) repeat(20, 1fr)', minWidth: '1300px', background: 'var(--bg-elevated)', padding: '0.5rem 0' }}>
                                                    <div className="score-header-cell" style={{ textAlign: 'left', paddingLeft: 10 }}>Lanzador</div>
                                                    {PITCHING_COLS.map(c => <div key={c} className="score-header-cell">{c}</div>)}
                                                </div>
                                                {pitcherIds.map(pId => {
                                                    const r = roster.find(player => player.player === pId);
                                                    if (!r) return null;
                                                    return (
                                                        <div key={pId} className="score-player-row" style={{ gridTemplateColumns: 'minmax(140px, auto) repeat(20, 1fr)', minWidth: '1300px', padding: '0.2rem 0', borderTop: '1px solid var(--border)' }}>
                                                            <div className="player-label" style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <button 
                                                                    onClick={() => setList(pitcherIds.filter(id => id !== pId))}
                                                                    style={{ color: 'var(--red)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                                                                    title="Quitar"
                                                                >✕</button>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>#{r.jersey_number} {r.player_name}</span>
                                                            </div>
                                                            {PITCHING_KEYS.map(k => {
                                                                const isBool = ['is_starter', 'is_reliever', 'complete_game', 'win', 'loss', 'save'].includes(k);
                                                                return isBool ? (
                                                                    <div key={k} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={pitching[pId]?.[k] === true}
                                                                            onChange={e => handlePitching(pId, k, e.target.checked)}
                                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        key={k}
                                                                        type="number"
                                                                        min={0}
                                                                        className="score-input"
                                                                        value={pitching[pId]?.[k] ?? 0}
                                                                        onChange={e => handlePitching(pId, k, e.target.value)}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Decisiones del juego */}
                                {allPitchers.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                        {/* Decisiones de pitcheo */}
                                        <div className="card">
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

                                        {/* Resultado Final */}
                                        <div className="card">
                                            <div className="card-body">
                                                <h3 className="section-title">📉 Resultado Final</h3>
                                                <div className="form-grid-2">
                                                    <div className="form-group">
                                                        <label className="form-label">Carreras {game.away_team_name} (Vis)</label>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            value={awayScore} 
                                                            onChange={e => setAwayScore(parseInt(e.target.value) || 0)} 
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Carreras {game.home_team_name} (Loc)</label>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            value={homeScore} 
                                                            onChange={e => setHomeScore(parseInt(e.target.value) || 0)} 
                                                            min={0}
                                                        />
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                    * Importante: Al guardar, el juego se marcará como **finalizado**.
                                                </p>
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
