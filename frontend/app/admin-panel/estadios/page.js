'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import CrudPage from '../_components/CrudPage';

export default function EstadiosPage() {
    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Estadios</h1></div>
            <CrudPage
                title="Estadios"
                endpoint="/stadiums/"
                columns={[
                    { key: 'name', label: 'Nombre' },
                    { key: 'location', label: 'Ubicación' },
                ]}
                fields={[
                    { key: 'name', label: 'Nombre del estadio', required: true, placeholder: 'Ej: Estadio Universitario' },
                    { key: 'location', label: 'Ubicación', placeholder: 'Ej: Caracas, Miranda' },
                ]}
                defaultValues={{ name: '', location: '' }}
            />
        </>
    );
}
