'use client';
import './admin.css';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const NAV = [
    {
        label: 'Principal', items: [
            { href: '/admin-panel', icon: '📊', label: 'Dashboard' },
        ]
    },
    {
        label: 'Organización', items: [
            { href: '/admin-panel/ligas', icon: '🏆', label: 'Ligas' },
            { href: '/admin-panel/temporadas', icon: '📅', label: 'Temporadas' },
            { href: '/admin-panel/categorias', icon: '🔢', label: 'Categorías' },
        ]
    },
    {
        label: 'Equipos y Jugadores', items: [
            { href: '/admin-panel/equipos', icon: '🏟', label: 'Equipos' },
            { href: '/admin-panel/jugadores', icon: '👤', label: 'Jugadores' },
            { href: '/admin-panel/rosters', icon: '📋', label: 'Rosters' },
        ]
    },
    {
        label: 'Juegos', items: [
            { href: '/admin-panel/estadios', icon: '🏗', label: 'Estadios' },
            { href: '/admin-panel/juegos', icon: '⚾', label: 'Juegos' },
            { href: '/admin-panel/anotacion', icon: '✏️', label: 'Hoja de Anotación' },
        ]
    },
];

function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/admin-panel/login');
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-logo">
                ⚾ BEISBOLDATA
                <span>Panel Administración</span>
            </div>
            <nav className="sidebar-nav">
                {NAV.map(section => (
                    <div key={section.label}>
                        <div className="sidebar-section-label">{section.label}</div>
                        {section.items.map(item => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link${pathname === item.href ? ' active' : ''}`}
                            >
                                <span className="icon">{item.icon}</span>
                                {item.label}
                            </a>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <strong>{user?.full_name || 'Admin'}</strong>
                    {user?.role}
                </div>
                <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
            </div>
        </aside>
    );
}

function AdminGuard({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== '/admin-panel/login') {
            router.replace('/admin-panel/login');
        }
    }, [user, loading, pathname, router]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Cargando…
        </div>
    );

    if (!user && pathname !== '/admin-panel/login') return null;
    if (pathname === '/admin-panel/login') return <>{children}</>;

    return (
        <div className="admin-root">
            <Sidebar />
            <div className="admin-main">{children}</div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <AuthProvider>
            <AdminGuard>{children}</AdminGuard>
        </AuthProvider>
    );
}
