import { getTeams } from '@/lib/api';
import TeamsGallery from '@/components/TeamsGallery';
import { Trophy } from 'lucide-react';

export const metadata = {
  title: 'Equipos | BeisbolData',
  description: 'Conoce a todos los equipos que participan en la liga.',
};

export default async function EquiposPage() {
  const teamsData = await getTeams();
  const teams = teamsData?.results || [];

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-accent" />
            NUESTROS EQUIPOS
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto">
            Explora las plantillas y estadísticas de los clubes que compiten en la temporada actual.
          </p>
        </div>
        
        <TeamsGallery initialTeams={teams} />
      </div>
    </main>
  );
}
