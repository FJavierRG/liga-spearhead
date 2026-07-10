import { isMockMode } from "@/lib/config";
import {
  formatResultForPlayers,
  getOpponentId,
  insertPlayerAviso,
} from "@/lib/data/avisos";
import { getCurrentProfile } from "@/lib/data/queries";
import { ensureWeeklySchedule } from "@/lib/data/scheduled-queries";
import {
  cancelMockScheduledMatch,
  completeMockScheduledMatch,
  insertMockMatch,
  updateMockMatch,
} from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";
import type { Match, MatchResult } from "@/types/database";

export async function resolveActorId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.id ?? null;
}

export async function createMatchAction(input: {
  season_id: string;
  jugador_a: string;
  jugador_b: string;
  resultado: MatchResult;
  fecha: string;
}): Promise<Match | { error: string }> {
  const actorId = await resolveActorId();
  if (!actorId) return { error: "No autenticado" };

  if (input.jugador_a !== actorId && input.jugador_b !== actorId) {
    return { error: "Debes participar en la partida" };
  }

  if (isMockMode()) {
    return insertMockMatch({
      ...input,
      created_by: actorId,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      ...input,
      created_by: actorId,
    })
    .select()
    .single();

  if (error) {
    return {
      error: error.message.includes("unique")
        ? "Ya existe una partida entre estos jugadores en esa fecha"
        : error.message,
    };
  }

  return data;
}

export async function updateMatchResultAction(
  matchId: string,
  resultado: MatchResult
): Promise<Match | { error: string }> {
  const actorId = await resolveActorId();
  if (!actorId) return { error: "No autenticado" };

  if (isMockMode()) {
    return updateMockMatch(matchId, actorId, resultado);
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("id, jugador_a, jugador_b, resultado")
    .eq("id", matchId)
    .single();

  if (fetchError || !existing) {
    return { error: "Partida no encontrada" };
  }

  if (existing.jugador_a !== actorId && existing.jugador_b !== actorId) {
    return { error: "No puedes editar esta partida" };
  }

  if (existing.resultado === resultado) {
    const { data } = await supabase
      .from("matches")
      .select()
      .eq("id", matchId)
      .single();
    return data!;
  }

  const { data, error } = await supabase
    .from("matches")
    .update({ resultado })
    .eq("id", matchId)
    .select()
    .single();

  if (error) return { error: error.message };

  const opponentId = getOpponentId(
    actorId,
    existing.jugador_a,
    existing.jugador_b
  );
  const { data: usersData } = await supabase
    .from("users")
    .select("id, nombre")
    .in("id", [actorId, existing.jugador_a, existing.jugador_b]);
  const nameOf = (id: string) =>
    usersData?.find((u) => u.id === id)?.nombre ?? id;
  const jugadorA = { nombre: nameOf(existing.jugador_a) };
  const jugadorB = { nombre: nameOf(existing.jugador_b) };
  const resultLabel = formatResultForPlayers(resultado, jugadorA, jugadorB);

  await insertPlayerAviso({
    jugador_id: opponentId,
    tipo: "resultado_editado",
    mensaje: `${nameOf(actorId)} ha cambiado el resultado del partido. Nuevo resultado: ${resultLabel}.`,
    actor_id: actorId,
    match_id: matchId,
  });

  return data;
}

export async function cancelScheduledMatchAction(
  scheduledId: string
): Promise<{ ok: true } | { error: string }> {
  const actorId = await resolveActorId();
  if (!actorId) return { error: "No autenticado" };

  if (isMockMode()) {
    const ok = cancelMockScheduledMatch(scheduledId, actorId);
    return ok ? { ok: true } : { error: "No se pudo cancelar" };
  }

  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from("scheduled_matches")
    .select("id, jugador_a, jugador_b, status, week_start")
    .eq("id", scheduledId)
    .single();

  if (fetchError || !row) return { error: "Partido no encontrado" };
  if (row.status !== "programado") return { error: "Este partido ya no está programado" };
  if (row.jugador_a !== actorId && row.jugador_b !== actorId) {
    return { error: "No participas en este partido" };
  }

  const { error } = await supabase
    .from("scheduled_matches")
    .update({ status: "cancelado" })
    .eq("id", scheduledId);

  if (error) return { error: error.message };

  const opponentId = getOpponentId(actorId, row.jugador_a, row.jugador_b);
  const { data: usersData } = await supabase
    .from("users")
    .select("id, nombre")
    .in("id", [actorId, opponentId]);
  const nameOf = (id: string) =>
    usersData?.find((u) => u.id === id)?.nombre ?? id;

  await insertPlayerAviso({
    jugador_id: opponentId,
    tipo: "partido_cancelado",
    mensaje: `${nameOf(actorId)} ha cancelado vuestro partido programado.`,
    actor_id: actorId,
    scheduled_match_id: scheduledId,
  });

  await ensureWeeklySchedule(row.week_start);

  return { ok: true };
}

export async function completeScheduledMatchAction(
  scheduledId: string,
  resultado: MatchResult
): Promise<Match | { error: string }> {
  const actorId = await resolveActorId();
  if (!actorId) return { error: "No autenticado" };

  if (isMockMode()) {
    return completeMockScheduledMatch(scheduledId, actorId, resultado);
  }

  const supabase = await createClient();

  const { data: scheduled } = await supabase
    .from("scheduled_matches")
    .select("week_start, jugador_a, jugador_b")
    .eq("id", scheduledId)
    .single();

  const { data, error } = await supabase.rpc("complete_scheduled_match", {
    p_scheduled_id: scheduledId,
    p_resultado: resultado,
  });

  if (error) {
    return {
      error:
        error.message.includes("unique")
          ? "Ya existe una partida entre estos jugadores en esa fecha"
          : error.message,
    };
  }

  if (scheduled) {
    const opponentId = getOpponentId(
      actorId,
      scheduled.jugador_a,
      scheduled.jugador_b
    );
    const { data: usersData } = await supabase
      .from("users")
      .select("id, nombre")
      .in("id", [actorId, scheduled.jugador_a, scheduled.jugador_b]);
    const nameOf = (id: string) =>
      usersData?.find((u) => u.id === id)?.nombre ?? id;
    const jugadorA = { nombre: nameOf(scheduled.jugador_a) };
    const jugadorB = { nombre: nameOf(scheduled.jugador_b) };
    const resultLabel = formatResultForPlayers(resultado, jugadorA, jugadorB);
    const match = data as Match;

    await insertPlayerAviso({
      jugador_id: opponentId,
      tipo: "partido_finalizado",
      mensaje: `${nameOf(actorId)} ha finalizado el partido. Resultado: ${resultLabel}.`,
      actor_id: actorId,
      scheduled_match_id: scheduledId,
      match_id: match.id,
    });

    await ensureWeeklySchedule(scheduled.week_start);
  }

  return data as Match;
}
