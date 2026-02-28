'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

export default function CategoriasPage() {
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
            <div className="admin-topbar"><h1>Gestión de Categorías</h1></div>
            <CrudPage
                title="Categorías"
                endpoint="/categories/"
                columns={[
                    { key: 'league_name', label: 'Liga' },
                    { key: 'name', label: 'División' },
                    { key: 'age_min', label: 'Edad mín.' },
                    { key: 'age_max', label: 'Edad máx.' },
                ]}
                fields={[
                    { key: 'league', label: 'Liga', type: 'select', required: true, options: leagues },
                    { key: 'name', label: 'División', required: true, placeholder: 'Ej: Semillita, Juvenil' },
                    { key: 'age_min', label: 'Edad mínima', type: 'number', required: true, placeholder: '7' },
                    { key: 'age_max', label: 'Edad máxima', type: 'number', required: true, placeholder: '12' },
                ]}
                defaultValues={{ league: '', name: '', age_min: '', age_max: '' }}
            />
        </>
    );
}
