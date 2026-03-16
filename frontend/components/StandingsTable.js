'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StandingsTable({ leagues = [] }) {
  const [activeLeague, setActiveLeague] = useState(leagues[0]?.id || '');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar categorías al cambiar liga
  useEffect(() => {
    if (!activeLeague) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/categories/?league=${activeLeague}`)
      .then(res => res.json())
      .then(data => {
        const cats = Array.isArray(data) ? data : (data.results || []);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => setCategories([]));
  }, [activeLeague]);

  // Cargar tabla de posiciones al cambiar liga o categoría
  useEffect(() => {
    if (!activeLeague || !activeCategory) {
      setStandings([]);
      return;
    }
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/teams/standings/?league=${activeLeague}&category=${activeCategory}`)
      .then(res => res.json())
      .then(data => {
        setStandings(Array.isArray(data) ? data : (data.results || []));
        setLoading(false);
      })
      .catch(() => {
        setStandings([]);
        setLoading(false);
      });
  }, [activeLeague, activeCategory]);

  if (!leagues.length) return null;

  return (
    <section className="standings-section">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Tabla de Posiciones</h2>
          
          <div className="filter-bar" style={{ margin: 0 }}>
            <select 
              className="filter-select" 
              value={activeLeague} 
              onChange={e => setActiveLeague(e.target.value)}
            >
              {leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
            {categories.length > 0 && (
              <select 
                className="filter-select" 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando posiciones...</div>
          ) : standings.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏆</div>
              <p>No hay equipos registrados en esta categoría aún.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>POS</th>
                  <th>EQUIPO</th>
                  <th style={{ textAlign: 'center' }}>JJ</th>
                  <th style={{ textAlign: 'center' }}>JG</th>
                  <th style={{ textAlign: 'center' }}>JP</th>
                  <th style={{ textAlign: 'center' }}>JE</th>
                  <th style={{ textAlign: 'center', color: 'var(--gold)' }}>PCT</th>
                  <th style={{ textAlign: 'center' }}>DIF</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => {
                  const jj = team.won + team.lost + team.tied;
                  const pct = jj > 0 ? (team.won / jj).toFixed(3).replace('0.', '.') : '.000';
                  // Calcular diferencia vs el líder. Líder es index 0
                  const leader = standings[0];
                  let dif = '-';
                  if (index > 0) {
                    const gamesBehind = ((leader.won - team.won) + (team.lost - leader.lost)) / 2;
                    dif = gamesBehind > 0 ? gamesBehind.toString() : '-';
                  }

                  return (
                    <tr key={team.id}>
                      <td className="rank">{index + 1}</td>
                      <td>
                        <Link href={`/equipos/${team.id}`} className="name-col" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--accent)' }}>
                            {team.short_name.substring(0,2)}
                          </div>
                          {team.name}
                        </Link>
                      </td>
                      <td style={{ textAlign: 'center' }}>{jj}</td>
                      <td style={{ textAlign: 'center', color: 'var(--green)' }}>{team.won}</td>
                      <td style={{ textAlign: 'center', color: 'var(--red)' }}>{team.lost}</td>
                      <td style={{ textAlign: 'center' }}>{team.tied}</td>
                      <td className="stat-col" style={{ textAlign: 'center' }}>{pct}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{dif}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
