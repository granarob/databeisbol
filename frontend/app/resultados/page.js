import { getGames } from '@/lib/api';

export const metadata = { title: 'Resultados — BeisbolData' };

function StatusBadge({ status }) {
    const map = {
        finished: ['badge-finished', 'Final'],
        live: ['badge-live', '● EN VIVO'],
    };
    const [cls, label] = map[status] ?? ['badge-finished', 'Final'];
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

export default async function ResultadosPage() {
    const data = await getGames();
    const allGames = Array.isArray(data) ? data : (data?.results ?? []);

    // Mostrar solo juegos finalizados (y en vivo si se desea)
    const games = allGames.filter(g => g.status === 'finished' || g.status === 'live');

    // Ordenar por fecha descendente (más recientes primero)
    const sorted = [...games].sort((a, b) => new Date(b.game_date) - new Date(a.game_date));
    const grouped = groupByDate(sorted);
    const dates = Object.keys(grouped);

    return (
        <>
            <section className="hero-strip animate-in fade-in">
                <div className="container">
                    <h1 className="animate-in slide-up delay-100">Resultados</h1>
                    <p className="animate-in slide-up delay-200">Historial de juegos y pizarras finales</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">
                    {dates.length === 0 ? (
                        <div className="empty-state animate-in slide-up delay-300">
                            <div className="icon">🏆</div>
                            <p>No hay resultados registrados aún</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {dates.map((date, index) => (
                                <div key={date} className={`animate-in slide-up delay-${(index % 5 + 1) * 100}`}>
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

                                    <div className="card">
                                        {grouped[date].map(game => {
                                            const d = new Date(game.game_date);
                                            const timeStr = d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

                                            return (
                                                <div key={game.id} className="calendar-game-row">
                                                    <span className="cal-date">{timeStr}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="cal-matchup" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-muted)' }}>
                                                                {game.away_team_name}
                                                            </div>
                                                            <div className="cal-score" style={{ 
                                                                background: 'var(--bg-elevated)', 
                                                                padding: '0.3rem 0.8rem', 
                                                                borderRadius: '4px',
                                                                fontWeight: 800,
                                                                fontSize: '1.2rem',
                                                                minWidth: '100px',
                                                                textAlign: 'center',
                                                                border: '1px solid var(--border)'
                                                            }}>
                                                                {game.away_score} – {game.home_score}
                                                            </div>
                                                            <div style={{ flex: 1, fontWeight: 600 }}>
                                                                {game.home_team_name}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {game.stadium_name && <span>🏟 {game.stadium_name}</span>}
                                                            {game.category_name && <span>{game.category_name}</span>}
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={game.status} />
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
