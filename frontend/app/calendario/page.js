import { getGames } from '@/lib/api';

export const metadata = { title: 'Calendario — BeisbolData' };

function StatusBadge({ status }) {
    const map = {
        finished: ['badge-finished', 'Final'],
        scheduled: ['badge-scheduled', 'Programado'],
        live: ['badge-live', '● EN VIVO'],
        suspended: ['badge-suspended', 'Suspendido'],
        postponed: ['badge-postponed', 'Pospuesto'],
    };
    const [cls, label] = map[status] ?? ['badge-scheduled', status];
    return <span className={`badge ${cls}`}>{label}</span>;
}

function groupByDate(games) {
    return games.reduce((acc, g) => {
        const d = new Date(g.game_date);
        const key = d.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(g);
        return acc;
    }, {});
}

export default async function CalendarioPage() {
    const data = await getGames();
    const games = Array.isArray(data) ? data : (data?.results ?? []);

    // Ordenar por fecha ascendente
    const sorted = [...games].sort((a, b) => new Date(a.game_date) - new Date(b.game_date));
    const grouped = groupByDate(sorted);
    const dates = Object.keys(grouped);

    return (
        <>
            <section className="hero-strip">
                <div className="container">
                    <h1>Calendario</h1>
                    <p>{games.length} juegos programados</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">
                    {dates.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📅</div>
                            <p>No hay juegos programados aún</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {dates.map(date => (
                                <div key={date}>
                                    {/* Encabezado de fecha */}
                                    <div style={{
                                        padding: '0.6rem 1rem',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius)',
                                        borderLeft: '3px solid var(--accent)',
                                        marginBottom: '0.75rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: 'var(--text)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {date}
                                    </div>

                                    {/* Juegos del día */}
                                    <div className="card">
                                        {grouped[date].map(game => {
                                            const d = new Date(game.game_date);
                                            const timeStr = d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
                                            const isFinished = game.status === 'finished';

                                            return (
                                                <div key={game.id} className="calendar-game-row">
                                                    <span className="cal-date">{timeStr}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="cal-matchup">
                                                            <span style={{ color: 'var(--text-muted)' }}>{game.away_team_name}</span>
                                                            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>@</span>
                                                            <span>{game.home_team_name}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {game.stadium_name && <span>🏟 {game.stadium_name}</span>}
                                                            {game.category_name && <span>{game.category_name}</span>}
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={game.status} />
                                                    {isFinished && (
                                                        <span className="cal-score">
                                                            {game.away_score}–{game.home_score}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
