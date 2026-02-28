'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

export default function TemporadasPage() {
    const { authFetch } = useAuth();
    const [leagues, setLeagues] = useState([]);

    useEffect(() => {
        authFetch('/leagues/').then(r => r.ok ? r.json() : {}).then(d => {
            const list = Array.isArray(d) ? d : (d.results ?? []);
            setLeagues(list.map(l => ({ value: l.id, label: l.name })));
        });
    }, [authFetch]);

    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Temporadas</h1></div>
            <CrudPage
                title="Temporadas"
                endpoint="/seasons/"
                columns={[
                    { key: 'league_name', label: 'Liga' },
                    { key: 'name', label: 'Temporada' },
                    { key: 'start_date', label: 'Inicio' },
                    { key: 'end_date', label: 'Fin' },
                    { key: 'is_active', label: 'Activa', render: (item) => item.is_active ? '✅' : '—' },
                ]}
                fields={[
                    { key: 'league', label: 'Liga', type: 'select', required: true, options: leagues },
                    { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej: Temporada 2025-2026' },
                    { key: 'start_date', label: 'Fecha inicio', type: 'date', required: true },
                    { key: 'end_date', label: 'Fecha fin', type: 'date', required: true },
                    { key: 'is_active', label: 'Estado', type: 'checkbox', checkLabel: 'Temporada activa' },
                ]}
                defaultValues={{ league: '', name: '', start_date: '', end_date: '', is_active: false }}
            />
        </>
    );
}
