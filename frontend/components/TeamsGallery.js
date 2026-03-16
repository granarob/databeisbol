'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, ChevronRight } from 'lucide-react';

export default function TeamsGallery({ initialTeams = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Extraer categorías únicas de los equipos cargados
  const categories = ['all', ...new Set(initialTeams.map(t => t.category_name).filter(Boolean))];

  const filteredTeams = initialTeams.filter(team => {
    const matchesSearch = 
        (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (team.short_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || team.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-white/5 shadow-lg relative z-20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar equipo por nombre o siglas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-lg font-bebas tracking-wide whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-accent text-black scale-105 shadow-[0_0_15px_rgba(56,189,248,0.4)]' 
                  : 'bg-black/50 text-text-muted hover:text-white border border-white/5 hover:border-white/20'
              }`}
            >
              {cat === 'all' ? 'TODAS LAS CATEGORÍAS' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas Animado */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        <AnimatePresence>
          {filteredTeams.map(team => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/equipos/${team.id}`} className="block group h-full cursor-pointer">
                <div className="card h-full flex flex-col p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(56,189,248,0.15)] hover:border-accent/40 relative overflow-hidden bg-surface/80">
                  
                  {/* Destello de fondo al hacer hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  {/* Cabecera Tarjeta */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-8 h-8 text-accent/50" />
                      )}
                    </div>
                    {team.category_name && (
                      <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-accent/90 backdrop-blur-sm group-hover:bg-accent/10 transition-colors">
                        {team.category_name}
                      </div>
                    )}
                  </div>
                  
                  {/* Cuerpo Tarjeta */}
                  <div className="relative z-10 flex-grow">
                    <h3 className="text-2xl font-bebas tracking-wide mb-1 group-hover:text-accent transition-colors line-clamp-2">
                       {team.name}
                    </h3>
                    <p className="text-sm font-semibold tracking-widest text-text-muted mb-4">{team.short_name}</p>
                  </div>

                  {/* Footer Tarjeta */}
                  <div className="relative z-10 mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted/60">Manager</span>
                      <span className="font-medium text-white/90 truncate max-w-[140px] block py-1">
                        {team.manager_name || 'Sin Asignar'}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-colors flex-shrink-0">
                      <ChevronRight className="w-5 h-5 ml-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Estado Vacío */}
        {filteredTeams.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="col-span-full py-20 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface border border-white/5 mb-6 shadow-xl">
              <Search className="w-10 h-10 text-text-muted/50" />
            </div>
            <h3 className="text-2xl font-bebas tracking-wide mb-3">No se encontraron equipos</h3>
            <p className="text-text-muted max-w-sm mx-auto">Intenta ajustar tu término de búsqueda o selecciona otra categoría.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
