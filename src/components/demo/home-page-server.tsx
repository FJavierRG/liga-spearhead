import { redirect } from "next/navigation";
import {
  getActiveSeason,
  getAllPlayers,
  getCurrentProfile,
  getMatchesWithPlayers,
  getPlayerAvailability,
  getPlayerScheduledMatches,
  getPlayerAvisos,
  getStandings,
} from "@/lib/data/queries";
import { maybeRunWeeklySchedules } from "@/lib/league/schedule-runner";
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

  await maybeRunWeeklySchedules();

  const [players, standings, availability, scheduled, matches, avisos] =
    await Promise.all([
      getAllPlayers(),
      getStandings(season.id),
      getPlayerAvailability(profile.id),
      getPlayerScheduledMatches(profile.id),
      getMatchesWithPlayers(season.id),
      getPlayerAvisos(profile.id, 15),
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
      avisos={avisos}
    />
  );
}
