'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

/* ── Modal: Roster del equipo ─────────────────────────────── */
function RosterModal({ team, onClose }) {
    const { authFetch } = useAuth();
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch(`/rosters/?team=${team.id}&is_active=true`)
            .then(r => r.ok ? r.json() : {})
            .then(d => {
                setRoster(Array.isArray(d) ? d : (d.results ?? []));
                setLoading(false);
            });
    }, [authFetch, team.id]);

    return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 560, width: '95vw' }}>
                <div className="modal-header">
                    <h3>
                        <span style={{ background: 'var(--bg-elevated)', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'Bebas Neue', letterSpacing: 2, color: 'var(--accent)', marginRight: 8 }}>
                            {team.short_name}
                        </span>
                        Roster activo
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 10 }}>
                            {team.name}
                        </span>
                    </h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Cargando roster…</p>
                    ) : roster.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📭</div>
                            <p>Sin jugadores en el roster. Agrega jugadores en <a href="/admin-panel/rosters" style={{ color: 'var(--accent)' }}>Rosters</a>.</p>
                        </div>
                    ) : (
                        <table className="data-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jugador</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roster
                                    .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
                                    .map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <strong style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: 1 }}>
                                                    {r.jersey_number}
                                                </strong>
                                            </td>
                                            <td>{r.player_name}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="modal-footer">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {roster.length} {roster.length === 1 ? 'jugador' : 'jugadores'} activos
                    </span>
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

/* ── Página principal ─────────────────────────────────────── */
export default function EquiposPage() {
    const { authFetch } = useAuth();
    const [categories, setCategories] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        Promise.all([
            authFetch('/categories/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(c => ({ value: c.id, label: `${c.name} — ${c.league_name}` }))),
            authFetch('/seasons/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(s => ({ value: s.id, label: `${s.name} — ${s.league_name}` }))),
        ]).then(([cats, seas]) => {
            setCategories(cats);
            setSeasons(seas);
        });
    }, [authFetch]);

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Equipos</h1></div>
            <CrudPage
                title="Equipos"
                endpoint="/teams/"
                columns={[
                    { key: 'short_name', label: '', render: i => <span style={{ background: 'var(--bg-elevated)', padding: '0.15rem 0.4rem', borderRadius: 4, fontFamily: 'Bebas Neue', letterSpacing: 2, color: 'var(--accent)' }}>{i.short_name}</span> },
                    { key: 'name', label: 'Nombre' },
                    { key: 'category_name', label: 'Categoría' },
                    { key: 'season_name', label: 'Temporada' },
                    { key: 'manager_name', label: 'Director' },
                    { key: 'record', label: 'Récord', render: i => <span style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: 1 }}><span style={{ color: 'var(--green, #22c55e)' }}>{i.won ?? 0}</span>-<span style={{ color: 'var(--red, #ef4444)' }}>{i.lost ?? 0}</span>{i.tied > 0 ? `-${i.tied}` : ''}</span> },
                ]}
                fields={[
                    { key: 'name', label: 'Nombre del equipo', required: true, placeholder: 'Ej: Navegantes del Magallanes' },
                    { key: 'short_name', label: 'Abreviatura (3 car)', required: true, placeholder: 'MAG' },
                    { key: 'category', label: 'Categoría', type: 'select', required: true, options: categories },
                    { key: 'season', label: 'Temporada', type: 'select', required: true, options: seasons },
                    { key: 'manager_name', label: 'Director técnico', placeholder: 'Nombre del manager' },
                    { key: 'logo_url', label: 'URL del logo', type: 'url', placeholder: 'https://...' },
                ]}
                defaultValues={{ name: '', short_name: '', category: '', season: '', manager_name: '', logo_url: '' }}
                extraActions={(item) => (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedTeam(item)}
                        title="Ver roster del equipo"
                    >
                        📋 Roster
                    </button>
                )}
            />
            {selectedTeam && (
                <RosterModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
            )}
        </>
    );
}
