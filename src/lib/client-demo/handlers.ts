import { getWeekDates, getWeekStartIso } from "@/lib/league/week";
import { computeStandings } from "@/lib/mock/seed";
import {
  cancelMockScheduledMatch,
  completeMockScheduledMatch,
  getMockRecentNotifications,
  getMockScheduledWithPlayers,
  getMockStore,
  getMockUserById,
  insertMockMatch,
  saveMockAvailabilityBatch,
  updateMockMatch,
  updateMockUser,
} from "@/lib/mock/store";
import {
  clearClientSessionUserId,
  getClientSessionUserId,
  setClientSessionUserId,
} from "@/lib/client-demo/session";
import { addPositions, getPlayerStanding } from "@/lib/league/standings";
import type { MatchResult, TimeSlot } from "@/types/database";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requireUser(): string | Response {
  const userId = getClientSessionUserId();
  if (!userId) return json({ error: "No autenticado" }, 401);
  return userId;
}

function matchRoute(path: string, pattern: RegExp): RegExpMatchArray | null {
  return path.match(pattern);
}

export async function handleStaticDemoApi(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body
    ? (JSON.parse(init.body as string) as Record<string, unknown>)
    : null;

  if (path === "/api/mock/auth" && method === "POST") {
    const userId = body?.userId as string;
    if (!userId) return json({ error: "Falta userId" }, 400);
    setClientSessionUserId(userId);
    return json({ ok: true });
  }

  if (path === "/api/mock/auth" && method === "DELETE") {
    clearClientSessionUserId();
    return json({ ok: true });
  }

  if (path === "/api/mock/availability" && method === "PUT") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const { jugador_id, week_start, slots } = body as {
      jugador_id: string;
      week_start: string;
      slots: { fecha: string; franja: TimeSlot; disponible: boolean }[];
    };

    if (jugador_id !== userId) return json({ error: "No autorizado" }, 403);

    const weekDates = getWeekDates(new Date(week_start + "T00:00:00"), 0);
    saveMockAvailabilityBatch(jugador_id, week_start, weekDates, slots);
    return json({ ok: true });
  }

  if (path === "/api/mock/profile" && method === "PATCH") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const updated = updateMockUser(userId, {
      nombre: body?.nombre as string,
      faccion: (body?.faccion as string) || null,
    });
    if (!updated) return json({ error: "Usuario no encontrado" }, 404);
    return json(updated);
  }

  if (path === "/api/matches" && method === "POST") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const { season_id, jugador_a, jugador_b, resultado, fecha } = body as {
      season_id: string;
      jugador_a: string;
      jugador_b: string;
      resultado: MatchResult;
      fecha: string;
    };

    const result = insertMockMatch({
      season_id,
      jugador_a,
      jugador_b,
      resultado,
      fecha,
      created_by: userId,
    });

    if ("error" in result) return json({ error: result.error }, 400);
    return json(result);
  }

  const matchPatch = matchRoute(path, /^\/api\/matches\/([^/]+)$/);
  if (matchPatch && method === "PATCH") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const result = updateMockMatch(
      matchPatch[1],
      userId,
      body?.resultado as MatchResult
    );
    if ("error" in result) return json({ error: result.error }, 400);
    return json(result);
  }

  const scheduledDelete = matchRoute(path, /^\/api\/scheduled\/([^/]+)$/);
  if (scheduledDelete && method === "DELETE") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const ok = cancelMockScheduledMatch(scheduledDelete[1], userId);
    if (!ok) return json({ error: "No se pudo cancelar" }, 400);
    return json({ ok: true });
  }

  const scheduledComplete = matchRoute(
    path,
    /^\/api\/scheduled\/([^/]+)\/complete$/
  );
  if (scheduledComplete && method === "POST") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    const result = completeMockScheduledMatch(
      scheduledComplete[1],
      userId,
      body?.resultado as MatchResult
    );
    if ("error" in result) return json({ error: result.error }, 400);
    return json(result);
  }

  if (path === "/api/profile/reglas-vistas" && method === "POST") {
    const userId = requireUser();
    if (userId instanceof Response) return userId;

    updateMockUser(userId, { reglas_pendientes: false });
    return json({ ok: true });
  }

  return json({ error: "Ruta no encontrada" }, 404);
}

export function getStaticDemoHomeData(userId: string) {
  const store = getMockStore();
  const profile = getMockUserById(userId);
  if (!profile) return null;

  const season = store.seasons.find((s) => s.activa);
  if (!season) return null;

  const weekStart = getWeekStartIso();
  getMockScheduledWithPlayers(weekStart);

  const scheduled = getMockScheduledWithPlayers(weekStart).filter(
    (s) => s.jugador_a === userId || s.jugador_b === userId
  );

  const matches = store.matches
    .filter((m) => m.season_id === season.id)
    .map((match) => ({
      ...match,
      jugador_a_data: store.users.find((u) => u.id === match.jugador_a)!,
      jugador_b_data: store.users.find((u) => u.id === match.jugador_b)!,
    }))
    .filter((m) => m.jugador_a_data && m.jugador_b_data);

  return {
    profile,
    season,
    standings: computeStandings(store.users, store.matches, season.id),
    availability: store.availability.filter(
      (a) => a.jugador_id === userId && a.disponible
    ),
    scheduled,
    players: [...store.users].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    matches,
    notifications: getMockRecentNotifications(15),
  };
}

export function getStaticDemoJugadorData(
  playerId: string,
  viewerId: string | null
) {
  const store = getMockStore();
  const player = getMockUserById(playerId);
  if (!player) return null;

  const season = store.seasons.find((s) => s.activa);
  if (!season) return null;

  const standings = addPositions(
    computeStandings(store.users, store.matches, season.id)
  );
  const standing = getPlayerStanding(standings, playerId) ?? undefined;

  const playerMatches = store.matches
    .filter(
      (m) =>
        m.season_id === season.id &&
        (m.jugador_a === playerId || m.jugador_b === playerId)
    )
    .map((match) => ({
      ...match,
      jugador_a_data: store.users.find((u) => u.id === match.jugador_a)!,
      jugador_b_data: store.users.find((u) => u.id === match.jugador_b)!,
    }))
    .filter((m) => m.jugador_a_data && m.jugador_b_data);

  return {
    player,
    standing,
    playerMatches,
    isOwn: viewerId === playerId,
    viewerId,
  };
}
