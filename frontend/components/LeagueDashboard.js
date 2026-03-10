'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, Users, Calendar, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';

/* ─── TABS COMPONENT ─── */
function TabBar({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { key: 'equipos', label: 'Equipos', icon: Users },
    { key: 'calendario', label: 'Calendario', icon: Calendar },
  ];

  return (
    <div className="league-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            className={`league-tab${activeTab === tab.key ? ' league-tab--active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            aria-label={tab.label}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── BENTO GRID: Stats highlights ─── */
function BentoGrid({ battingLeaders, pitchingLeaders }) {
  const topBatter = battingLeaders?.[0];
  const topPitcher = pitchingLeaders?.[0];
  const secondBatter = battingLeaders?.[1];
  const topHR = battingLeaders?.sort((a, b) => (b.total_hr || 0) - (a.total_hr || 0))?.[0];
  const topSB = battingLeaders?.sort((a, b) => (b.total_sb || 0) - (a.total_sb || 0))?.[0];

  return (
    <div className="bento-grid">
      {/* Wide card: Top batter */}
      <div className="bento-card bento-wide">
        <div className="bento-card__label">🏆 Líder de Bateo</div>
        {topBatter ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">{topBatter.avg?.toFixed(3) || '.000'}</div>
            <div className="bento-card__name">
              {topBatter.player__first_name} {topBatter.player__last_name}
            </div>
            <div className="bento-card__team">{topBatter.team__name}</div>
            <div className="bento-card__secondary">
              {topBatter.total_h || 0} H · {topBatter.total_hr || 0} HR · {topBatter.total_rbi || 0} RBI
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">Sin datos</div>
        )}
      </div>

      {/* Wide card: Top pitcher */}
      <div className="bento-card bento-wide">
        <div className="bento-card__label">🔥 Líder ERA</div>
        {topPitcher ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">{topPitcher.era?.toFixed(2) || '0.00'}</div>
            <div className="bento-card__name">
              {topPitcher.player__first_name} {topPitcher.player__last_name}
            </div>
            <div className="bento-card__team">{topPitcher.team__name}</div>
            <div className="bento-card__secondary">
              {topPitcher.total_so || 0} K · WHIP {topPitcher.whip?.toFixed(2) || '0.00'}
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">Sin datos</div>
        )}
      </div>

      {/* Small card: HR leader */}
      <div className="bento-card bento-small">
        <div className="bento-card__label">💣 Jonrones</div>
        {topHR && topHR.total_hr > 0 ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">{topHR.total_hr}</div>
            <div className="bento-card__name">
              {topHR.player__first_name} {topHR.player__last_name}
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">—</div>
        )}
      </div>

      {/* Small card: SB leader */}
      <div className="bento-card bento-small">
        <div className="bento-card__label">⚡ Robos</div>
        {topSB && topSB.total_sb > 0 ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">{topSB.total_sb}</div>
            <div className="bento-card__name">
              {topSB.player__first_name} {topSB.player__last_name}
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">—</div>
        )}
      </div>

      {/* Small card: Strikeouts pitcher */}
      <div className="bento-card bento-small">
        <div className="bento-card__label">🎯 Ponches</div>
        {pitchingLeaders?.[0] ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">
              {pitchingLeaders.sort((a, b) => (b.total_so || 0) - (a.total_so || 0))?.[0]?.total_so || 0}
            </div>
            <div className="bento-card__name">
              {pitchingLeaders.sort((a, b) => (b.total_so || 0) - (a.total_so || 0))?.[0]?.player__first_name}{' '}
              {pitchingLeaders.sort((a, b) => (b.total_so || 0) - (a.total_so || 0))?.[0]?.player__last_name}
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">—</div>
        )}
      </div>

      {/* Small card: Second batter */}
      <div className="bento-card bento-small">
        <div className="bento-card__label">🏅 2do Bateador</div>
        {secondBatter ? (
          <div className="bento-card__content">
            <div className="bento-card__big-stat">{secondBatter.avg?.toFixed(3) || '.000'}</div>
            <div className="bento-card__name">
              {secondBatter.player__first_name} {secondBatter.player__last_name}
            </div>
          </div>
        ) : (
          <div className="bento-card__empty">—</div>
        )}
      </div>
    </div>
  );
}

/* ─── SORTABLE TABLE ─── */
function SortableTable({ data, columns, defaultSort, defaultDir = 'desc' }) {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState(defaultDir);

  const sorted = useMemo(() => {
    if (!data || !data.length) return [];
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <p>Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="sortable-th"
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <span>{col.label}</span>
                {sortKey === col.key && (
                  sortDir === 'desc'
                    ? <ChevronDown size={12} style={{ marginLeft: 4 }} />
                    : <ChevronUp size={12} style={{ marginLeft: 4 }} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.player_id || i}>
              <td className="rank">{i + 1}</td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.highlight ? 'stat-col' : col.isName ? 'name-col' : ''}
                >
                  {col.format ? col.format(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── TEAMS TAB ─── */
function TeamsTab({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">👥</div>
        <p>Sin equipos registrados</p>
      </div>
    );
  }

  return (
    <div className="grid-3">
      {teams.map((team) => (
        <Link key={team.id} href={`/equipos/${team.id}`} style={{ textDecoration: 'none' }}>
          <div className="team-card">
            <div className="team-logo-placeholder">{team.short_name}</div>
            <div className="team-name-main">{team.name}</div>
            <div className="team-record">
              <span className="wins">G {team.won || 0}</span>
              <span className="losses">P {team.lost || 0}</span>
              <span>E {team.tied || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─── CALENDAR TAB ─── */
function CalendarTab({ games }) {
  if (!games || games.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📅</div>
        <p>Sin juegos programados</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      {games.map((g) => {
        const d = new Date(g.game_date);
        const dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <div className="calendar-game-row" key={g.id}>
            <span className="cal-date">{dateStr}</span>
            <span className="cal-matchup">
              {g.away_team_name || 'VIS'} @ {g.home_team_name || 'LOC'}
            </span>
            <span className="cal-score">
              {g.status === 'finished'
                ? `${g.away_score} – ${g.home_score}`
                : g.status === 'live' ? '● VIVO' : '–'
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function LeagueDashboard({
  league, teams, games, battingLeaders, pitchingLeaders,
}) {
  const [activeTab, setActiveTab] = useState('stats');

  const battingCols = [
    { key: 'player_name', label: 'Jugador', isName: true, format: (_, row) => `${row.player__first_name} ${row.player__last_name}` },
    { key: 'team__name', label: 'Equipo' },
    { key: 'avg', label: 'AVG', highlight: true, format: (v) => (v ?? 0).toFixed(3) },
    { key: 'total_h', label: 'H' },
    { key: 'total_hr', label: 'HR' },
    { key: 'total_rbi', label: 'RBI' },
    { key: 'total_bb', label: 'BB' },
    { key: 'total_sb', label: 'SB' },
  ];

  const pitchingCols = [
    { key: 'player_name', label: 'Jugador', isName: true, format: (_, row) => `${row.player__first_name} ${row.player__last_name}` },
    { key: 'team__name', label: 'Equipo' },
    { key: 'era', label: 'ERA', highlight: true, format: (v) => (v ?? 0).toFixed(2) },
    { key: 'whip', label: 'WHIP', format: (v) => (v ?? 0).toFixed(2) },
    { key: 'total_so', label: 'K' },
    { key: 'total_bb', label: 'BB' },
    { key: 'wins', label: 'W' },
  ];

  return (
    <>
      {/* Hero header */}
      <div className="league-hero">
        <div className="container">
          <Link href="/" className="league-back-link">
            <ArrowLeft size={16} /> Inicio
          </Link>
          <h1 className="league-hero__title animate-in slide-up delay-100">
            {league.name}
          </h1>
          <p className="league-hero__meta animate-in slide-up delay-200">
            {league.city && <span>📍 {league.city}</span>}
            {league.country && <span>🌎 {league.country}</span>}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="league-tabs-wrap">
        <div className="container">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content */}
      <div className="page-content">
        <div className="container">
          {activeTab === 'stats' && (
            <div className="animate-in fade-in">
              <h2 className="section-title">Resumen Estadístico</h2>
              <BentoGrid
                battingLeaders={battingLeaders}
                pitchingLeaders={pitchingLeaders}
              />

              <div style={{ marginTop: '2.5rem' }}>
                <h2 className="section-title">Líderes de Bateo</h2>
                <SortableTable
                  data={battingLeaders}
                  columns={battingCols}
                  defaultSort="avg"
                />
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <h2 className="section-title">Líderes de Pitcheo</h2>
                <SortableTable
                  data={pitchingLeaders}
                  columns={pitchingCols}
                  defaultSort="era"
                  defaultDir="asc"
                />
              </div>
            </div>
          )}

          {activeTab === 'equipos' && (
            <div className="animate-in fade-in">
              <h2 className="section-title">Equipos</h2>
              <TeamsTab teams={teams} />
            </div>
          )}

          {activeTab === 'calendario' && (
            <div className="animate-in fade-in">
              <h2 className="section-title">Calendario de Juegos</h2>
              <CalendarTab games={games} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
