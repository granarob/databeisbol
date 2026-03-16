'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Calendar, UserRound, ArrowLeft } from 'lucide-react';

export default function TeamDetailView({ team, games }) {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'games'

  const roster = team.rosters || [];
  
  return (
    <div className="space-y-8 relative">
      <Link href="/equipos" className="inline-flex items-center text-text-muted hover:text-white transition-colors text-sm mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Equipos
      </Link>

      {/* Team Header */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-black/50 border-2 border-white/10 rounded-full flex items-center justify-center p-4 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex-shrink-0">
            {team.logo_url ? (
               <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
            ) : (
               <Shield className="w-16 h-16 text-accent/40" />
            )}
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            {team.category_name && (
              <div className="inline-flex items-center justify-center space-x-2 text-xs font-bold tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full mb-3 uppercase border border-accent/20">
                <span>{team.category_name}</span>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bebas tracking-wide mb-2 text-white drop-shadow-lg truncate">{team.name}</h1>
            <p className="text-xl text-text-muted mb-6 tracking-widest">{team.short_name}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
              <div className="flex items-center text-text-muted bg-black/40 px-4 py-2 rounded-lg border border-white/5 shadow-inner">
                <UserRound className="w-4 h-4 mr-2 text-accent" />
                <span className="opacity-70 mr-2">Manager:</span>
                <span className="text-white font-medium truncate max-w-[150px]">{team.manager_name || 'No Asignado'}</span>
              </div>
              <div className="flex items-center text-text-muted bg-black/40 px-4 py-2 rounded-lg border border-white/5 shadow-inner">
                <Calendar className="w-4 h-4 mr-2 text-accent" />
                <span className="text-white font-medium truncate max-w-[200px]">{team.season_name}</span>
              </div>
            </div>
          </div>

          {/* Stats Summary Panel */}
          <div className="flex flex-row md:flex-col justify-center gap-4 mt-6 md:mt-0 lg:ml-auto">
             <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center min-w-[110px] shadow-inner shadow-green-500/5">
               <div className="text-4xl font-bebas text-white mb-1">{team.won}</div>
               <div className="text-xs uppercase font-bold tracking-widest text-green-400/80">Victorias</div>
             </div>
             <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center min-w-[110px] shadow-inner shadow-red-500/5">
               <div className="text-4xl font-bebas text-white mb-1">{team.lost}</div>
               <div className="text-xs uppercase font-bold tracking-widest text-red-400/80">Derrotas</div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs / Pestañas */}
      <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('roster')}
          className={`px-8 py-4 font-bebas tracking-wider text-xl transition-all relative ${activeTab === 'roster' ? 'text-accent' : 'text-text-muted hover:text-white'}`}
        >
          ROSTER OFICIAL
          {activeTab === 'roster' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('games')}
          className={`px-8 py-4 font-bebas tracking-wider text-xl transition-all relative ${activeTab === 'games' ? 'text-accent' : 'text-text-muted hover:text-white'}`}
        >
          CALENDARIO DE JUEGOS
          {activeTab === 'games' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          )}
        </button>
      </div>

      {/* Contenido de la Tab Activa */}
      <div className="pt-4 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* TAB ROSTER */}
          {activeTab === 'roster' && (
            <motion.div
              key="roster"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {roster.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {roster.map(player => (
                    <Link key={player.id} href={`/jugadores/${player.player}`} className="group block h-full">
                      <div className="bg-surface border border-white/5 hover:border-accent/30 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-black/40 hover:-translate-y-1 h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center font-bebas text-2xl text-text-muted border border-white/10 group-hover:text-black group-hover:bg-accent group-hover:border-accent transition-colors shadow-inner flex-shrink-0 relative z-10">
                          {player.jersey_number || '-'}
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                          <h4 className="font-medium text-white group-hover:text-accent transition-colors truncate">{player.player_name}</h4>
                          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider opacity-70">
                            {player.is_active ? '✅ Roster Activo' : '❌ Inactivo'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/50 rounded-xl border border-white/5">
                  <UserRound className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
                  <h3 className="text-2xl font-bebas tracking-wide mb-2">ROSTER VACÍO</h3>
                  <p className="text-text-muted">Aún no hay jugadores registrados oficiales para este equipo.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB JUEGOS */}
          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {games.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {games.map(game => {
                    const isFinished = game.status === 'finished';
                    const isLive = game.status === 'live';
                    const isWinner = isFinished && ((game.home_team === team.id && game.home_score > game.away_score) || (game.away_team === team.id && game.away_score > game.home_score));
                    const isLoser = isFinished && ((game.home_team === team.id && game.home_score < game.away_score) || (game.away_team === team.id && game.away_score < game.home_score));

                    return (
                      <div key={game.id} className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col hover:border-white/20 transition-all shadow-lg hover:shadow-xl relative overflow-hidden group">
                         
                         {/* Indicador lateral de W/L */}
                         {isFinished && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWinner ? 'bg-green-500' : isLoser ? 'bg-red-500' : 'bg-gray-500'} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                         )}

                         {/* Header de la tarjeta */}
                         <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/5">
                            <span className="text-xs font-semibold text-accent/80 uppercase tracking-widest bg-accent/5 px-3 py-1 rounded-md">
                              {new Date(game.game_date).toLocaleDateString('es-VE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </span>
                            <span className={`text-[10px] px-3 py-1 rounded-md font-bold uppercase tracking-widest ${
                               isFinished ? 'bg-white/10 text-white/90 border border-white/20' :
                               isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-black/50 text-text-muted border border-white/5'
                            }`}>
                              {isFinished ? 'FINALIZADO' : isLive ? 'EN VIVO' : 'PROGRAMADO'}
                            </span>
                         </div>
                         
                         {/* Equipos y Marcador */}
                         <div className="flex items-center justify-between gap-4">
                            <div className={`flex flex-col items-center flex-1 ${team.id === game.away_team ? 'opacity-100' : 'opacity-60'}`}>
                               <span className="font-bebas text-xl md:text-2xl text-center leading-tight mb-3 line-clamp-2 min-h-[3rem] flex items-center justify-center">
                                 {game.away_team === team.id ? '⚾ ' + game.away_team_name : game.away_team_name}
                               </span>
                               {isFinished ? (
                                  <span className={`font-bebas text-4xl font-bold rounded-lg px-4 py-1 min-w-[60px] text-center ${game.away_score > game.home_score ? 'text-white bg-white/10' : 'text-text-muted bg-black/40'}`}>{game.away_score}</span>
                               ) : (
                                  <span className="text-4xl font-bebas text-text-muted/20">-</span>
                               )}
                            </div>
                            
                            <div className="flex flex-col items-center justify-center px-4">
                              <span className="text-text-muted/50 font-bold mb-2 text-sm">VS</span>
                              {isFinished && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isWinner ? 'text-green-400 bg-green-400/10' : isLoser ? 'text-red-400 bg-red-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                                  {isWinner ? 'W' : isLoser ? 'L' : 'T'}
                                </span>
                              )}
                            </div>

                            <div className={`flex flex-col items-center flex-1 ${team.id === game.home_team ? 'opacity-100' : 'opacity-60'}`}>
                               <span className="font-bebas text-xl md:text-2xl text-center leading-tight mb-3 line-clamp-2 min-h-[3rem] flex items-center justify-center">
                                 {game.home_team === team.id ? '⚾ ' + game.home_team_name : game.home_team_name}
                               </span>
                               {isFinished ? (
                                  <span className={`font-bebas text-4xl font-bold rounded-lg px-4 py-1 min-w-[60px] text-center ${game.home_score > game.away_score ? 'text-white bg-white/10' : 'text-text-muted bg-black/40'}`}>{game.home_score}</span>
                               ) : (
                                  <span className="text-4xl font-bebas text-text-muted/20">-</span>
                               )}
                            </div>
                         </div>
                         
                         {/* Footer (Estadio) */}
                         {(game.stadium_name || game.category_name) && (
                           <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-text-muted/70">
                             <div className="flex items-center">
                               <MapPin className="w-3.5 h-3.5 mr-1.5" /> 
                               <span className="truncate max-w-[150px]">{game.stadium_name || 'Estadio no definido'}</span>
                             </div>
                             <div className="font-semibold">{game.category_name}</div>
                           </div>
                         )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/50 rounded-xl border border-white/5">
                  <Calendar className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
                  <h3 className="text-2xl font-bebas tracking-wide mb-2">SIN PARTIDOS</h3>
                  <p className="text-text-muted">No hay juegos agendados en el calendario de este equipo.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
