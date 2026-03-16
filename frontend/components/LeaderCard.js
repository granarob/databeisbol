'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';

export default function LeaderCard({ title, players = [], statKey, format, reverse = false }) {
  // Encontrar el valor máximo para la barra de progreso proporcional
  const maxValue = players.length > 0 ? (players[0][statKey] || 0) : 1;

  const formatValue = (val) => {
    if (format === '.3f') return val.toFixed(3).replace(/^0/, '');
    if (format === '.2f') return val.toFixed(2);
    return val;
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:shadow-accent/5 transition-shadow">
      <div className="bg-accent/10 border-b border-white/5 px-5 py-4">
        <h3 className="text-lg font-bebas tracking-wider text-accent uppercase flex items-center justify-between">
          {title}
          <Trophy className="w-4 h-4 opacity-50" />
        </h3>
      </div>
      
      <div className="divide-y divide-white/5">
        {players.length > 0 ? (
          players.map((p, idx) => {
            const val = p[statKey] || 0;
            const percentage = players.length > 0 ? (val / (maxValue || 1)) * 100 : 0;
            
            return (
              <Link 
                key={p.player_id} 
                href={`/jugadores/${p.player_id}`}
                className="block p-4 hover:bg-white/5 transition-colors group relative"
              >
                {/* Progress Bar Background */}
                <div 
                  className="absolute bottom-0 left-0 h-0.5 bg-accent/20 transition-all group-hover:bg-accent/40" 
                  style={{ width: `${percentage}%` }}
                />

                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bebas text-lg ${idx === 0 ? 'bg-accent text-black' : 'bg-black/40 text-text-muted border border-white/5'}`}>
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">
                      {p.player__first_name} {p.player__last_name}
                    </p>
                    <div className="flex items-center text-[10px] text-text-muted uppercase tracking-tighter gap-1">
                      <Shield className="w-2.5 h-2.5 opacity-50" />
                      {p.team__name}
                    </div>
                  </div>
                  
                  <div className="text-xl font-bebas tracking-tighter text-white">
                    {formatValue(val)}
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="p-8 text-center text-text-muted text-sm italic opacity-50">
            No hay datos disponibles
          </div>
        )}
      </div>
    </div>
  );
}

function Trophy({ className }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
