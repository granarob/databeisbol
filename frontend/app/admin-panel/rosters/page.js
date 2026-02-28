'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

const POSITIONS = [
    { value: 'P', label: 'P — Pitcher' },
    { value: 'C', label: 'C — Catcher' },
    { value: '1B', label: '1B — Primera base' },
    { value: '2B', label: '2B — Segunda base' },
    { value: '3B', label: '3B — Tercera base' },
    { value: 'SS', label: 'SS — Shortstop' },
    { value: 'LF', label: 'LF — Left Field' },
    { value: 'CF', label: 'CF — Center Field' },
    { value: 'RF', label: 'RF — Right Field' },
    { value: 'DH', label: 'DH — Designated Hitter' },
    { value: 'UT', label: 'UT — Utility' },
];

export default function RostersPage() {
    const { authFetch } = useAuth();
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        Promise.all([
            authFetch('/teams/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(t => ({ value: t.id, label: `${t.short_name} — ${t.name}` }))),
            authFetch('/players/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : (d.results ?? [])).map(p => ({ value: p.id, label: p.full_name }))),
        ]).then(([t, p]) => { setTeams(t); setPlayers(p); });
    }, [authFetch]);

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Rosters</h1></div>
            <CrudPage
                title="Rosters"
                endpoint="/rosters/"
                columns={[
                    { key: 'jersey_number', label: '#', render: i => <strong style={{ color: 'var(--gold)' }}>#{i.jersey_number}</strong> },
                    { key: 'player_name', label: 'Jugador' },
                    { key: 'team_name', label: 'Equipo' },
                    { key: 'position', label: 'Pos', render: i => <span style={{ background: 'var(--bg-elevated)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>{i.position}</span> },
                    { key: 'is_active', label: 'Activo', render: i => i.is_active ? '✅' : '❌' },
                ]}
                fields={[
                    { key: 'team', label: 'Equipo', type: 'select', required: true, options: teams },
                    { key: 'player', label: 'Jugador', type: 'select', required: true, options: players },
                    { key: 'jersey_number', label: 'Número de dorsal', type: 'number', required: true, placeholder: '23' },
                    { key: 'position', label: 'Posición', type: 'select', required: true, options: POSITIONS },
                    { key: 'is_active', label: 'Estado', type: 'checkbox', checkLabel: 'Jugador activo en el roster' },
                ]}
                defaultValues={{ team: '', player: '', jersey_number: '', position: 'P', is_active: true }}
            />
        </>
    );
}
