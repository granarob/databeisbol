import { getLeagues, getRecentGames, getUpcomingGames, getGlobalSummary } from '@/lib/api';
import LeaguesCarousel from '@/components/LeaguesCarousel';
import PlayerSearch from '@/components/PlayerSearch';
import UpcomingGames from '@/components/UpcomingGames';
import StatsCounters from '@/components/StatsCounters';
import TickerResultados from '@/components/TickerResultados';
import StandingsTable from '@/components/StandingsTable';
import { Newspaper } from 'lucide-react';

export default async function HomePage() {
  let leagues = [], games = [], upcoming = [], summary = null;

  try {
    const [leaguesData, recentGames, upcomingGames, globalSummary] = await Promise.all([
      getLeagues(),
      getRecentGames(),
      getUpcomingGames(),
      getGlobalSummary(),
    ]);
    leagues  = Array.isArray(leaguesData)   ? leaguesData   : (leaguesData?.results ?? []);
    games    = Array.isArray(recentGames)    ? recentGames    : (recentGames?.results ?? []);
    upcoming = Array.isArray(upcomingGames)  ? upcomingGames  : (upcomingGames?.results ?? []);
    summary  = globalSummary;
  } catch {
    // Backend no disponible
  }

  return (
    <div className="home-page">
      {/* ── TICKER DE RESULTADOS ── */}
      <TickerResultados games={games} />

      {/* ── A. HERO SECTION ── */}
      <header className="home-hero animate-in fade-in">
        <div className="container home-hero__inner">
          <h1 className="animate-in slide-up delay-100">
            El futuro del béisbol<br />
            <span>comienza con un dato</span>
          </h1>
          <p className="home-hero__subtitle animate-in slide-up delay-200">
            Plataforma de estadísticas en tiempo real para ligas de formación
          </p>
          <div className="animate-in slide-up delay-300">
            <PlayerSearch />
          </div>
        </div>
      </header>

      {/* ── LEAGUES CAROUSEL (se preserva intacto) ── */}
      <LeaguesCarousel leagues={leagues} recentGames={games} heroMode />

      {/* ── B. TABLA DE POSICIONES ── */}
      <StandingsTable leagues={leagues} />

      {/* ── C. PRÓXIMOS JUEGOS ── */}
      <UpcomingGames games={upcoming} />

      {/* ── D. NUESTROS NÚMEROS ── */}
      <StatsCounters summary={summary} />

      {/* ── E. NOTICIAS / BLOG ── */}
      <section className="news-section">
        <div className="container">
          <h2 className="section-title">Noticias y Consejos</h2>
          <div className="news-grid">
            {[
              {
                tag: 'Entrenamiento',
                title: '¿Cómo mejorar el swing en categorías menores?',
                excerpt: 'Técnicas aprobadas por entrenadores profesionales para desarrollar la mecánica correcta desde temprana edad.',
                date: '15 Mar 2026',
              },
              {
                tag: 'Resultados',
                title: 'Resultados del Campeonato Nacional U-12',
                excerpt: 'Resumen completo de la final del torneo nacional de la categoría Sub-12 celebrado en Maracaibo.',
                date: '10 Mar 2026',
              },
              {
                tag: 'Estadísticas',
                title: 'Los 5 promedios de bateo más altos de la temporada',
                excerpt: 'Conoce a los peloteros que están liderando las estadísticas ofensivas en todas las ligas registradas.',
                date: '8 Mar 2026',
              },
            ].map((article, i) => (
              <article key={i} className="news-card">
                <div className="news-card__image">
                  <Newspaper size={36} strokeWidth={1} />
                </div>
                <div className="news-card__body">
                  <span className="news-card__tag">{article.tag}</span>
                  <h3 className="news-card__title">{article.title}</h3>
                  <p className="news-card__excerpt">{article.excerpt}</p>
                  <span className="news-card__date">{article.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
