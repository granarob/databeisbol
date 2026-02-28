import { getPlayers } from '@/lib/api';
import Link from 'next/link';

export const metadata = { title: 'Jugadores — BeisbolData' };

export default async function JugadoresPage() {
    const data = await getPlayers();
    const players = Array.isArray(data) ? data : (data?.results ?? []);

    return (
        <>
            <section className="hero-strip">
                <div className="container">
                    <h1>Jugadores</h1>
                    <p>{players.length} jugadores registrados</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">
                    {players.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">👤</div>
                            <p>No hay jugadores registrados aún</p>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {players.map(player => {
                                const initials = `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`;
                                const handInfo = [
                                    player.bats_hand && `Batea: ${player.bats_hand}`,
                                    player.throws_hand && `Lanza: ${player.throws_hand}`,
                                ].filter(Boolean).join(' · ');

                                return (
                                    <Link key={player.id} href={`/jugadores/${player.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="player-card">
                                            <div className="player-avatar">{initials}</div>
                                            <div className="player-info">
                                                <div className="player-full-name">{player.full_name}</div>
                                                <div className="player-meta">
                                                    {handInfo && <span>{handInfo}</span>}
                                                    {player.age && <span style={{ color: 'var(--gold)' }}>{player.age} años</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
