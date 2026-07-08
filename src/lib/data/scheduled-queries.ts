import { isMockMode } from "@/lib/config";
import { generateWeeklySchedule } from "@/lib/league/weekly-schedule";
import {
  ensureMockWeeklySchedule,
  getMockScheduledWithPlayers,
  type ScheduledMatchWithPlayers,
} from "@/lib/mock/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Availability, Match, ScheduledMatch, User } from "@/types/database";

export async function ensureWeeklySchedule(
  weekStart: string
): Promise<void> {
  if (isMockMode()) {
    ensureMockWeeklySchedule(weekStart);
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  const { data: existing } = await admin
    .from("scheduled_matches")
    .select("id")
    .eq("week_start", weekStart)
    .eq("status", "programado")
    .limit(1);

  if (existing && existing.length > 0) return;

  const supabase = await createClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("activa", true)
    .maybeSingle();

  if (!season) return;

  const [{ data: users }, { data: availability }, { data: matches }, { data: scheduled }] =
    await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("availability").select("*").eq("disponible", true),
      supabase.from("matches").select("*").eq("season_id", season.id),
      supabase
        .from("scheduled_matches")
        .select("*")
        .eq("season_id", season.id),
    ]);

  if (!users?.length) return;

  const generated = generateWeeklySchedule(
    season.id,
    weekStart,
    users as User[],
    (availability ?? []) as Availability[],
    (matches ?? []) as Match[],
    (scheduled ?? []) as ScheduledMatch[]
  );

  const existingIds = new Set((scheduled ?? []).map((s) => s.id));
  const toInsert = generated.filter((g) => !existingIds.has(g.id));

  if (toInsert.length === 0) return;

  await admin.from("scheduled_matches").insert(
    toInsert.map((s) => ({
      season_id: s.season_id,
      jugador_a: s.jugador_a,
      jugador_b: s.jugador_b,
      fecha: s.fecha,
      franja: s.franja,
      week_start: s.week_start,
      status: s.status,
    }))
  );
}

export async function getScheduledMatchesForPlayer(
  playerId: string,
  weekStart: string
): Promise<ScheduledMatchWithPlayers[]> {
  if (isMockMode()) {
    return getMockScheduledWithPlayers(weekStart).filter(
      (s) => s.jugador_a === playerId || s.jugador_b === playerId
    );
  }

  await ensureWeeklySchedule(weekStart);

  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_matches")
    .select(
      `
      *,
      jugador_a_data:users!scheduled_matches_jugador_a_fkey(*),
      jugador_b_data:users!scheduled_matches_jugador_b_fkey(*)
    `
    )
    .eq("week_start", weekStart)
    .eq("status", "programado")
    .or(`jugador_a.eq.${playerId},jugador_b.eq.${playerId}`);

  return (data ?? []) as ScheduledMatchWithPlayers[];
}
