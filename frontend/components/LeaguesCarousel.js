'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trophy, Zap, Star, Flame, Award, Target } from 'lucide-react';

/* ─── Paleta de colores para cada liga ─── */
const LEAGUE_PALETTES = [
  { from: '#152a3e', mid: '#0d1b2a', to: '#060d18', accent: '#38bdf8', glow: '#38bdf8' },
  { from: '#3a1800', mid: '#240f00', to: '#120700', accent: '#f4b942', glow: '#f59e0b' },
  { from: '#003818', mid: '#002410', to: '#00120a', accent: '#34d399', glow: '#10b981' },
  { from: '#28104a', mid: '#1a0a30', to: '#0a0514', accent: '#a78bfa', glow: '#8b5cf6' },
  { from: '#3a1e00', mid: '#251300', to: '#120900', accent: '#fb923c', glow: '#f97316' },
  { from: '#003040', mid: '#001f28', to: '#000f12', accent: '#22d3ee', glow: '#06b6d4' },
  { from: '#2e0040', mid: '#1c0028', to: '#0e0014', accent: '#e879f9', glow: '#d946ef' },
  { from: '#003030', mid: '#001e1e', to: '#000e0d', accent: '#2dd4bf', glow: '#14b8a6' },
];

const LEAGUE_ICONS = [Trophy, Zap, Star, Flame, Award, Target, Star, Zap];

/* ─── Mini preview de partidos ─── */
function MiniGamePreview({ games }) {
  if (!games || games.length === 0) return (
    <div className="league-card__preview-empty">Sin juegos recientes</div>
  );
  return (
    <div className="league-card__preview-list">
      {games.slice(0, 2).map((g, i) => (
        <div className="league-card__preview-game" key={i}>
          <span className="preview-away">{g.away_team_name || 'VIS'}</span>
          <span className="preview-score">
            {g.status === 'finished' ? `${g.away_score}-${g.home_score}` : g.status === 'live' ? '● VIVO' : 'vs'}
          </span>
          <span className="preview-home">{g.home_team_name || 'LOC'}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Tarjeta HERO (modo inicio - Diseño Baseball Card) ─── */
function HeroLeagueCard({ league, index, recentGames }) {
  const palette = LEAGUE_PALETTES[index % LEAGUE_PALETTES.length];
  const IconComp = LEAGUE_ICONS[index % LEAGUE_ICONS.length];
  const [hovered, setHovered] = useState(false);

  // Stats dummy (podrían venir de la BD)
  const stats = [
    { label: 'EQUIPOS', val: league.teams_count || '8', icon: <Trophy size={14} /> },
    { label: 'JUEGOS', val: league.games_count || '120', icon: <Zap size={14} /> },
    { label: 'PUNTOS', val: league.points || '450', icon: <Target size={14} /> },
    { label: 'RATING', val: '1.000', icon: <Star size={14} /> },
  ];

  return (
    <Link href={`/liga/${league.id}`} className="hero-bbcard-link" prefetch>
      <motion.div
        className="hero-bbcard"
        style={{
          '--card-glow': palette.glow,
          '--card-accent': palette.accent,
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.3 } }}
      >
        <div className="hero-bbcard__inner">
          {/* Header */}
          <div className="hero-bbcard__header">
            <div className="hero-bbcard__header-text">
              <div className="hero-bbcard__subtitle">{league.city || 'VENEZUELA'}</div>
              <div className="hero-bbcard__title">{(league.name || 'Liga').toUpperCase()}</div>
              <div className="hero-bbcard__position">BÉISBOL / LIGA</div>
            </div>
            <div className="hero-bbcard__rating-badge">99</div>
          </div>

          {/* Main Image Area */}
          <div className="hero-bbcard__image-box">
            <IconComp className="hero-bbcard__bg-icon" size={150} strokeWidth={1} />
            <div className="hero-bbcard__image-corners"></div>
            <div className="hero-bbcard__image-badge">#{index + 1}</div>
          </div>

          {/* Stats Row */}
          <div className="hero-bbcard__stats">
            {stats.map((stat, i) => (
              <div className="hero-bbcard__stat-box" key={i}>
                <div className="hero-bbcard__stat-label">
                  {stat.icon} <span>{stat.label}</span>
                </div>
                <div className="hero-bbcard__stat-val">{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="hero-bbcard__footer">
            <div className="hero-bbcard__footer-logo">
              <div className="logo-circle">BB</div>
              <span>BEISBOLDATA</span>
            </div>
            <div className="hero-bbcard__footer-live">
              <span className="live-dot"></span> LIVE
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Tarjeta CARRUSEL (compacta, otras páginas) ─── */
function CarouselLeagueCard({ league, index, recentGames }) {
  const palette = LEAGUE_PALETTES[index % LEAGUE_PALETTES.length];
  const IconComp = LEAGUE_ICONS[index % LEAGUE_ICONS.length];
  const [isHovered, setIsHovered] = useState(false);

  const initials = (league.name || '??').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const leagueGames = (recentGames || []).filter(g => g.league_id === league.id || g.season_league_id === league.id);

  return (
    <Link href={`/liga/${league.id}`} className="league-card__link" prefetch>
      <motion.div
        className="league-card"
        style={{ '--card-from': palette.from, '--card-to': palette.to, '--card-accent': palette.accent }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.08, y: -10, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
      >
        <div className="league-card__bg" />
        <motion.div className="league-card__shimmer" animate={{ opacity: isHovered ? 1 : 0 }} transition={{ duration: 0.3 }} />
        <motion.div className="league-card__icon-wrap"
          animate={isHovered ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.35 }}>
          <IconComp size={72} strokeWidth={1} />
        </motion.div>
        <div className="league-card__initials">{initials}</div>
        <div className="league-card__body">
          <p className="league-card__name">{league.name}</p>
          {league.city && <p className="league-card__city">{league.city}</p>}
        </div>
        <motion.div className="league-card__expanded"
          initial={{ opacity: 0, height: 0 }}
          animate={isHovered ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}>
          <MiniGamePreview games={leagueGames} />
        </motion.div>
        <motion.div className="league-card__glow"
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }} />
      </motion.div>
    </Link>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function LeaguesCarousel({ leagues = [], recentGames = [], heroMode = false }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateScrollButtons); ro.disconnect(); };
  }, [updateScrollButtons, leagues]);

  const scroll = dir => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
  };

  if (!leagues.length) return null;

  /* ── HERO MODE (Auto-scrolling Marquee) ── */
  if (heroMode) {
    // Aseguramos tener suficientes elementos para que el scroll cubra pantallas grandes
    // Repetimos la lista original hasta tener al menos 8 elementos.
    let baseLeagues = [...leagues];
    while (baseLeagues.length > 0 && baseLeagues.length < 8) {
      baseLeagues = [...baseLeagues, ...leagues];
    }
    // Para el scroll infinito perfecto, duplicamos el bloque resultante
    // Así se anima de 0 a -50% imperceptiblemente.
    const marqueeLeagues = [...baseLeagues, ...baseLeagues];

    return (
      <section className="hero-leagues-section">
        <div className="hero-marquee-container">
          <div className="hero-marquee-track">
            {marqueeLeagues.map((league, i) => (
              <div className="hero-marquee-item" key={`${league.id}-${i}`}>
                <HeroLeagueCard league={league} index={i % leagues.length} recentGames={recentGames} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── CARRUSEL MODE ── */
  return (
    <section className="leagues-section animate-in fade-in">
      <div className="leagues-header container">
        <h2 className="section-title">Ligas</h2>
        <div className="leagues-nav">
          <button className="carousel-arrow" onClick={() => scroll('left')} disabled={!canScrollLeft} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="carousel-arrow" onClick={() => scroll('right')} disabled={!canScrollRight} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="leagues-track-wrapper">
        <div className={`track-fade track-fade--left${canScrollLeft ? ' visible' : ''}`} />
        <div className={`track-fade track-fade--right${canScrollRight ? ' visible' : ''}`} />
        <div ref={trackRef} className="leagues-track">
          {leagues.map((league, i) => (
            <CarouselLeagueCard key={league.id} league={league} index={i} recentGames={recentGames} />
          ))}
        </div>
      </div>
    </section>
  );
}
