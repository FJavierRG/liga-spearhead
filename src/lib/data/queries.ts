import { isMockMode, NOVEDADES_FEED_LIMIT } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getScheduledMatchesForPlayer } from "@/lib/data/scheduled-queries";
import { getWeekDates, getScheduleTargetWeekStart } from "@/lib/league/week";
import { getMockSessionUserId } from "@/lib/mock/auth";
import {
  getMockStore,
  getMockUserById,
  getMockAllAvailability,
  getMockPlayerAvisos,
  type ScheduledMatchWithPlayers,
} from "@/lib/mock/store";
import type {
  Availability,
  PlayerAviso,
  Match,
  Season,
  StandingRow,
  User,
} from "@/types/database";
import { computeStandings } from "@/lib/mock/seed";

export async function getSessionUser() {
  if (isMockMode()) {
    const userId = await getMockSessionUserId();
    if (!userId) return null;
    const profile = getMockUserById(userId);
    if (!profile) return null;
    return { id: profile.auth_user_id };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<User | null> {
  if (isMockMode()) {
    const userId = await getMockSessionUserId();
    if (!userId) return null;
    return getMockUserById(userId) ?? null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return data;
}

export async function getActiveSeason(): Promise<Season | null> {
  if (isMockMode()) {
    return getMockStore().seasons.find((s) => s.activa) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("activa", true)
    .maybeSingle();

  return data;
}

export async function getAllPlayers(): Promise<User[]> {
  if (isMockMode()) {
    return [...getMockStore().users].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("nombre");

  return data ?? [];
}

export async function getPlayerById(id: string): Promise<User | null> {
  if (isMockMode()) {
    return getMockUserById(id) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*").eq("id", id).single();
  return data;
}

export async function getStandings(seasonId: string): Promise<StandingRow[]> {
  if (isMockMode()) {
    const store = getMockStore();
    return computeStandings(store.users, store.matches, seasonId);
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_standings", {
    p_season_id: seasonId,
  });

  return (data ?? []).map((row: StandingRow) => ({
    ...row,
    partidas: Number(row.partidas),
    victorias: Number(row.victorias),
    empates: Number(row.empates),
    derrotas: Number(row.derrotas),
    puntos: Number(row.puntos),
  }));
}

export async function getSeasonMatches(seasonId: string): Promise<Match[]> {
  if (isMockMode()) {
    return getMockStore()
      .matches.filter((m) => m.season_id === seasonId)
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("season_id", seasonId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getPlayerMatches(
  playerId: string,
  seasonId: string
): Promise<Match[]> {
  if (isMockMode()) {
    return getMockStore()
      .matches.filter(
        (m) =>
          m.season_id === seasonId &&
          (m.jugador_a === playerId || m.jugador_b === playerId)
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("season_id", seasonId)
    .or(`jugador_a.eq.${playerId},jugador_b.eq.${playerId}`)
    .order("fecha", { ascending: false });

  return data ?? [];
}

export async function getAllAvailability(): Promise<Availability[]> {
  if (isMockMode()) {
    return getMockAllAvailability();
  }

  const supabase = await createClient();
  const weekDates = getWeekDates();
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const { data } = await supabase
    .from("availability")
    .select("*")
    .gte("fecha", weekStart)
    .lte("fecha", weekEnd);

  return data ?? [];
}

export async function getPlayerAvailability(
  playerId: string
): Promise<Availability[]> {
  if (isMockMode()) {
    return getMockStore().availability.filter(
      (a) => a.jugador_id === playerId && a.disponible
    );
  }

  const supabase = await createClient();
  // Cargamos ±4 semanas para que la navegación del panel funcione sin recargas.
  const rangeStart = getWeekDates(new Date(), -4)[0];
  const rangeEnd = getWeekDates(new Date(), 4)[6];

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("jugador_id", playerId)
    .gte("fecha", rangeStart)
    .lte("fecha", rangeEnd);

  return data ?? [];
}

export type MatchWithPlayers = Match & {
  jugador_a_data: User;
  jugador_b_data: User;
};

export async function getMatchesWithPlayers(
  seasonId: string
): Promise<MatchWithPlayers[]> {
  if (isMockMode()) {
    const store = getMockStore();
    return store.matches
      .filter((m) => m.season_id === seasonId)
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((match) => ({
        ...match,
        jugador_a_data: store.users.find((u) => u.id === match.jugador_a)!,
        jugador_b_data: store.users.find((u) => u.id === match.jugador_b)!,
      }))
      .filter((m) => m.jugador_a_data && m.jugador_b_data);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      `
      *,
      jugador_a_data:users!matches_jugador_a_fkey(*),
      jugador_b_data:users!matches_jugador_b_fkey(*)
    `
    )
    .eq("season_id", seasonId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as MatchWithPlayers[];
}

export { type ScheduledMatchWithPlayers };

export async function getPlayerAvisos(
  playerId: string,
  limit = NOVEDADES_FEED_LIMIT
): Promise<PlayerAviso[]> {
  if (isMockMode()) {
    return getMockPlayerAvisos(playerId, limit);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("player_avisos")
    .select("*")
    .eq("jugador_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PlayerAviso[];
}

export async function getPlayerScheduledMatches(
  playerId: string,
  weekStart?: string
): Promise<ScheduledMatchWithPlayers[]> {
  // getScheduleTargetWeekStart apunta a la semana siguiente tras el cron del viernes,
  // para que los jugadores vean los emparejamientos con antelación al lunes.
  const start = weekStart ?? getScheduleTargetWeekStart();
  return getScheduledMatchesForPlayer(playerId, start);
}
