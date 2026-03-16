'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBattingLeaders, getPitchingLeaders } from '@/lib/api';
import { ArrowUpDown, User, Shield } from 'lucide-react';

export default function StatsTable({ type, params }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: type === 'batting' ? 'avg' : 'era', direction: 'desc' });

  // Petición de datos completos para la tabla
  useEffect(() => {
    const fetchFullData = async () => {
      setLoading(true);
      try {
        const fetchFn = type === 'batting' ? getBattingLeaders : getPitchingLeaders;
        const result = await fetchFn({ ...params, limit: 100 });
        setData(result?.results || []);
      } catch (err) {
        console.error("Error fetching table data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [type, params]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortConfig.key] || 0;
    const bVal = b[sortConfig.key] || 0;
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const headers = type === 'batting' 
    ? [
        { key: 'player__first_name', label: 'Jugador', sortable: false },
        { key: 'total_ab', label: 'VB', sortable: true },
        { key: 'total_h', label: 'H', sortable: true },
        { key: 'total_hr', label: 'HR', sortable: true },
        { key: 'total_rbi', label: 'CI', sortable: true },
        { key: 'total_bb', label: 'BB', sortable: true },
        { key: 'total_so', label: 'K', sortable: true },
        { key: 'avg', label: 'AVG', sortable: true },
      ]
    : [
        { key: 'player__first_name', label: 'Jugador', sortable: false },
        { key: 'wins', label: 'G', sortable: true },
        { key: 'total_so', label: 'K', sortable: true },
        { key: 'total_bb', label: 'BB', sortable: true },
        { key: 'total_ip_outs', label: 'IP', sortable: true },
        { key: 'era', label: 'ERA', sortable: true },
        { key: 'whip', label: 'WHIP', sortable: true },
      ];

  if (loading) {
    return (
      <div className="w-full bg-surface border border-white/5 rounded-xl p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-text-muted font-bebas tracking-widest animate-pulse">Cargando Estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/10">
              {headers.map(h => (
                <th 
                  key={h.key} 
                  onClick={() => h.sortable && requestSort(h.key)}
                  className={`px-4 py-4 text-xs font-bold uppercase tracking-wider text-text-muted ${h.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {h.label}
                    {h.sortable && <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === h.key ? 'text-accent' : 'opacity-20'}`} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, idx) => (
              <tr key={row.player_id} className="hover:bg-white/5 transition-colors group">
                {headers.map((h, i) => (
                  <td key={h.key} className="px-4 py-4 text-sm font-medium">
                    {i === 0 ? (
                      <Link href={`/jugadores/${row.player_id}`} className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-black group-hover:border-accent transition-all flex-shrink-0">
                           <User className="w-4 h-4" />
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="text-white group-hover:text-accent transition-colors truncate">
                            {row.player__first_name} {row.player__last_name}
                           </span>
                           <span className="text-[10px] text-text-muted uppercase tracking-tighter flex items-center gap-1">
                             <Shield className="w-2.5 h-2.5 opacity-50" />
                             {row.team__name}
                           </span>
                         </div>
                      </Link>
                    ) : (
                      <span className={h.key === 'avg' || h.key === 'era' || h.key === 'whip' ? 'font-bebas text-lg tracking-tight' : 'font-mono text-text-muted'}>
                        {h.key === 'avg' ? row[h.key].toFixed(3).replace(/^0/, '') : 
                         h.key === 'era' || h.key === 'whip' ? row[h.key].toFixed(2) : 
                         h.key === 'total_ip_outs' ? `${Math.floor(row[h.key] / 3)}.${row[h.key] % 3}` :
                         row[h.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedData.length === 0 && (
        <div className="py-20 text-center">
           <p className="text-text-muted italic">No se encontraron registros estadísticos con los filtros actuales.</p>
        </div>
      )}
    </div>
  );
}
