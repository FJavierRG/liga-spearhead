import { getWinnerLabel } from "@/lib/league/match-result";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AvisoType, MatchResult } from "@/types/database";

export function getOpponentId(
  actorId: string,
  jugadorA: string,
  jugadorB: string
): string {
  return jugadorA === actorId ? jugadorB : jugadorA;
}

export function formatResultForPlayers(
  resultado: MatchResult,
  jugadorA: { nombre: string },
  jugadorB: { nombre: string }
): string {
  return getWinnerLabel(resultado, jugadorA, jugadorB);
}

export async function insertPlayerAviso(input: {
  jugador_id: string;
  tipo: AvisoType;
  mensaje: string;
  actor_id: string;
  scheduled_match_id?: string | null;
  match_id?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("player_avisos").insert({
    jugador_id: input.jugador_id,
    tipo: input.tipo,
    mensaje: input.mensaje,
    actor_id: input.actor_id,
    scheduled_match_id: input.scheduled_match_id ?? null,
    match_id: input.match_id ?? null,
  });
}
