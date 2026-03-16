'use client';
import Link from 'next/link';

export default function TickerResultados({ games = [] }) {
  // Solo mostrar juegos finalizados
  const finishedGames = games.filter(g => g.status === 'finished');

  if (!finishedGames.length) {
    return null;
  }

  // Duplicar para efecto infinito continuo si son pocos
  const tickerItems = [...finishedGames, ...finishedGames, ...finishedGames, ...finishedGames];

  return (
    <div className="ticker-wrapper" aria-label="Resultados recientes">
      <div className="ticker-label">
        <span className="live-dot"></span> ÚLTIMOS RESULTADOS
      </div>
      <div className="ticker-track-container">
        <div className="ticker-track">
          {tickerItems.map((game, i) => (
            <Link key={`${game.id}-${i}`} href={`/liga/${game.league_id || game.season_league_id}`} className="ticker-item">
              <span className="ticker-team">{game.away_team_name}</span>
              <span className={game.away_score > game.home_score ? "ticker-score winner" : "ticker-score"}>{game.away_score}</span>
              <span className="ticker-sep">-</span>
              <span className={game.home_score > game.away_score ? "ticker-score winner" : "ticker-score"}>{game.home_score}</span>
              <span className="ticker-team">{game.home_team_name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
