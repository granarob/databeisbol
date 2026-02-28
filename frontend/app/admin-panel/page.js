'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchPublic(path) {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : (d.results ?? []);
}

export default function DashboardPage() {
    const { authFetch, user } = useAuth();
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [leagues, seasons, teams, players, games] = await Promise.all([
                authFetch('/leagues/').then(r => r.ok ? r.json() : {}).then(d => (d.count ?? (Array.isArray(d) ? d.length : (d.results?.length ?? 0)))),
                authFetch('/seasons/').then(r => r.ok ? r.json() : {}).then(d => (d.count ?? (Array.isArray(d) ? d.length : (d.results?.length ?? 0)))),
                authFetch('/teams/').then(r => r.ok ? r.json() : {}).then(d => (d.count ?? (Array.isArray(d) ? d.length : (d.results?.length ?? 0)))),
                authFetch('/players/').then(r => r.ok ? r.json() : {}).then(d => (d.count ?? (Array.isArray(d) ? d.length : (d.results?.length ?? 0)))),
                authFetch('/games/').then(r => r.ok ? r.json() : {}).then(d => (d.count ?? (Array.isArray(d) ? d.length : (d.results?.length ?? 0)))),
            ]);
            setCounts({ leagues, seasons, teams, players, games });
            setLoading(false);
        }
        load();
    }, [authFetch]);

    const cards = [
        { icon: '🏆', val: counts.leagues, lbl: 'Ligas' },
        { icon: '📅', val: counts.seasons, lbl: 'Temporadas' },
        { icon: '🏟', val: counts.teams, lbl: 'Equipos' },
        { icon: '👤', val: counts.players, lbl: 'Jugadores' },
        { icon: '⚾', val: counts.games, lbl: 'Juegos' },
    ];

    return (
        <>
            <div className="admin-topbar">
                <h1>Dashboard</h1>
                <div className="admin-topbar-right" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Bienvenido, <strong style={{ color: 'var(--text)', marginLeft: 4 }}>{user?.full_name}</strong>
                </div>
            </div>
            <div className="admin-content">
                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Cargando resumen…</p>
                ) : (
                    <>
                        <div className="dash-grid">
                            {cards.map(c => (
                                <div className="dash-card" key={c.lbl}>
                                    <div className="dc-icon">{c.icon}</div>
                                    <div className="dc-val">{c.val ?? 0}</div>
                                    <div className="dc-lbl">{c.lbl}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h2 className="section-title">Accesos rápidos</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { href: '/admin-panel/juegos', label: '⚾ Nuevo juego' },
                                    { href: '/admin-panel/jugadores', label: '👤 Nuevos jugadores' },
                                    { href: '/admin-panel/anotacion', label: '✏️ Hoja de Anotación' },
                                    { href: '/admin-panel/rosters', label: '📋 Gestionar rosters' },
                                ].map(link => (
                                    <a key={link.href} href={link.href} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
