'use client';
/**
 * Página de Estadísticas Avanzadas — Fase 2.2
 * Soporta filtros por Liga, Temporada, Categoría y Equipo.
 * Tablas ordenables y paginadas.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    getBattingLeaders,
    getPitchingLeaders,
    getLeagues,
    getSeasons,
    getCategories,
    getTeams
} from '@/lib/api';
import './estadisticas.css';

const LIMIT = 10;

// ─── Componente Table Header Ordenable ───────────────────────
function SortableTh({ label, sortKey, currentSort, onSort }) {
    const isSorted = currentSort.key === sortKey;
    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`sortable-th ${isSorted ? 'active' : ''}`}
        >
            <div className="th-content">
                {label}
                <span className="sort-icon">
                    {isSorted ? (currentSort.dir === 'desc' ? '▼' : '▲') : '↕'}
                </span>
            </div>
        </th>
    );
}

// ─── Componente Paginación ───────────────────────────────────
function Pagination({ page, count, limit, onChange }) {
    const totalPages = Math.ceil(count / limit);
    if (totalPages <= 1) return null;
    return (
        <div className="pagination">
            <button
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
                className="pag-btn"
            >
                ← Anterior
            </button>
            <span className="pag-info">Página {page} de {totalPages} <small>({count} totales)</small></span>
            <button
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                className="pag-btn"
            >
                Siguiente →
            </button>
        </div>
    );
}

// ─── Tabla de Bateo ──────────────────────────────────────────
function BattingTable({ data, sort, onSort, page, count, onPageChange }) {
    if (!data || data.length === 0) {
        return <div className="empty-state"><div className="icon">🏏</div><p>Sin estadísticas de bateo para estos filtros</p></div>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Jugador</th>
                            <th>Equipo</th>
                            <SortableTh label="AB" sortKey="total_ab" currentSort={sort} onSort={onSort} />
                            <SortableTh label="H" sortKey="total_h" currentSort={sort} onSort={onSort} />
                            <SortableTh label="HR" sortKey="total_hr" currentSort={sort} onSort={onSort} />
                            <SortableTh label="RBI" sortKey="total_rbi" currentSort={sort} onSort={onSort} />
                            <SortableTh label="BB" sortKey="total_bb" currentSort={sort} onSort={onSort} />
                            <SortableTh label="AVG" sortKey="avg" currentSort={sort} onSort={onSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={row.player_id}>
                                <td className="rank">{(page - 1) * LIMIT + i + 1}</td>
                                <td className="name-col">
                                    <a href={`/jugadores/${row.player_id}`} style={{ color: 'inherit' }}>
                                        {row.player__first_name} {row.player__last_name}
                                    </a>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row['team__name']}</td>
                                <td>{row.total_ab}</td>
                                <td>{row.total_h}</td>
                                <td>{row.total_hr}</td>
                                <td>{row.total_rbi}</td>
                                <td>{row.total_bb}</td>
                                <td className="stat-col">{row.avg?.toFixed(3) ?? '.000'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} count={count} limit={LIMIT} onChange={onPageChange} />
        </div>
    );
}

// ─── Tabla de Pitcheo ─────────────────────────────────────────
function PitchingTable({ data, sort, onSort, page, count, onPageChange }) {
    if (!data || data.length === 0) {
        return <div className="empty-state"><div className="icon">⚡</div><p>Sin estadísticas de pitcheo para estos filtros</p></div>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Lanzador</th>
                            <th>Equipo</th>
                            <SortableTh label="G" sortKey="wins" currentSort={sort} onSort={onSort} />
                            <SortableTh label="IP" sortKey="total_ip_outs" currentSort={sort} onSort={onSort} />
                            <SortableTh label="CL" sortKey="total_er" currentSort={sort} onSort={onSort} />
                            <SortableTh label="K" sortKey="total_so" currentSort={sort} onSort={onSort} />
                            <SortableTh label="BB" sortKey="total_bb" currentSort={sort} onSort={onSort} />
                            <SortableTh label="ERA" sortKey="era" currentSort={sort} onSort={onSort} />
                            <SortableTh label="WHIP" sortKey="whip" currentSort={sort} onSort={onSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => {
                            const ip = row.total_ip_outs ?? 0;
                            const full = Math.floor(ip / 3);
                            const rem = ip % 3;
                            return (
                                <tr key={row.player_id}>
                                    <td className="rank">{(page - 1) * LIMIT + i + 1}</td>
                                    <td className="name-col">
                                        <a href={`/jugadores/${row.player_id}`} style={{ color: 'inherit' }}>
                                            {row.player__first_name} {row.player__last_name}
                                        </a>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row['team__name']}</td>
                                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{row.wins ?? 0}</td>
                                    <td>{full}.{rem}</td>
                                    <td>{row.total_er}</td>
                                    <td>{row.total_so}</td>
                                    <td>{row.total_bb}</td>
                                    <td className="stat-col">{row.era?.toFixed(2) ?? '0.00'}</td>
                                    <td className="stat-col">{row.whip?.toFixed(2) ?? '0.00'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} count={count} limit={LIMIT} onChange={onPageChange} />
        </div>
    );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────
export default function EstadisticasPage() {
    // Estados de Filtros
    const [filters, setFilters] = useState({ league: '', season: '', category: '', team: '' });

    // Opciones de selects
    const [options, setOptions] = useState({ leagues: [], seasons: [], categories: [], teams: [] });

    // Estados de Datos
    const [battingData, setBattingData] = useState({ count: 0, results: [] });
    const [pitchingData, setPitchingData] = useState({ count: 0, results: [] });
    const [loading, setLoading] = useState(true);

    // Estados de Ordenación y Paginación
    const [battingSort, setBattingSort] = useState({ key: 'avg', dir: 'desc' });
    const [battingPage, setBattingPage] = useState(1);
    const [pitchingSort, setPitchingSort] = useState({ key: 'era', dir: 'asc' });
    const [pitchingPage, setPitchingPage] = useState(1);

    // CARGAR OPCIONES INICIALES (Ligas)
    useEffect(() => {
        getLeagues().then(data => {
            const list = data?.results || data || [];
            setOptions(prev => ({ ...prev, leagues: list }));
        });
    }, []);

    // CARGAR TEMPORADAS Y CATEGORÍAS CUANDO CAMBIA LIGA
    useEffect(() => {
        if (!filters.league) {
            setOptions(prev => ({ ...prev, seasons: [], categories: [], teams: [] }));
            setFilters(prev => ({ ...prev, season: '', category: '', team: '' }));
            return;
        }
        Promise.all([
            getSeasons(filters.league),
            getCategories(filters.league)
        ]).then(([seas, cats]) => {
            setOptions(prev => ({
                ...prev,
                seasons: seas?.results || seas || [],
                categories: cats?.results || cats || []
            }));
        });
    }, [filters.league]);

    // CARGAR EQUIPOS CUANDO CAMBIA CATEGORÍA O TEMPORADA
    useEffect(() => {
        if (!filters.category && !filters.season) {
            setOptions(prev => ({ ...prev, teams: [] }));
            setFilters(prev => ({ ...prev, team: '' }));
            return;
        }
        getTeams({ category: filters.category, season: filters.season })
            .then(data => setOptions(prev => ({ ...prev, teams: data?.results || data || [] })));
    }, [filters.category, filters.season]);

    // CARGAR ESTADÍSTICAS
    const loadBatting = useCallback(async () => {
        const data = await getBattingLeaders({
            ...filters,
            stat: battingSort.key,
            limit: LIMIT,
            offset: (battingPage - 1) * LIMIT
        });
        setBattingData(data);
    }, [filters, battingSort.key, battingPage]);

    const loadPitching = useCallback(async () => {
        const data = await getPitchingLeaders({
            ...filters,
            stat: pitchingSort.key,
            limit: LIMIT,
            offset: (pitchingPage - 1) * LIMIT
        });
        setPitchingData(data);
    }, [filters, pitchingSort.key, pitchingPage]);

    useEffect(() => {
        setLoading(true);
        Promise.all([loadBatting(), loadPitching()]).then(() => setLoading(false));
    }, [loadBatting, loadPitching]);

    // Handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setBattingPage(1); // Reset paginación al filtrar
        setPitchingPage(1);
    };

    const handleSortBatting = (key) => {
        setBattingSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
        }));
        setBattingPage(1);
    };

    const handleSortPitching = (key) => {
        setPitchingSort(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
        setPitchingPage(1);
    };

    return (
        <>
            <section className="hero-strip animate-in fade-in">
                <div className="container">
                    <h1 className="animate-in slide-up delay-100">Estadísticas <span>Avanzadas</span></h1>
                    <p className="animate-in slide-up delay-200">Filtra por división y ordena por cualquier métrica líder</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">

                    {/* BARRA DE FILTROS */}
                    <div className="stats-filters animate-in slide-up delay-300">
                        <div className="filter-group">
                            <label>Liga</label>
                            <select name="league" value={filters.league} onChange={handleFilterChange}>
                                <option value="">Todas las ligas</option>
                                {options.leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Temporada</label>
                            <select name="season" value={filters.season} onChange={handleFilterChange} disabled={!filters.league}>
                                <option value="">Seleccionar temporada</option>
                                {options.seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Categoría</label>
                            <select name="category" value={filters.category} onChange={handleFilterChange} disabled={!filters.league}>
                                <option value="">Seleccionar categoría</option>
                                {options.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Equipo</label>
                            <select name="team" value={filters.team} onChange={handleFilterChange} disabled={!filters.category && !filters.season}>
                                <option value="">Todos los equipos</option>
                                {options.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="stats-loading">
                            <div className="spinner"></div>
                            <p>Sincronizando récords...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="stats-sections">
                            <div className="reports-bar">
                                <button
                                    onClick={() => {
                                        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/batting-leaders/pdf/?season=${filters.season}&category=${filters.category}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="report-btn pdf"
                                    title="Descargar Top 20 Líderes en PDF"
                                >
                                    📄 Exportar Líderes (PDF)
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/reports/standings/excel/?season=${filters.season}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="report-btn excel"
                                    title="Descargar Tabla de Posiciones en Excel"
                                >
                                    📊 Tabla de Posiciones (Excel)
                                </button>
                            </div>

                            <section>
                                <h2 className="section-title">🏏 Líderes de Bateo</h2>
                                <BattingTable
                                    data={battingData.results}
                                    count={battingData.count}
                                    page={battingPage}
                                    onPageChange={setBattingPage}
                                    sort={battingSort}
                                    onSort={handleSortBatting}
                                />
                            </section>

                            <section>
                                <h2 className="section-title">⚡ Líderes de Pitcheo</h2>
                                <PitchingTable
                                    data={pitchingData.results}
                                    count={pitchingData.count}
                                    page={pitchingPage}
                                    onPageChange={setPitchingPage}
                                    sort={pitchingSort}
                                    onSort={handleSortPitching}
                                />
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
