/**
 * Cliente API centralizado para comunicarse con el backend Django.
 * Todas las llamadas deben pasar por estas funciones para garantizar
 * consistencia en el manejo de errores y la URL base.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        // Sin caché en dev — datos frescos siempre
        cache: 'no-store',
    });

    if (!res.ok) {
        // Devolver array/objeto vacío en caso de error en lugar de romper la UI
        const errorText = await res.text();
        console.error(`API Error [${res.status}] ${path}:`, errorText);
        return null;
    }

    return res.json();
}

// ─── JUEGOS ──────────────────────────────────────────────
export async function getRecentGames() {
    return apiFetch('/games/recent/') ?? [];
}

export async function getGames(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/games/${qs ? '?' + qs : ''}`) ?? { results: [] };
}

// ─── TABLA DE POSICIONES ─────────────────────────────────
export async function getStandings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/teams/standings/${qs ? '?' + qs : ''}`) ?? [];
}

// ─── EQUIPOS ─────────────────────────────────────────────
export async function getTeams(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/teams/${qs ? '?' + qs : ''}`) ?? { results: [] };
}

export async function getTeam(id) {
    return apiFetch(`/teams/${id}/`);
}

// ─── JUGADORES ───────────────────────────────────────────
export async function getPlayers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/players/${qs ? '?' + qs : ''}`) ?? { results: [] };
}

export async function getPlayer(id) {
    return apiFetch(`/players/${id}/`);
}

export async function getPlayerStats(id, seasonId) {
    const qs = seasonId ? `?season=${seasonId}` : '';
    return apiFetch(`/players/${id}/stats/${qs}`);
}

export async function getPlayerGameLog(id, seasonId) {
    const qs = seasonId ? `?season=${seasonId}` : '';
    return apiFetch(`/players/${id}/gamelog/${qs}`);
}

// ─── LÍDERES ─────────────────────────────────────────────
export async function getBattingLeaders(params = {}) {
    const qs = new URLSearchParams({ limit: 10, ...params }).toString();
    return apiFetch(`/stats/batting/leaders/?${qs}`) ?? { count: 0, results: [] };
}

export async function getPitchingLeaders(params = {}) {
    const qs = new URLSearchParams({ limit: 10, ...params }).toString();
    return apiFetch(`/stats/pitching/leaders/?${qs}`) ?? { count: 0, results: [] };
}

// ─── CATEGORÍAS Y TEMPORADAS ─────────────────────────────
export async function getCategories(leagueId) {
    const qs = leagueId ? `?league=${leagueId}` : '';
    return apiFetch(`/categories/${qs}`) ?? { results: [] };
}

export async function getSeasons(leagueId) {
    const qs = leagueId ? `?league=${leagueId}` : '';
    return apiFetch(`/seasons/${qs}`) ?? { results: [] };
}

export async function getLeagues() {
    return apiFetch('/leagues/') ?? { results: [] };
}

export async function getLeague(id) {
    return apiFetch(`/leagues/${id}/`);
}
