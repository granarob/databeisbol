import { getRecentGames, getStandings } from '@/lib/api';

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

function GameCard({ game }) {
  const date = new Date(game.game_date);
  const dateStr = date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const isFinished = game.status === 'finished';

  return (
    <div className="game-card">
      <div className="game-card-header">
        <span className="game-card-date">{dateStr}</span>
        <StatusBadge status={game.status} />
      </div>
      <div className="game-card-teams">
        <div className="game-card-team">
          <span className="team-short">{game.away_team_name || 'VIS'}</span>
          <span className="team-name">Visitante</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          {isFinished
            ? <span className="game-card-score">{game.away_score} – {game.home_score}</span>
            : <span className="game-card-vs">VS</span>
          }
        </div>
        <div className="game-card-team">
          <span className="team-short">{game.home_team_name || 'LOC'}</span>
          <span className="team-name">Local</span>
        </div>
      </div>
      {game.stadium_name && (
        <div className="game-card-footer">
          <span>🏟 {game.stadium_name}</span>
          <span>{game.category_name}</span>
        </div>
      )}
    </div>
  );
}

function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📊</div>
        <p>Sin datos de posiciones aún</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th>G</th>
            <th>P</th>
            <th>E</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => {
            const total = (team.won || 0) + (team.lost || 0);
            const pct = total > 0 ? (team.won / total).toFixed(3) : '.000';
            return (
              <tr key={team.id}>
                <td className="rank">{i + 1}</td>
                <td className="name-col">
                  <a href={`/equipos/${team.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem', fontSize: '0.8rem' }}>{team.short_name}</span>
                    {team.name}
                  </a>
                </td>
                <td style={{ color: 'var(--green)', fontWeight: 700 }}>{team.won}</td>
                <td style={{ color: 'var(--red)', fontWeight: 700 }}>{team.lost}</td>
                <td>{team.tied}</td>
                <td className="stat-col">{pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function HomePage() {
  const [recentGames, standings] = await Promise.all([
    getRecentGames(),
    getStandings(),
  ]);

  const games = Array.isArray(recentGames) ? recentGames : (recentGames?.results ?? []);
  const standingsData = Array.isArray(standings) ? standings : (standings?.results ?? []);

  return (
    <>
      <section className="hero-strip">
        <div className="container">
          <h1>Béisbol Menor<br /><span>Venezuela</span></h1>
          <p>Estadísticas, resultados y líderes de las ligas en tiempo real</p>
        </div>
      </section>

      <div className="page-content">
        <div className="container">
          <div className="grid-sidebar">
            {/* Resultados recientes */}
            <div>
              <h2 className="section-title">Resultados Recientes</h2>
              {games.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">⚾</div>
                  <p>No hay juegos registrados aún</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {games.map(game => <GameCard key={game.id} game={game} />)}
                </div>
              )}
            </div>

            {/* Tabla de posiciones */}
            <div>
              <h2 className="section-title">Tabla de Posiciones</h2>
              <StandingsTable standings={standingsData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
