import { getTeam, getGames } from '@/lib/api';
import TeamDetailView from '@/components/TeamDetailView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const team = await getTeam(id);
  
  if (!team) return { title: 'Equipo no encontrado' };
  
  return {
    title: `${team.name} | BeisbolData`,
    description: `Perfil oficial, roster activo y calendario de juegos de ${team.name}.`,
  };
}

export default async function TeamPage({ params }) {
  const { id } = await params;
  const team = await getTeam(id);
  
  if (!team) {
    notFound();
  }

  // Fetch games assigned to this team
  const gamesData = await getGames({ team: id });
  const games = gamesData?.results || [];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <TeamDetailView team={team} games={games} />
      </div>
    </main>
  );
}
