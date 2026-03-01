import { getTeams } from '@/lib/api';
import Link from 'next/link';

export const metadata = { title: 'Equipos — BeisbolData' };

export default async function EquiposPage() {
    const data = await getTeams();
    const teams = Array.isArray(data) ? data : (data?.results ?? []);

    return (
        <>
            <section className="hero-strip animate-in fade-in">
                <div className="container">
                    <h1 className="animate-in slide-up delay-100">Equipos</h1>
                    <p className="animate-in slide-up delay-200">{teams.length} equipos registrados en el sistema</p>
                </div>
            </section>

            <div className="page-content">
                <div className="container">
                    {teams.length === 0 ? (
                        <div className="empty-state animate-in slide-up delay-300">
                            <div className="icon">🏟</div>
                            <p>No hay equipos registrados aún</p>
                        </div>
                    ) : (
                        <div className="grid-3 animate-in slide-up delay-300">
                            {teams.map((team, index) => (
                                <Link key={team.id} href={`/equipos/${team.id}`} style={{ textDecoration: 'none' }}>
                                    <div className={`team-card animate-in fade-in delay-${(index % 5 + 1) * 100}`}>
                                        <div className="team-logo-placeholder">
                                            {(team.short_name || team.name || '?').slice(0, 3).toUpperCase()}
                                        </div>
                                        <div className="team-name-main">{team.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {team.category_name} · {team.season_name}
                                        </div>
                                        <div className="team-record">
                                            <span className="wins">{team.won}G</span>
                                            <span className="losses">{team.lost}P</span>
                                            {team.tied > 0 && <span>{team.tied}E</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
