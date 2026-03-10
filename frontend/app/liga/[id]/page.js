import { getLeague, getTeams, getGames, getBattingLeaders, getPitchingLeaders, getSeasons, getCategories } from '@/lib/api';
import LeagueDashboard from '@/components/LeagueDashboard';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  let league = null;
  try {
    league = await getLeague(id);
  } catch {}
  if (!league) return { title: 'Liga no encontrada — BeisbolData' };
  return {
    title: `${league.name} — BeisbolData`,
    description: `Estadísticas, equipos y calendario de ${league.name}.`,
  };
}

export default async function LeaguePage({ params }) {
  const { id } = await params;
  let league = null;

  try {
    league = await getLeague(id);
  } catch {}

  if (!league) {
    notFound();
  }

  // Fetch all related data in parallel
  let teams = [], games = [], battingLeaders = [], pitchingLeaders = [];

  try {
    // Get seasons for this league to scope our queries
    const seasonsData = await getSeasons(id);
    const seasons = Array.isArray(seasonsData) ? seasonsData : (seasonsData?.results ?? []);
    const activeSeason = seasons.find(s => s.is_active) || seasons[0];

    // Get categories for this league
    const categoriesData = await getCategories(id);
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? []);

    if (activeSeason) {
      const seasonId = activeSeason.id;

      const [teamsData, gamesData, battingData, pitchingData] = await Promise.all([
        getTeams({ season: seasonId }),
        getGames({ season: seasonId }),
        getBattingLeaders({ season: seasonId, limit: 20 }),
        getPitchingLeaders({ season: seasonId, limit: 20 }),
      ]);

      teams = Array.isArray(teamsData) ? teamsData : (teamsData?.results ?? []);
      games = Array.isArray(gamesData) ? gamesData : (gamesData?.results ?? []);
      battingLeaders = battingData?.results ?? [];
      pitchingLeaders = pitchingData?.results ?? [];
    }
  } catch {
    // Si el backend falla parcialmente, mostrar lo que se pueda
  }

  return (
    <LeagueDashboard
      league={league}
      teams={teams}
      games={games}
      battingLeaders={battingLeaders}
      pitchingLeaders={pitchingLeaders}
    />
  );
}
