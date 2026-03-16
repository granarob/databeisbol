import { getBattingLeaders, getPitchingLeaders, getLeagues, getCategories, getSeasons } from '@/lib/api';
import StatsView from '@/components/StatsView';
import { ChartBarIcon } from 'lucide-react';

export const metadata = {
  title: 'Estadísticas | BeisbolData',
  description: 'Líderes de bateo, pitcheo y estadísticas generales de la liga.',
};

export default async function EstadisticasPage() {
  // Fetch initial data for leaders
  const [
    battingAvg, battingHr, battingRbi,
    pitchingEra, pitchingSo, pitchingW,
    leagues, categories, seasons
  ] = await Promise.all([
    getBattingLeaders({ stat: 'avg', limit: 5 }),
    getBattingLeaders({ stat: 'hr', limit: 5 }),
    getBattingLeaders({ stat: 'rbi', limit: 5 }),
    getPitchingLeaders({ stat: 'era', limit: 5 }),
    getPitchingLeaders({ stat: 'so', limit: 5 }),
    getPitchingLeaders({ stat: 'wins', limit: 5 }),
    getLeagues(),
    getCategories(),
    getSeasons()
  ]);

  const initialLeaders = {
    batting: {
      avg: battingAvg?.results || [],
      hr: battingHr?.results || [],
      rbi: battingRbi?.results || []
    },
    pitching: {
      era: pitchingEra?.results || [],
      so: pitchingSo?.results || [],
      wins: pitchingW?.results || []
    }
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
            <ChartBarIcon className="w-10 h-10 text-accent" />
            CENTRAL DE ESTADÍSTICAS
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto">
            Sigue el rendimiento de los mejores jugadores de la temporada. Filtra por liga, categoría o equipo.
          </p>
        </div>

        <StatsView 
          initialLeaders={initialLeaders} 
          leagues={leagues?.results || []}
          categories={categories?.results || []}
          seasons={seasons?.results || []}
        />
      </div>
    </main>
  );
}
