'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

const BATS_OPTS = [
    { value: 'R', label: 'Derecho (R)' },
    { value: 'L', label: 'Zurdo (L)' },
    { value: 'S', label: 'Switch (S)' },
];
const THROWS_OPTS = [
    { value: 'R', label: 'Derecho (R)' },
    { value: 'L', label: 'Zurdo (L)' },
];

/* ── Modal de Stats + Game Log ───────────────────────────── */
function StatsModal({ player, onClose }) {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState(null);
    const [gamelog, setGamelog] = useState([]);
    const [tab, setTab] = useState('batting');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [sRes, gRes] = await Promise.all([
            authFetch(`/players/${player.id}/stats/`),
            authFetch(`/players/${player.id}/gamelog/`),
        ]);
        const s = sRes.ok ? await sRes.json() : null;
        const g = gRes.ok ? await gRes.json() : [];
        setStats(s);
        setGamelog(Array.isArray(g) ? g : (g.results ?? []));
        setLoading(false);
    }, [authFetch, player.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const b = stats?.batting ?? {};
    const p = stats?.pitching ?? {};

    return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 860, width: '95vw' }}>
                <div className="modal-header">
                    <h3>
                        <span style={{ marginRight: 8 }}>📊</span>
                        {player.full_name}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 10 }}>
                            Stats acumuladas
                        </span>
                    </h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Cargando estadísticas…</p>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="tabs" style={{ marginBottom: '1rem' }}>
                                <button
                                    className={`tab-btn${tab === 'batting' ? ' active' : ''}`}
                                    onClick={() => setTab('batting')}
                                >🏏 Bateo</button>
                                <button
                                    className={`tab-btn${tab === 'pitching' ? ' active' : ''}`}
                                    onClick={() => setTab('pitching')}
                                >⚡ Pitcheo</button>
                                <button
                                    className={`tab-btn${tab === 'gamelog' ? ' active' : ''}`}
                                    onClick={() => setTab('gamelog')}
                                >📋 Game Log</button>
                            </div>

                            {/* Stats de Bateo */}
                            {tab === 'batting' && (
                                <div>
                                    {!b || Object.keys(b).length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin stats de bateo registradas.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                            {[
                                                { lbl: 'AVG', val: typeof b.avg === 'number' ? b.avg.toFixed(3) : '—' },
                                                { lbl: 'OBP', val: typeof b.obp === 'number' ? b.obp.toFixed(3) : '—' },
                                                { lbl: 'SLG', val: typeof b.slg === 'number' ? b.slg.toFixed(3) : '—' },
                                                { lbl: 'OPS', val: typeof b.ops === 'number' ? b.ops.toFixed(3) : '—' },
                                                { lbl: 'G', val: b.games ?? '—' },
                                                { lbl: 'PA', val: b.pa ?? '—' },
                                                { lbl: 'AB', val: b.ab ?? '—' },
                                                { lbl: 'H', val: b.h ?? '—' },
                                                { lbl: '2B', val: b.doubles ?? '—' },
                                                { lbl: '3B', val: b.triples ?? '—' },
                                                { lbl: 'HR', val: b.hr ?? '—' },
                                                { lbl: 'RBI', val: b.rbi ?? '—' },
                                                { lbl: 'R', val: b.r ?? '—' },
                                                { lbl: 'BB', val: b.bb ?? '—' },
                                                { lbl: 'SO', val: b.so ?? '—' },
                                                { lbl: 'SB', val: b.sb ?? '—' },
                                            ].map(({ lbl, val }) => (
                                                <div key={lbl} style={{
                                                    background: 'var(--bg-elevated)',
                                                    borderRadius: 'var(--radius)',
                                                    padding: '0.6rem 0.75rem',
                                                    textAlign: 'center',
                                                    border: '1px solid var(--border)',
                                                }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
                                                    <div style={{ fontSize: '1.1rem', fontFamily: 'Bebas Neue', color: 'var(--gold)', letterSpacing: 1, marginTop: 2 }}>{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stats de Pitcheo */}
                            {tab === 'pitching' && (
                                <div>
                                    {!p || Object.keys(p).length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin stats de pitcheo registradas.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                            {[
                                                { lbl: 'ERA', val: typeof p.era === 'number' ? p.era.toFixed(2) : '—' },
                                                { lbl: 'WHIP', val: typeof p.whip === 'number' ? p.whip.toFixed(2) : '—' },
                                                { lbl: 'G', val: p.games ?? '—' },
                                                { lbl: 'IP', val: p.ip ?? '—' },
                                                { lbl: 'W', val: p.wins ?? '—' },
                                                { lbl: 'L', val: p.losses ?? '—' },
                                                { lbl: 'SV', val: p.saves ?? '—' },
                                                { lbl: 'H', val: p.h ?? '—' },
                                                { lbl: 'ER', val: p.er ?? '—' },
                                                { lbl: 'BB', val: p.bb ?? '—' },
                                                { lbl: 'SO', val: p.so ?? '—' },
                                                { lbl: 'HR', val: p.hr ?? '—' },
                                            ].map(({ lbl, val }) => (
                                                <div key={lbl} style={{
                                                    background: 'var(--bg-elevated)',
                                                    borderRadius: 'var(--radius)',
                                                    padding: '0.6rem 0.75rem',
                                                    textAlign: 'center',
                                                    border: '1px solid var(--border)',
                                                }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
                                                    <div style={{ fontSize: '1.1rem', fontFamily: 'Bebas Neue', color: 'var(--accent)', letterSpacing: 1, marginTop: 2 }}>{val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Game Log */}
                            {tab === 'gamelog' && (
                                <div style={{ overflowX: 'auto' }}>
                                    {gamelog.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin historial de juegos.</p>
                                    ) : (
                                        <table className="data-table" style={{ fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Oponente</th>
                                                    <th>AB</th><th>H</th><th>HR</th><th>RBI</th>
                                                    <th>BB</th><th>SO</th><th>AVG</th>
                                                    <th>IP</th><th>ER</th><th>ERA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gamelog.map((gl, idx) => (
                                                    <tr key={idx}>
                                                        <td>{gl.game_date ? new Date(gl.game_date).toLocaleDateString('es-VE') : '—'}</td>
                                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{gl.opponent ?? '—'}</td>
                                                        <td>{gl.ab ?? '—'}</td>
                                                        <td>{gl.h ?? '—'}</td>
                                                        <td>{gl.hr ?? '—'}</td>
                                                        <td>{gl.rbi ?? '—'}</td>
                                                        <td>{gl.bb ?? '—'}</td>
                                                        <td>{gl.so ?? '—'}</td>
                                                        <td style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue' }}>
                                                            {typeof gl.avg === 'number' ? gl.avg.toFixed(3) : '—'}
                                                        </td>
                                                        <td>{gl.ip ?? '—'}</td>
                                                        <td>{gl.er ?? '—'}</td>
                                                        <td style={{ color: 'var(--accent)', fontFamily: 'Bebas Neue' }}>
                                                            {typeof gl.era === 'number' ? gl.era.toFixed(2) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Página principal ─────────────────────────────────────── */
export default function JugadoresPage() {
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Jugadores</h1></div>
            <CrudPage
                title="Jugadores"
                endpoint="/players/"
                columns={[
                    { key: 'full_name', label: 'Nombre' },
                    { key: 'birth_date', label: 'Nacimiento' },
                    { key: 'age', label: 'Edad' },
                    { key: 'bats_hand', label: 'Batea' },
                    { key: 'throws_hand', label: 'Lanza' },
                ]}
                fields={[
                    { key: 'first_name', label: 'Nombre', required: true, placeholder: 'José' },
                    { key: 'last_name', label: 'Apellido', required: true, placeholder: 'García' },
                    { key: 'birth_date', label: 'Fecha nac.', type: 'date', required: true },
                    { key: 'bats_hand', label: 'Batea', type: 'select', required: true, options: BATS_OPTS },
                    { key: 'throws_hand', label: 'Lanza', type: 'select', required: true, options: THROWS_OPTS },
                    { key: 'height_cm', label: 'Altura (cm)', type: 'number', placeholder: '175' },
                    { key: 'weight_kg', label: 'Peso (kg)', type: 'number', placeholder: '70' },
                    { key: 'bio', label: 'Biografía', type: 'textarea', placeholder: 'Breve descripción del jugador...' },
                    { key: 'photo_url', label: 'URL foto', type: 'url', placeholder: 'https://...' },
                ]}
                defaultValues={{ first_name: '', last_name: '', birth_date: '', bats_hand: 'R', throws_hand: 'R', height_cm: '', weight_kg: '', bio: '', photo_url: '' }}
                extraActions={(item) => (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedPlayer(item)}
                        title="Ver estadísticas"
                    >
                        📊 Stats
                    </button>
                )}
            />
            {selectedPlayer && (
                <StatsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
            )}
        </>
    );
}
