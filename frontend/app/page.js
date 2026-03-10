import { getLeagues, getRecentGames } from '@/lib/api';
import LeaguesCarousel from '@/components/LeaguesCarousel';

export default async function HomePage() {
  let leagues = [], games = [];

  try {
    const [leaguesData, recentGames] = await Promise.all([
      getLeagues(),
      getRecentGames(),
    ]);
    leagues = Array.isArray(leaguesData) ? leaguesData : (leaguesData?.results ?? []);
    games   = Array.isArray(recentGames) ? recentGames : (recentGames?.results ?? []);
  } catch {
    // Backend no disponible
  }

  return (
    <div className="home-leagues-page">
      {/* Hero minimal */}
      <header className="home-hero animate-in fade-in">
        <h1 className="animate-in slide-up delay-100">
          Béisbol Menor<br />
          <span>Venezuela</span>
        </h1>
        <p className="animate-in slide-up delay-200">
          Selecciona una liga para explorar estadísticas, equipos y resultados
        </p>
      </header>

      {/* Liga cards — protagonistas de la página */}
      <LeaguesCarousel leagues={leagues} recentGames={games} heroMode />
    </div>
  );
}
