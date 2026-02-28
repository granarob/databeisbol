'use client';
/**
 * AuthContext — gestiona el JWT (login, logout, refresh)
 * Almacena {access, refresh, user} en localStorage.
 * Provee apiFetch() con Authorization header automático.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al montar: recuperar sesión guardada
    useEffect(() => {
        const saved = localStorage.getItem('bdb_auth');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setToken(parsed.access);
                setUser(parsed.user);
            } catch (_) { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (username, password) => {
        const res = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Credenciales inválidas');
        }
        const data = await res.json();

        // Obtener datos del usuario
        const meRes = await fetch(`${API_URL}/auth/me/`, {
            headers: { Authorization: `Bearer ${data.access}` },
        });
        const me = meRes.ok ? await meRes.json() : null;

        const session = { access: data.access, refresh: data.refresh, user: me };
        localStorage.setItem('bdb_auth', JSON.stringify(session));
        setToken(data.access);
        setUser(me);
        return me;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('bdb_auth');
        setToken(null);
        setUser(null);
    }, []);

    // Fetch autenticado (incluye Bearer token automáticamente)
    const authFetch = useCallback(async (path, options = {}) => {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
        return res;
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
