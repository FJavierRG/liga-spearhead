import { addPositions } from "@/lib/league/standings";
import type { Match, StandingRow, User } from "@/types/database";

export function buildPartidoFinalizadoMensaje(
  match: Pick<Match, "resultado" | "jugador_a" | "jugador_b">,
  jugadorA: Pick<User, "nombre">,
  jugadorB: Pick<User, "nombre">,
  standings: StandingRow[]
): string {
  const positioned = addPositions(standings);

  if (match.resultado === "empate") {
    const posA = positioned.find((row) => row.jugador_id === match.jugador_a)
      ?.posicion;
    const posB = positioned.find((row) => row.jugador_id === match.jugador_b)
      ?.posicion;

    if (posA != null && posB != null) {
      return `${jugadorA.nombre} y ${jugadorB.nombre} han empatado. Se colocan #${posA} y #${posB} en la clasificación.`;
    }

    return `${jugadorA.nombre} y ${jugadorB.nombre} han empatado.`;
  }

  const winnerId =
    match.resultado === "victoria_jugador_a" ? match.jugador_a : match.jugador_b;
  const winner =
    winnerId === match.jugador_a ? jugadorA.nombre : jugadorB.nombre;
  const loser =
    winnerId === match.jugador_a ? jugadorB.nombre : jugadorA.nombre;
  const posicion =
    positioned.find((row) => row.jugador_id === winnerId)?.posicion ?? "?";

  return `${winner} ha derrotado a ${loser}, se coloca #${posicion} en la clasificación.`;
}
