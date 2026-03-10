'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

const STATUS_OPTS = [
    { value: 'scheduled', label: 'Programado' },
    { value: 'live', label: 'En progreso' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'postponed', label: 'Pospuesto' },
];

const STATUS_LABEL = { finished: 'Final', scheduled: 'Prog.', live: '● Vivo', suspended: 'Susp.', postponed: 'Pospuesto' };
const STATUS_CLASS = { finished: 'badge-finished', scheduled: 'badge-scheduled', live: 'badge-live', suspended: 'badge-suspended', postponed: 'badge-postponed' };

function StatusBadge({ status }) {
    return <span className={`badge ${STATUS_CLASS[status] ?? 'badge-scheduled'}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export default function JuegosPage() {
    const { authFetch } = useAuth();
    const router = useRouter();
    const [seasons, setSeasons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [teams, setTeams] = useState([]);
    const [stadiums, setStadiums] = useState([]);

    useEffect(() => {
        Promise.all([
            authFetch('/seasons/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : d.results ?? []).map(s => ({ value: s.id, label: s.name }))),
            authFetch('/categories/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : d.results ?? []).map(c => ({ value: c.id, label: c.name }))),
            authFetch('/teams/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : d.results ?? []).map(t => ({ value: t.id, label: `${t.short_name} — ${t.name}` }))),
            authFetch('/stadiums/').then(r => r.ok ? r.json() : {}).then(d => (Array.isArray(d) ? d : d.results ?? []).map(s => ({ value: s.id, label: s.name }))),
        ]).then(([s, c, t, st]) => { setSeasons(s); setCategories(c); setTeams(t); setStadiums(st); });
    }, [authFetch]);

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Juegos</h1></div>
            <CrudPage
                title="Juegos"
                endpoint="/games/"
                columns={[
                    { key: 'game_date', label: 'Fecha', render: i => new Date(i.game_date).toLocaleDateString('es-VE') },
                    { key: 'away_team_name', label: 'Visitante' },
                    { key: 'home_team_name', label: 'Local' },
                    { key: 'status', label: 'Estado', render: i => <StatusBadge status={i.status} /> },
                    {
                        key: 'score', label: 'Marcador', render: i => i.status === 'finished'
                            ? <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: 'var(--gold)', letterSpacing: 2 }}>{i.away_score}–{i.home_score}</span>
                            : '—'
                    },
                    { key: 'stadium_name', label: 'Estadio' },
                ]}
                fields={[
                    { key: 'season', label: 'Temporada', type: 'select', required: true, options: seasons },
                    { key: 'category', label: 'Categoría', type: 'select', required: true, options: categories },
                    { key: 'home_team', label: 'Equipo local', type: 'select', required: true, options: teams },
                    { key: 'away_team', label: 'Equipo visitante', type: 'select', required: true, options: teams },
                    { key: 'stadium', label: 'Estadio', type: 'select', options: stadiums },
                    { key: 'game_date', label: 'Fecha y hora', type: 'datetime-local', required: true },
                    { key: 'status', label: 'Estado', type: 'select', options: STATUS_OPTS },
                ]}
                defaultValues={{ season: '', category: '', home_team: '', away_team: '', stadium: '', game_date: '', status: 'scheduled' }}
                extraActions={(item) => {
                    if (item.status === 'finished') return null;
                    return (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => router.push(`/admin-panel/anotacion?game=${item.id}`)}
                            title="Abrir Hoja de Anotación"
                        >
                            ✏️ Anotar
                        </button>
                    );
                }}
            />
        </>
    );
}
