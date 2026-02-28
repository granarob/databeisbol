'use client';
import CrudPage from '../_components/CrudPage';

export default function LigasPage() {
    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Ligas</h1></div>
            <CrudPage
                title="Ligas"
                endpoint="/leagues/"
                columns={[
                    { key: 'name', label: 'Nombre' },
                    { key: 'country', label: 'País' },
                    { key: 'city', label: 'Ciudad' },
                    { key: 'admin_name', label: 'Admin' },
                ]}
                fields={[
                    { key: 'name', label: 'Nombre de la liga', required: true, placeholder: 'Ej: Liga Semillita Caracas' },
                    { key: 'country', label: 'País', type: 'text', placeholder: 'Venezuela' },
                    { key: 'city', label: 'Ciudad', type: 'text', placeholder: 'Caracas' },
                    { key: 'logo_url', label: 'URL del logo', type: 'url', placeholder: 'https://...' },
                ]}
                defaultValues={{ name: '', country: 'Venezuela', city: '', logo_url: '' }}
            />
        </>
    );
}
