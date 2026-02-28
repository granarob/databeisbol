'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

export default function EquiposPage() {
    const { authFetch } = useAuth();
    const [categories, setCategories] = useState([]);
    const [seasons, setSeasons] = useState([]);

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
                    { key: 'won', label: 'G' },
                    { key: 'lost', label: 'P' },
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
            />
        </>
    );
}
