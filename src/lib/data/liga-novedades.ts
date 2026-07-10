import { isMockMode } from "@/lib/config";
import { getStandings } from "@/lib/data/queries";
import { buildPartidoFinalizadoMensaje } from "@/lib/league/liga-novedad-message";
import {
  addMockLigaNovedad,
  getMockLigaNovedades,
} from "@/lib/mock/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { LigaNovedad, Match, User } from "@/types/database";

export async function publishPartidoFinalizadoNovedad(
  match: Match,
  jugadorA: Pick<User, "nombre">,
  jugadorB: Pick<User, "nombre">
): Promise<void> {
  const standings = await getStandings(match.season_id);
  const mensaje = buildPartidoFinalizadoMensaje(
    match,
    jugadorA,
    jugadorB,
    standings
  );

  if (isMockMode()) {
    addMockLigaNovedad({
      season_id: match.season_id,
      match_id: match.id,
      mensaje,
    });
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("liga_novedades").insert({
    season_id: match.season_id,
    match_id: match.id,
    mensaje,
  });
}

export async function getLigaNovedades(
  seasonId: string,
  limit = 20
): Promise<LigaNovedad[]> {
  if (isMockMode()) {
    return getMockLigaNovedades(seasonId, limit);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("liga_novedades")
    .select("*")
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as LigaNovedad[];
}
