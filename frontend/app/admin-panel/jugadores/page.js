'use client';
import CrudPage from '../_components/CrudPage';

const BATS_OPTS = [{ value: 'R', label: 'Derecho (R)' }, { value: 'L', label: 'Zurdo (L)' }, { value: 'S', label: 'Switch (S)' }];
const THROWS_OPTS = [{ value: 'R', label: 'Derecho (R)' }, { value: 'L', label: 'Zurdo (L)' }];

export default function JugadoresPage() {
    return (
        <>
            <div className="admin-topbar"><h1>Gestión de Jugadores</h1></div>
            <CrudPage
                title="Jugadores"
                endpoint="/players/"
                columns={[
                    { key: 'full_name', label: 'Nombre' },
                    { key: 'birth_date', label: 'Nacimiento' },
                    { key: 'age', label: 'Edad' },
                    { key: 'bats_hand', label: 'Batea' },
                    { key: 'throws_hand', label: 'Lanza' },
                ]}
                fields={[
                    { key: 'first_name', label: 'Nombre', required: true, placeholder: 'José' },
                    { key: 'last_name', label: 'Apellido', required: true, placeholder: 'García' },
                    { key: 'birth_date', label: 'Fecha nac.', type: 'date', required: true },
                    { key: 'bats_hand', label: 'Batea', type: 'select', required: true, options: BATS_OPTS },
                    { key: 'throws_hand', label: 'Lanza', type: 'select', required: true, options: THROWS_OPTS },
                    { key: 'height_cm', label: 'Altura (cm)', type: 'number', placeholder: '175' },
                    { key: 'weight_kg', label: 'Peso (kg)', type: 'number', placeholder: '70' },
                    { key: 'bio', label: 'Biografía', type: 'textarea', placeholder: 'Breve descripción del jugador...' },
                    { key: 'photo_url', label: 'URL foto', type: 'url', placeholder: 'https://...' },
                ]}
                defaultValues={{ first_name: '', last_name: '', birth_date: '', bats_hand: 'R', throws_hand: 'R', height_cm: '', weight_kg: '', bio: '', photo_url: '' }}
            />
        </>
    );
}
