import { getPlayer, getPlayerStats, getPlayerGameLog } from '@/lib/api';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const player = await getPlayer(params.id);
    if (!player) return { title: 'Jugador no encontrado' };
    return { title: `${player.full_name} — BeisbolData` };
}

function StatBanner({ stats }) {
    if (!stats) return null;
    const b = stats.batting ?? {};
    const items = [
        { val: b.avg?.toFixed(3) ?? '.000', lbl: 'AVG' },
        { val: b.total_hr ?? 0, lbl: 'HR' },
        { val: b.total_rbi ?? 0, lbl: 'RBI' },
        { val: b.total_h ?? 0, lbl: 'Hits' },
        { val: b.total_bb ?? 0, lbl: 'BB' },
        { val: b.ops?.toFixed(3) ?? '.000', lbl: 'OPS' },
    ];
    return (
        <div className="stat-banner">
            {items.map(({ val, lbl }) => (
                <div key={lbl} className="stat-banner-item">
                    <div className="val">{val}</div>
                    <div className="lbl">{lbl}</div>
                </div>
            ))}
        </div>
    );
}

function GameLogTable({ gamelog }) {
    const batting = gamelog?.batting ?? [];
    if (batting.length === 0) {
        return <div className="empty-state"><p>Sin game log disponible</p></div>;
    }
    return (
        <div className="table-wrap">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Juego</th><th>AB</th><th>H</th><th>2B</th><th>3B</th>
                        <th>HR</th><th>RBI</th><th>BB</th><th>K</th><th>AVG</th>
                    </tr>
                </thead>
                <tbody>
                    {batting.map(row => (
                        <tr key={row.id}>
                            <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>J#{row.game}</td>
                            <td>{row.ab}</td>
                            <td style={{ fontWeight: 700, color: row.h > 0 ? 'var(--green)' : 'inherit' }}>{row.h}</td>
                            <td>{row.doubles}</td>
                            <td>{row.triples}</td>
                            <td style={{ color: row.hr > 0 ? 'var(--accent)' : 'inherit' }}>{row.hr}</td>
                            <td>{row.rbi}</td>
                            <td>{row.bb}</td>
                            <td>{row.so}</td>
                            <td className="stat-col">{row.avg?.toFixed(3) ?? '.000'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PitchingLogTable({ gamelog }) {
    const pitching = gamelog?.pitching ?? [];
    if (pitching.length === 0) return null;
    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 className="section-title">📋 Game Log — Pitcheo</h3>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Juego</th><th>IP</th><th>H</th><th>CL</th><th>BB</th><th>K</th><th>ERA</th><th>Dec.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pitching.map(row => (
                            <tr key={row.id}>
                                <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>J#{row.game}</td>
                                <td>{row.ip_display}</td>
                                <td>{row.h}</td>
                                <td style={{ color: row.er > 0 ? 'var(--red)' : 'inherit' }}>{row.er}</td>
                                <td>{row.bb}</td>
                                <td>{row.so}</td>
                                <td className="stat-col">{row.era?.toFixed(2) ?? '0.00'}</td>
                                <td>
                                    {row.decision && (
                                        <span className={`badge ${row.decision === 'win' ? 'badge-finished' : row.decision === 'loss' ? 'badge-suspended' : 'badge-scheduled'}`}>
                                            {row.decision?.toUpperCase()}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default async function PlayerProfilePage({ params }) {
    const [player, stats, gamelog] = await Promise.all([
        getPlayer(params.id),
        getPlayerStats(params.id),
        getPlayerGameLog(params.id),
    ]);

    if (!player) notFound();

    const initials = `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`;
    const roster = player.rosters?.[0];

    return (
        <>
            <section className="profile-hero">
                <div className="container">
                    <div className="profile-hero-inner">
                        <div className="profile-avatar">{initials}</div>
                        <div>
                            <div className="profile-name">{player.full_name}</div>
                            <div className="profile-meta">
                                {roster && <span>#{roster.jersey_number} · {roster.position}</span>}
                                {player.age && <span>🎂 {player.age} años</span>}
                                {player.bats_hand && <span>🏏 Batea: {player.bats_hand}</span>}
                                {player.throws_hand && <span>⚡ Lanza: {player.throws_hand}</span>}
                                {player.height_cm && <span>📏 {player.height_cm}cm</span>}
                                {player.weight_kg && <span>⚖️ {player.weight_kg}kg</span>}
                            </div>
                            {player.bio && (
                                <p style={{ marginTop: '0.75rem', color: 'var(--text-dim)', fontSize: '0.875rem', maxWidth: '500px' }}>
                                    {player.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="page-content">
                <div className="container">

                    {/* Stats acumuladas */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 className="section-title">Estadísticas de Temporada</h2>
                        <StatBanner stats={stats} />
                    </div>

                    {/* Pitching acumulado */}
                    {stats?.pitching?.total_ip_outs > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="section-title">Estadísticas de Pitcheo</h2>
                            <div className="stat-banner">
                                {[
                                    { val: stats.pitching.ip_display, lbl: 'IP' },
                                    { val: stats.pitching.total_so ?? 0, lbl: 'K' },
                                    { val: stats.pitching.total_bb ?? 0, lbl: 'BB' },
                                    { val: stats.pitching.era?.toFixed(2) ?? '0.00', lbl: 'ERA' },
                                    { val: stats.pitching.whip?.toFixed(2) ?? '0.00', lbl: 'WHIP' },
                                    { val: stats.pitching.total_er ?? 0, lbl: 'CL' },
                                ].map(({ val, lbl }) => (
                                    <div key={lbl} className="stat-banner-item">
                                        <div className="val">{val}</div>
                                        <div className="lbl">{lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Log Bateo */}
                    <h2 className="section-title">📋 Game Log — Bateo</h2>
                    <GameLogTable gamelog={gamelog} />

                    {/* Game Log Pitcheo */}
                    <PitchingLogTable gamelog={gamelog} />

                </div>
            </div>
        </>
    );
}
