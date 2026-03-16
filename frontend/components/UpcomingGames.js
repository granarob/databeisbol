import { Calendar, MapPin } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    scheduled: ['badge-scheduled', 'Programado'],
    live: ['badge-live', '● EN VIVO'],
    suspended: ['badge-suspended', 'Suspendido'],
    postponed: ['badge-postponed', 'Pospuesto'],
  };
  const [cls, label] = map[status] ?? ['badge-scheduled', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function UpcomingGames({ games = [] }) {
  if (!games || games.length === 0) {
    return (
      <section className="upcoming-section">
        <div className="container">
          <h2 className="section-title">Próximos Juegos</h2>
          <div className="upcoming-empty">
            <Calendar size={40} strokeWidth={1} />
            <p>No hay juegos programados próximamente</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="upcoming-section">
      <div className="container">
        <h2 className="section-title">Próximos Juegos</h2>
        <div className="upcoming-grid">
          {games.map((game) => {
            const d = new Date(game.game_date);
            const dateStr = d.toLocaleDateString('es-VE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const timeStr = d.toLocaleTimeString('es-VE', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={game.id} className="upcoming-card">
                <div className="upcoming-card__header">
                  <span className="upcoming-card__date">
                    <Calendar size={12} /> {dateStr}
                  </span>
                  <StatusBadge status={game.status} />
                </div>
                <div className="upcoming-card__matchup">
                  <div className="upcoming-card__team">
                    <span className="upcoming-card__team-short">
                      {game.away_team_short || game.away_team_name?.slice(0, 3).toUpperCase() || 'VIS'}
                    </span>
                    <span className="upcoming-card__team-name">{game.away_team_name}</span>
                  </div>
                  <div className="upcoming-card__vs">
                    {game.status === 'live' ? (
                      <span className="upcoming-card__live-score">
                        {game.away_score} - {game.home_score}
                      </span>
                    ) : (
                      <span>{timeStr}</span>
                    )}
                  </div>
                  <div className="upcoming-card__team">
                    <span className="upcoming-card__team-short">
                      {game.home_team_short || game.home_team_name?.slice(0, 3).toUpperCase() || 'LOC'}
                    </span>
                    <span className="upcoming-card__team-name">{game.home_team_name}</span>
                  </div>
                </div>
                <div className="upcoming-card__footer">
                  {game.stadium_name && (
                    <span><MapPin size={11} /> {game.stadium_name}</span>
                  )}
                  {game.category_name && (
                    <span className="upcoming-card__cat">{game.category_name}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
