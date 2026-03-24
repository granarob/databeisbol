import { getLeagues, getRecentGames, getUpcomingGames, getGlobalSummary } from '@/lib/api';
import LeaguesCarousel from '@/components/LeaguesCarousel';
import PlayerSearch from '@/components/PlayerSearch';
import UpcomingGames from '@/components/UpcomingGames';
import StatsCounters from '@/components/StatsCounters';
// TickerResultados eliminado
import StandingsTable from '@/components/StandingsTable';
import AnimatedSection from '@/components/AnimatedSection';
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
      {/* ── A. HERO SECTION (Imagen Limpia en Posición Absoluta) ── */}
      <header className="home-hero" />
      <div className="home-hero-spacer" />

      {/* ── A2. HERO INFO (Texto debajo de la imagen) ── */}
      <section className="home-hero-info animate-in slide-up delay-200">
        <div className="container">
          <h1>
            El futuro del béisbol<br />
            <span>comienza con un dato</span>
          </h1>
          <p className="home-hero-info__subtitle">
            Plataforma de estadísticas en tiempo real para ligas de formación
          </p>
          <div className="w-full max-w-[540px] mx-auto mt-8">
            <PlayerSearch />
          </div>
        </div>
      </section>

      {/* ── LEAGUES CAROUSEL (se preserva intacto) ── */}
      <LeaguesCarousel leagues={leagues} recentGames={games} heroMode />

      {/* ── B. TABLA DE POSICIONES ── */}
      <AnimatedSection>
        <StandingsTable leagues={leagues} />
      </AnimatedSection>

      {/* ── C. PRÓXIMOS JUEGOS ── */}
      <AnimatedSection delay={0.1}>
        <UpcomingGames games={upcoming} />
      </AnimatedSection>

      {/* ── D. NUESTROS NÚMEROS ── */}
      <AnimatedSection delay={0.2}>
        <StatsCounters summary={summary} />
      </AnimatedSection>

      {/* ── E. NOTICIAS / BLOG ── */}
      <AnimatedSection className="news-section">
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
      </AnimatedSection>
    </div>
  );
}
