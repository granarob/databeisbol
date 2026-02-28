import { getTeam, getGames } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const team = await getTeam(params.id);
    if (!team) return { title: 'Equipo no encontrado' };
    return { title: `${team.name} — BeisbolData` };
}

function StatusBadge({ status }) {
    const map = {
        finished: ['badge-finished', 'Final'],
        scheduled: ['badge-scheduled', 'Prog.'],
        live: ['badge-live', '● Vivo'],
        suspended: ['badge-suspended', 'Susp.'],
        postponed: ['badge-postponed', 'Pospuesto'],
    };
    const [cls, label] = map[status] ?? ['badge-scheduled', status];
    return <span className={`badge ${cls}`}>{label}</span>;
}

export default async function TeamDetailPage({ params }) {
    const [team, gamesData] = await Promise.all([
        getTeam(params.id),
        getGames({ team: params.id }),
    ]);

    if (!team) notFound();

    const roster = team.rosters ?? [];
    const games = Array.isArray(gamesData) ? gamesData : (gamesData?.results ?? []);

    const pitchers = roster.filter(r => r.position === 'P');
    const fielders = roster.filter(r => r.position !== 'P');

    return (
        <>
            <section className="hero-strip">
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="team-logo-placeholder" style={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                            {(team.short_name || team.name || '?').slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                            <h1>{team.name}</h1>
                            <p>{team.category_name} · {team.season_name}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <span style={{ color: 'var(--green)', fontWeight: 700 }}>{team.won} G</span>
                                <span style={{ color: 'var(--red)', fontWeight: 700 }}>{team.lost} P</span>
                                <span style={{ color: 'var(--text-muted)' }}>{team.tied} E</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="page-content">
                <div className="container">
                    <div className="grid-2">
                        {/* ROSTER */}
                        <div>
                            <h2 className="section-title">Roster</h2>
                            {roster.length === 0 ? (
                                <div className="empty-state"><p>Sin jugadores registrados</p></div>
                            ) : (
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Jugador</th>
                                                <th>Pos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...pitchers, ...fielders].map(r => (
                                                <tr key={r.id}>
                                                    <td className="rank">{r.jersey_number}</td>
                                                    <td className="name-col">
                                                        <Link href={`/jugadores/${r.player}`} style={{ color: 'inherit' }}>
                                                            {r.player_name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span style={{ background: 'var(--bg-elevated)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                                                            {r.position}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* CALENDARIO */}
                        <div>
                            <h2 className="section-title">Calendario</h2>
                            {games.length === 0 ? (
                                <div className="empty-state"><p>Sin juegos programados</p></div>
                            ) : (
                                <div className="card">
                                    {games.slice(0, 12).map(game => {
                                        const d = new Date(game.game_date);
                                        const dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
                                        const timeStr = d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
                                        const isHome = String(game.home_team) === String(params.id);
                                        const opponent = isHome ? game.away_team_name : game.home_team_name;
                                        const vs = isHome ? `vs ${opponent}` : `@ ${opponent}`;
                                        const isFinished = game.status === 'finished';
                                        const score = isFinished ? (isHome ? `${game.home_score}–${game.away_score}` : `${game.away_score}–${game.home_score}`) : null;

                                        return (
                                            <div key={game.id} className="calendar-game-row">
                                                <span className="cal-date">{dateStr} {timeStr}</span>
                                                <span className="cal-matchup">{vs}</span>
                                                <StatusBadge status={game.status} />
                                                {score && <span className="cal-score">{score}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
