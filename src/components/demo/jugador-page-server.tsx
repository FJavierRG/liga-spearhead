import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getActiveSeason,
  getCurrentProfile,
  getMatchesWithPlayers,
  getPlayerById,
  getStandings,
} from "@/lib/data/queries";
import { getPlayerStanding } from "@/lib/league/standings";
import { MatchList } from "@/components/match-list";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/section-title";

export async function JugadorPageServer({ id }: { id: string }) {
  const [player, currentProfile, season] = await Promise.all([
    getPlayerById(id),
    getCurrentProfile(),
    getActiveSeason(),
  ]);

  if (!player) notFound();
  if (!season) {
    return <p className="text-[var(--muted)]">Sin temporada activa.</p>;
  }

  const [standings, matches] = await Promise.all([
    getStandings(season.id),
    getMatchesWithPlayers(season.id),
  ]);

  const standing = getPlayerStanding(standings, player.id);
  const playerMatches = matches.filter(
    (m) => m.jugador_a === player.id || m.jugador_b === player.id
  );
  const isOwn = currentProfile?.id === player.id;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <Link href="/" className="link-fantasy text-sm">
        ← Liga
      </Link>

      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-wide">
          {player.nombre}
        </h1>
        {player.faccion && (
          <p className="text-sm text-[var(--muted)]">{player.faccion}</p>
        )}
      </header>

      {standing && (
        <section>
          <SectionTitle className="mb-3">Estadísticas</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Posición" value={`#${standing.posicion}`} />
            <Stat label="Puntos" value={String(standing.puntos)} />
            <Stat label="Victorias" value={String(standing.victorias)} />
            <Stat label="Partidas" value={String(standing.partidas)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{standing.empates} empates</Badge>
            <Badge variant="outline">{standing.derrotas} derrotas</Badge>
            {player.rol === "administrador" && (
              <Badge variant="info">Administrador</Badge>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionTitle className="mb-3">
          Historial{isOwn ? " de partidas" : ""}
        </SectionTitle>
        {playerMatches.length > 0 ? (
          <MatchList
            matches={playerMatches}
            variant="personal"
            profilePlayerId={player.id}
            editableForPlayerId={isOwn ? currentProfile?.id : undefined}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">Sin partidas todavía.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fantasy-panel p-4 text-center">
      <div className="font-display text-xl font-semibold text-[var(--accent)]">
        {value}
      </div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}
