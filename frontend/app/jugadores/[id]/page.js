import { getPlayer, getPlayerStats, getPlayerGameLog } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const player = await getPlayer(params.id);
    if (!player) return { title: 'Jugador no encontrado' };
    return { title: `${player.full_name} — PlayballData` };
}

// Lógica de Generación de Contexto en Lenguaje Natural para Motores de Respuesta (GEO)
function generateGeoSummary(player, stats) {
    const name = player.full_name;
    const ageInfo = player.age ? `de ${player.age} años` : '';
    const pos = player.rosters?.[0]?.position ?? 'pelotero';
    
    let summary = '';
    
    const b = stats?.batting ?? {};
    const hasBatting = b.total_ab > 0 || b.avg > 0;
    
    const p = stats?.pitching ?? {};
    const hasPitching = p.total_ip_outs > 0 || p.era > 0;
    
    if (hasBatting && hasPitching) {
        summary = `El versátil jugador ${name} ${ageInfo} se destaca tanto a la ofensiva como desde el montículo. Como toletero, registra un destacado promedio de bateo de ${b.avg?.toFixed(3) ?? '.000'} con ${b.total_h ?? 0} indiscutibles y ${b.total_rbi ?? 0} carreras impulsadas. Mientras tanto, en su labor como serpentinero, acumula ${p.ip_display ?? '0'} entradas de labor con una efectividad de ${p.era?.toFixed(2) ?? '0.00'} y ${p.total_so ?? 0} bateadores abanicados.`;
    } else if (hasBatting) {
        summary = `El sólido cañonero ${name} ${ageInfo}, quien se desempeña en la posición de ${pos}, está teniendo una campaña sumamente productiva. Actualmente mantiene un promedio de bateo de ${b.avg?.toFixed(3) ?? '.000'} en la temporada regular, logrando conectar un total de ${b.total_h ?? 0} hits, con ${b.total_hr ?? 0} cuadrangulares y remolcando ${b.total_rbi ?? 0} carreras para su equipo. Su porcentaje de embasado y poder se reflejan en un OPS de ${b.ops?.toFixed(3) ?? '.000'}, consolidándose como una de las piezas claves a la ofensiva.`;
    } else if (hasPitching) {
        summary = `Desde la lomita de las responsabilidades, el talentoso lanzador ${name} ${ageInfo} ha demostrado gran dominio frente a los bateadores rivales. Ha acumulado un total de ${p.ip_display ?? '0'} entradas lanzadas, registrando un promedio de carreras limpias permitidas (ERA) de ${p.era?.toFixed(2) ?? '0.00'} y un excelente registro de ${p.total_so ?? 0} ponches recetados, consolidándose como uno de los monticulistas más consistentes de la categoría.`;
    } else {
        summary = `El prospecto ${name} ${ageInfo} es una de las jóvenes promesas registradas en la plataforma PlayballData. Desempeñándose principalmente como ${pos}, este atleta continúa su preparación y desarrollo deportivo dentro del béisbol menor en Venezuela, perfilándose para tener un gran impacto en sus próximos compromisos oficiales.`;
    }
    
    return summary;
}

function StatBanner({ stats }) {
    if (!stats) return null;
    const b = stats.batting ?? {};
    const items = [
        { val: b.avg?.toFixed(3) ?? '.000', lbl: 'AVG', full: 'Promedio de Bateo / Batting Average' },
        { val: b.total_hr ?? 0, lbl: 'HR', full: 'Cuadrangulares / Home Runs' },
        { val: b.total_rbi ?? 0, lbl: 'RBI', full: 'Carreras Empujadas / Runs Batted In' },
        { val: b.total_h ?? 0, lbl: 'H', full: 'Imparables / Hits' },
        { val: b.total_bb ?? 0, lbl: 'BB', full: 'Bases por Bolas / Bases on Balls' },
        { val: b.ops?.toFixed(3) ?? '.000', lbl: 'OPS', full: 'Porcentaje de Embasado más Slugging / On-Base plus Slugging' },
    ];
    return (
        <div className="stat-banner">
            {items.map(({ val, lbl, full }) => (
                <div key={lbl} className="stat-banner-item">
                    <div className="val">{val}</div>
                    <div className="lbl">
                        <abbr title={full}>{lbl}</abbr>
                    </div>
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
                <caption className="sr-only">Historial de rendimiento al bate en la temporada actual</caption>
                <thead>
                    <tr>
                        <th scope="col"><abbr title="Juego o Encuentro">Juego</abbr></th>
                        <th scope="col"><abbr title="Turnos al Bate / At Bats">AB</abbr></th>
                        <th scope="col"><abbr title="Hits / Imparables">H</abbr></th>
                        <th scope="col"><abbr title="Dobles / Doubles">2B</abbr></th>
                        <th scope="col"><abbr title="Triples / Triples">3B</abbr></th>
                        <th scope="col"><abbr title="Cuadrangulares / Home Runs">HR</abbr></th>
                        <th scope="col"><abbr title="Carreras Empujadas / Runs Batted In">RBI</abbr></th>
                        <th scope="col"><abbr title="Bases por Bolas / Base on Balls">BB</abbr></th>
                        <th scope="col"><abbr title="Ponches / Strikeouts">K</abbr></th>
                        <th scope="col"><abbr title="Promedio de Bateo / Batting Average">AVG</abbr></th>
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
                    <caption className="sr-only">Historial de rendimiento de lanzamientos en la temporada actual</caption>
                    <thead>
                        <tr>
                            <th scope="col"><abbr title="Juego o Encuentro">Juego</abbr></th>
                            <th scope="col"><abbr title="Entradas Lanzadas / Innings Pitched">IP</abbr></th>
                            <th scope="col"><abbr title="Hits / Imparables Permitidos">H</abbr></th>
                            <th scope="col"><abbr title="Carreras Limpias Permitidas / Earned Runs">CL</abbr></th>
                            <th scope="col"><abbr title="Bases por Bolas Otorgadas / Base on Balls">BB</abbr></th>
                            <th scope="col"><abbr title="Ponches / Strikeouts">K</abbr></th>
                            <th scope="col"><abbr title="Efectividad / Earned Run Average">ERA</abbr></th>
                            <th scope="col"><abbr title="Decisión del Encuentro (Victoria / Derrota)">Dec.</abbr></th>
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
    const geoSummary = generateGeoSummary(player, stats);

    // Schema.org Structured Data (JSON-LD) para indexación de Google y motores de IA
    const jsonLdSchema = {
        "@context": "https://schema.org",
        "@type": "Athlete",
        "name": player.full_name,
        "description": geoSummary,
        "knowsAbout": ["Baseball", "Softball", "Estadísticas de Béisbol Menor"],
        "nationality": {
            "@type": "Country",
            "name": "Venezuela"
        },
        "memberOf": {
            "@type": "SportsTeam",
            "name": roster?.team_name ?? "Equipo por definir",
            "sport": "Baseball"
        },
        "url": `https://playballdata.com/jugadores/${player.id}`
    };

    return (
        <>
            {/* Inyección nativa de Datos Estructurados JSON-LD en SSR */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
            />

            <section className="profile-hero animate-in slide-up">
                <div className="container">
                    <div className="profile-hero-inner">
                        <div className="profile-avatar">{initials}</div>
                        <div>
                            <h1 className="profile-name">{player.full_name}</h1>
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

            <div className="page-content animate-in fade-in delay-100">
                <div className="container">

                    {/* Resumen de Inteligencia Artificial / GEO en Prosa */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-body">
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                                🔮 Análisis Deportivo (AI-GEO)
                            </h2>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-dim)' }}>
                                {geoSummary}
                            </p>
                        </div>
                    </div>

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
                                    { val: stats.pitching.ip_display, lbl: 'IP', full: 'Entradas Lanzadas / Innings Pitched' },
                                    { val: stats.pitching.total_so ?? 0, lbl: 'K', full: 'Ponches / Strikeouts' },
                                    { val: stats.pitching.total_bb ?? 0, lbl: 'BB', full: 'Bases por Bolas / Bases on Balls' },
                                    { val: stats.pitching.era?.toFixed(2) ?? '0.00', lbl: 'ERA', full: 'Efectividad / Earned Run Average' },
                                    { val: stats.pitching.whip?.toFixed(2) ?? '0.00', lbl: 'WHIP', full: 'Bases por Bolas e Hits por Entrada Lanzada / Walks plus Hits per Inning Pitched' },
                                    { val: stats.pitching.total_er ?? 0, lbl: 'CL', full: 'Carreras Limpias Permitidas / Earned Runs' },
                                ].map(({ val, lbl, full }) => (
                                    <div key={lbl} className="stat-banner-item">
                                        <div className="val">{val}</div>
                                        <div className="lbl">
                                            <abbr title={full}>{lbl}</abbr>
                                        </div>
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
