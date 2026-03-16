'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Filter, ChevronDown, ListFilter } from 'lucide-react';
import LeaderCard from './LeaderCard';
import StatsTable from './StatsTable';
import { getBattingLeaders, getPitchingLeaders } from '@/lib/api';

export default function StatsView({ initialLeaders, leagues, categories, seasons }) {
  const [activeTab, setActiveTab] = useState('batting'); // 'batting' | 'pitching'
  const [leaders, setLeaders] = useState(initialLeaders);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    league: '',
    category: '',
    season: seasons.length > 0 ? seasons[0].id : ''
  });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Efecto para recargar líderes cuando cambian los filtros
  useEffect(() => {
    const refreshData = async () => {
      setLoading(true);
      try {
        const params = {
          season: filters.season,
          category: filters.category,
          league: filters.league
        };

        const [bAvg, bHr, bRbi, pEra, pSo, pW] = await Promise.all([
          getBattingLeaders({ ...params, stat: 'avg', limit: 5 }),
          getBattingLeaders({ ...params, stat: 'hr', limit: 5 }),
          getBattingLeaders({ ...params, stat: 'rbi', limit: 5 }),
          getPitchingLeaders({ ...params, stat: 'era', limit: 5 }),
          getPitchingLeaders({ ...params, stat: 'so', limit: 5 }),
          getPitchingLeaders({ ...params, stat: 'wins', limit: 5 })
        ]);

        setLeaders({
          batting: {
            avg: bAvg?.results || [],
            hr: bHr?.results || [],
            rbi: bRbi?.results || []
          },
          pitching: {
            era: pEra?.results || [],
            so: pSo?.results || [],
            wins: pW?.results || []
          }
        });
      } catch (err) {
        console.error("Error refreshing stats:", err);
      } finally {
        setLoading(false);
      }
    };

    // No correr en el primer render si ya tenemos initialLeaders
    const isFirstRender = leaders === initialLeaders && 
                         filters.season === (seasons[0]?.id || '') && 
                         !filters.category && !filters.league;
    
    if (!isFirstRender) {
      refreshData();
    }
  }, [filters]);

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="bg-surface border border-white/5 p-4 rounded-xl shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          {/* Season Selector */}
          <div className="relative min-w-[150px]">
            <select 
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Todas las Temporadas</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* League Selector */}
          <div className="relative min-w-[150px]">
             <select 
              value={filters.league}
              onChange={(e) => handleFilterChange('league', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Todas las Ligas</option>
              {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Category Selector */}
          <div className="relative min-w-[150px]">
             <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-accent text-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            Actualizando...
          </div>
        )}
      </div>

      {/* Selector de Pestañas (Bateo / Pitcheo) */}
      <div className="flex justify-center">
        <div className="bg-surface/50 border border-white/5 p-1 rounded-full flex relative">
          <button
            onClick={() => setActiveTab('batting')}
            className={`px-8 py-3 rounded-full text-sm font-bebas tracking-widest transition-all relative z-10 ${activeTab === 'batting' ? 'text-black' : 'text-text-muted hover:text-white'}`}
          >
            ESTADÍSTICAS DE BATEO
          </button>
          <button
            onClick={() => setActiveTab('pitching')}
            className={`px-8 py-3 rounded-full text-sm font-bebas tracking-widest transition-all relative z-10 ${activeTab === 'pitching' ? 'text-black' : 'text-text-muted hover:text-white'}`}
          >
            ESTADÍSTICAS DE PITCHEO
          </button>
          
          <motion.div 
            layoutId="tab-bg"
            className="absolute top-1 bottom-1 bg-accent rounded-full"
            initial={false}
            animate={{ 
              left: activeTab === 'batting' ? '4px' : 'calc(50% + 2px)',
              right: activeTab === 'batting' ? 'calc(50% + 2px)' : '4px'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Contenido Dinámico */}
      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           transition={{ duration: 0.3 }}
           className="space-y-12"
        >
          {/* Líderes Principales (3 Columnas de Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeTab === 'batting' ? (
              <>
                <LeaderCard title="Promedio Bateo (AVG)" players={leaders.batting.avg} statKey="avg" format=".3f" />
                <LeaderCard title="Home Runs (HR)" players={leaders.batting.hr} statKey="total_hr" />
                <LeaderCard title="Carreras Impulsadas (RBI)" players={leaders.batting.rbi} statKey="total_rbi" />
              </>
            ) : (
              <>
                <LeaderCard title="Efectividad (ERA)" players={leaders.pitching.era} statKey="era" format=".2f" reverse />
                <LeaderCard title="Ponches (SO)" players={leaders.pitching.so} statKey="total_so" />
                <LeaderCard title="Victorias (W)" players={leaders.pitching.wins} statKey="wins" />
              </>
            )}
          </div>

          {/* Tabla Detallada */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ListFilter className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bebas tracking-wider uppercase">Tabla de Rendimiento General</h2>
            </div>
            
            <StatsTable 
                type={activeTab} 
                params={{ ...filters, limit: 100 }} 
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
