'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user?.role === 'viewer') {
                setError('Tu cuenta no tiene acceso al panel de administración.');
                return;
            }
            router.replace('/admin-panel');
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-text">⚾ BEISBOLDATA</div>
                    <p>Panel de Administración</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Correo electrónico</label>
                        <input
                            type="email"
                            className="form-input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="admin@beisboldata.com"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Solo administradores autorizados pueden acceder.
                </p>
            </div>
        </div>
    );
}
