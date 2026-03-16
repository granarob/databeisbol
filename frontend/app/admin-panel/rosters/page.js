'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

const EMPTY_FORM = { team: '', player: '', jersey_number: '', is_active: true };

/* ── Modal de create/edit ─────────────────────────────────── */
function RosterModal({ item, teams, allPlayers, onClose, onSaved, authFetch }) {
    const [form, setForm] = useState(item ? { ...item, team: item.team ?? '', player: item.player ?? '' } : { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [playerSearch, setPlayerSearch] = useState('');

    const isEdit = !!item?.id;

    // Jugadores filtrados por búsqueda
    const filteredPlayers = allPlayers.filter(p =>
        playerSearch === '' || p.label.toLowerCase().includes(playerSearch.toLowerCase())
    );

    const handleSave = async () => {
        if (!form.team || !form.player || form.jersey_number === '') {
            setError('Completa todos los campos obligatorios.');
            return;
        }
        setSaving(true);
        setError('');

        // Validación: número de camiseta duplicado en el mismo equipo
        if (!isEdit) {
            const checkRes = await authFetch(`/rosters/?team=${form.team}`);
            if (checkRes.ok) {
                const existing = await checkRes.json();
                const list = Array.isArray(existing) ? existing : (existing.results ?? []);
                const dup = list.find(r => String(r.jersey_number) === String(form.jersey_number) && r.player !== form.player);
                if (dup) {
                    setError(`El número #${form.jersey_number} ya está asignado a ${dup.player_name} en este equipo.`);
                    setSaving(false);
                    return;
                }
            }
        }

        const url = isEdit ? `/rosters/${item.id}/` : '/rosters/';
        const method = isEdit ? 'PUT' : 'POST';
        const res = await authFetch(url, { method, body: JSON.stringify({ ...form, jersey_number: parseInt(form.jersey_number) }) });

        if (res.ok) {
            onSaved();
            onClose();
        } else {
            const err = await res.json();
            setError(Object.values(err).flat().join(' ') || 'Error al guardar.');
        }
        setSaving(false);
    };

    return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3>{isEdit ? 'Editar roster' : 'Agregar al roster'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    {/* Equipo */}
                    <div className="form-group">
                        <label className="form-label">Equipo <span style={{ color: 'var(--accent)' }}>*</span></label>
                        <select className="form-select" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}>
                            <option value="">— Seleccionar equipo —</option>
                            {teams.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* Jugador con búsqueda */}
                    <div className="form-group">
                        <label className="form-label">Jugador <span style={{ color: 'var(--accent)' }}>*</span></label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar jugador por nombre…"
                            value={playerSearch}
                            onChange={e => setPlayerSearch(e.target.value)}
                            style={{ marginBottom: '0.4rem' }}
                        />
                        <select
                            className="form-select"
                            value={form.player}
                            onChange={e => { setForm(f => ({ ...f, player: e.target.value })); }}
                            size={Math.min(filteredPlayers.length + 1, 6)}
                            style={{ height: 'auto' }}
                        >
                            <option value="">— Seleccionar jugador —</option>
                            {filteredPlayers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {filteredPlayers.length === 0 && playerSearch && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Sin resultados para "{playerSearch}". <a href="/admin-panel/jugadores" style={{ color: 'var(--accent)' }}>Crear jugador nuevo</a>
                            </p>
                        )}
                    </div>

                    <div className="form-grid-2">
                        {/* Número de camiseta */}
                        <div className="form-group">
                            <label className="form-label">Número dorsal <span style={{ color: 'var(--accent)' }}>*</span></label>
                            <input
                                type="number"
                                className="form-input"
                                min={0}
                                max={99}
                                placeholder="23"
                                value={form.jersey_number}
                                onChange={e => setForm(f => ({ ...f, jersey_number: e.target.value }))}
                            />
                        </div>

                    </div>

                    {/* Activo */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Jugador activo en el roster</span>
                        </label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Página principal ─────────────────────────────────────── */
export default function RostersPage() {
    const { authFetch } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [filterTeam, setFilterTeam] = useState('');
    const [modal, setModal] = useState(null); // null | item (para editar) | 'new'

    const load = useCallback(async () => {
        setLoading(true);
        const url = filterTeam ? `/rosters/?team=${filterTeam}` : '/rosters/';
        const res = await authFetch(url);
        if (res.ok) {
            const d = await res.json();
            const list = Array.isArray(d) ? d : (d.results ?? []);
            setItems(list.sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99)));
        }
        setLoading(false);
    }, [authFetch, filterTeam]);

    useEffect(() => {
        Promise.all([
            authFetch('/teams/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(t => ({ value: t.id, label: `${t.short_name} — ${t.name}` }))),
            authFetch('/players/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(p => ({ value: p.id, label: p.full_name }))),
        ]).then(([t, p]) => { setTeams(t); setAllPlayers(p); });
    }, [authFetch]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este jugador del roster?')) return;
        await authFetch(`/rosters/${id}/`, { method: 'DELETE' });
        await load();
    };

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Rosters</h1></div>
            <div className="admin-content">
                {/* Toolbar */}
                <div className="table-toolbar">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h2>
                            Rosters <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({items.length})</span>
                        </h2>
                        <select
                            className="form-select"
                            style={{ width: 'auto', minWidth: 200 }}
                            value={filterTeam}
                            onChange={e => setFilterTeam(e.target.value)}
                        >
                            <option value="">Todos los equipos</option>
                            {teams.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setModal('new')}>＋ Agregar</button>
                </div>

                {/* Tabla */}
                {loading ? (
                    <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>Cargando…</p>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📭</div>
                        <p>{filterTeam ? 'Este equipo no tiene jugadores en el roster.' : 'Sin registros. Agrega el primero.'}</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jugador</th>
                                    <th>Equipo</th>
                                    <th style={{ textAlign: 'center' }}>Activo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td><strong style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: 1 }}>#{item.jersey_number}</strong></td>
                                        <td>{item.player_name}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{item.team_name}</td>
                                        <td style={{ textAlign: 'center' }}>{item.is_active ? '✅' : '❌'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setModal(item)}>✏️ Editar</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <RosterModal
                    item={modal === 'new' ? null : modal}
                    teams={teams}
                    allPlayers={allPlayers}
                    authFetch={authFetch}
                    onClose={() => setModal(null)}
                    onSaved={load}
                />
            )}
        </>
    );
}
