import { redirect } from "next/navigation";
import {
  getActiveSeason,
  getAllPlayers,
  getCurrentProfile,
  getMatchesWithPlayers,
  getPlayerAvailability,
  getPlayerScheduledMatches,
  getStandings,
} from "@/lib/data/queries";
import { LigaView } from "@/components/liga-view";

export async function HomePageServer() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const season = await getActiveSeason();
  if (!season) {
    return (
      <p className="text-center text-[var(--muted)]">Sin temporada activa.</p>
    );
  }

  const [players, standings, availability, scheduled, matches] =
    await Promise.all([
      getAllPlayers(),
      getStandings(season.id),
      getPlayerAvailability(profile.id),
      getPlayerScheduledMatches(profile.id),
      getMatchesWithPlayers(season.id),
    ]);

  return (
    <LigaView
      profile={profile}
      season={season}
      standings={standings}
      availability={availability}
      scheduled={scheduled}
      players={players}
      matches={matches}
    />
  );
}
