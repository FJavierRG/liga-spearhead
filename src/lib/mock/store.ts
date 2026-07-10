import type {
  Availability,
  LigaNovedad,
  Match,
  PlayerAviso,
  ScheduledMatch,
  User,
} from "@/types/database";
import { formatResultForPlayers, getOpponentId } from "@/lib/data/avisos";
import { buildPartidoFinalizadoMensaje } from "@/lib/league/liga-novedad-message";
import { generateWeeklySchedule } from "@/lib/league/weekly-schedule";
import { getWeekStartIso } from "@/lib/league/week";
import { captureStandingsSnapshot } from "@/lib/league/position-snapshot";
import { computeStandings, createSeedStore, type MockStore } from "./seed";

const globalForMock = globalThis as typeof globalThis & {
  __ligaMockStore?: MockStore;
};

function getStoreInternal(): MockStore {
  if (!globalForMock.__ligaMockStore) {
    globalForMock.__ligaMockStore = createSeedStore();
  }
  return globalForMock.__ligaMockStore;
}

export function getMockStore(): MockStore {
  return getStoreInternal();
}

export function resetMockStore(): void {
  globalForMock.__ligaMockStore = createSeedStore();
}

export function getMockUserById(id: string): User | undefined {
  return getStoreInternal().users.find((u) => u.id === id);
}

export function updateMockUser(
  id: string,
  data: Partial<Pick<User, "nombre" | "faccion" | "reglas_pendientes">>
): User | null | { error: string } {
  const store = getStoreInternal();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  if (
    data.nombre &&
    isMockNombreTaken(data.nombre, id)
  ) {
    return { error: "Ese nick ya está cogido." };
  }

  store.users[index] = { ...store.users[index], ...data };
  return store.users[index];
}

export function isMockNombreTaken(
  nombre: string,
  excludeId?: string
): boolean {
  const normalized = nombre.toLowerCase();
  return getStoreInternal().users.some(
    (u) => u.nombre.toLowerCase() === normalized && u.id !== excludeId
  );
}

export function insertMockMatch(
  match: Omit<Match, "id" | "created_at">
): Match | { error: string } {
  const store = getStoreInternal();

  if (match.jugador_a === match.jugador_b) {
    return { error: "Un jugador no puede jugar contra sí mismo" };
  }

  const duplicate = store.matches.some(
    (m) =>
      m.season_id === match.season_id &&
      m.fecha === match.fecha &&
      ((m.jugador_a === match.jugador_a && m.jugador_b === match.jugador_b) ||
        (m.jugador_a === match.jugador_b && m.jugador_b === match.jugador_a))
  );

  if (duplicate) {
    return { error: "Ya existe una partida entre estos jugadores en esa fecha" };
  }

  const currentStandings = computeStandings(
    store.users,
    store.matches,
    match.season_id
  );
  captureStandingsSnapshot(match.season_id, currentStandings);

  const newMatch: Match = {
    ...match,
    id: `mock-match-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  store.matches.unshift(newMatch);

  const jugadorA = store.users.find((u) => u.id === newMatch.jugador_a);
  const jugadorB = store.users.find((u) => u.id === newMatch.jugador_b);
  if (jugadorA && jugadorB) {
    const standings = computeStandings(
      store.users,
      store.matches,
      newMatch.season_id
    );
    addMockLigaNovedad({
      season_id: newMatch.season_id,
      match_id: newMatch.id,
      mensaje: buildPartidoFinalizadoMensaje(
        newMatch,
        jugadorA,
        jugadorB,
        standings
      ),
    });
  }

  return newMatch;
}

export function updateMockMatch(
  matchId: string,
  playerId: string,
  resultado: Match["resultado"]
): Match | { error: string } {
  const store = getStoreInternal();
  const match = store.matches.find((m) => m.id === matchId);
  if (!match) return { error: "Partida no encontrada" };
  if (match.jugador_a !== playerId && match.jugador_b !== playerId) {
    return { error: "No puedes editar esta partida" };
  }

  if (match.resultado === resultado) {
    return match;
  }

  const actorName =
    store.users.find((u) => u.id === playerId)?.nombre ?? playerId;
  const jugadorA = store.users.find((u) => u.id === match.jugador_a)!;
  const jugadorB = store.users.find((u) => u.id === match.jugador_b)!;
  const resultLabel = formatResultForPlayers(resultado, jugadorA, jugadorB);
  const opponentId = getOpponentId(playerId, match.jugador_a, match.jugador_b);

  addAviso(store, {
    jugador_id: opponentId,
    tipo: "resultado_editado",
    mensaje: `${actorName} ha cambiado el resultado del partido. Nuevo resultado: ${resultLabel}.`,
    actor_id: playerId,
    match_id: matchId,
  });

  const currentStandings = computeStandings(
    store.users,
    store.matches,
    match.season_id
  );
  captureStandingsSnapshot(match.season_id, currentStandings);

  match.resultado = resultado;
  return match;
}

export function completeMockScheduledMatch(
  scheduledId: string,
  playerId: string,
  resultado: Match["resultado"]
): Match | { error: string } {
  const store = getStoreInternal();
  const scheduled = store.scheduled_matches.find((s) => s.id === scheduledId);
  if (!scheduled) return { error: "Partido programado no encontrado" };
  if (scheduled.status !== "programado") {
    return { error: "Este partido ya no está programado" };
  }
  if (scheduled.jugador_a !== playerId && scheduled.jugador_b !== playerId) {
    return { error: "No participas en este partido" };
  }

  const created = insertMockMatch({
    season_id: scheduled.season_id,
    jugador_a: scheduled.jugador_a,
    jugador_b: scheduled.jugador_b,
    resultado,
    fecha: scheduled.fecha,
    created_by: playerId,
    scheduled_match_id: scheduledId,
  });

  if ("error" in created) return created;

  scheduled.status = "jugado";

  const actorName =
    store.users.find((u) => u.id === playerId)?.nombre ?? playerId;
  const jugadorA = store.users.find((u) => u.id === scheduled.jugador_a)!;
  const jugadorB = store.users.find((u) => u.id === scheduled.jugador_b)!;
  const resultLabel = formatResultForPlayers(resultado, jugadorA, jugadorB);
  const opponentId = getOpponentId(
    playerId,
    scheduled.jugador_a,
    scheduled.jugador_b
  );

  addAviso(store, {
    jugador_id: opponentId,
    tipo: "partido_finalizado",
    mensaje: `${actorName} ha finalizado el partido. Resultado: ${resultLabel}.`,
    actor_id: playerId,
    scheduled_match_id: scheduledId,
    match_id: created.id,
  });

  // Re-emparejar la semana por si quedan jugadores sin partido.
  ensureMockWeeklySchedule(scheduled.week_start);
  return created;
}

export function saveMockAvailabilityBatch(
  jugadorId: string,
  weekStart: string,
  weekDates: string[],
  slots: { fecha: string; franja: Availability["franja"]; disponible: boolean }[]
): void {
  const store = getStoreInternal();

  store.availability = store.availability.filter(
    (a) =>
      !(a.jugador_id === jugadorId && weekDates.includes(a.fecha))
  );

  for (const slot of slots) {
    if (slot.disponible) {
      store.availability.push({
        id: `mock-avail-${Date.now()}-${slot.fecha}-${slot.franja}`,
        jugador_id: jugadorId,
        fecha: slot.fecha,
        franja: slot.franja,
        disponible: true,
      });
    }
  }
}

export function getMockAvailabilityForPlayer(
  playerId: string,
  weekDates: string[]
): Availability[] {
  return getStoreInternal().availability.filter(
    (a) =>
      a.jugador_id === playerId &&
      weekDates.includes(a.fecha) &&
      a.disponible
  );
}

export function getMockAllAvailability(): Availability[] {
  return getStoreInternal().availability.filter((a) => a.disponible);
}

// ─── Avisos ──────────────────────────────────────────────────────────────────

function addAviso(
  store: ReturnType<typeof getStoreInternal>,
  aviso: Omit<
    PlayerAviso,
    "id" | "created_at" | "actor_id" | "scheduled_match_id" | "match_id"
  > &
    Partial<Pick<PlayerAviso, "actor_id" | "scheduled_match_id" | "match_id">>
): void {
  store.avisos.push({
    actor_id: null,
    scheduled_match_id: null,
    match_id: null,
    ...aviso,
    id: `aviso-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  });
}

export function getMockPlayerAvisos(
  playerId: string,
  limit = 20
): PlayerAviso[] {
  const store = getStoreInternal();
  return [...store.avisos]
    .filter((a) => a.jugador_id === playerId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

// ─── Novedades de liga ───────────────────────────────────────────────────────

export function addMockLigaNovedad(
  novedad: Omit<LigaNovedad, "id" | "created_at">
): void {
  const store = getStoreInternal();
  store.liga_novedades.unshift({
    ...novedad,
    id: `liga-novedad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  });
}

export function getMockLigaNovedades(
  seasonId: string,
  limit = 20
): LigaNovedad[] {
  const store = getStoreInternal();
  return [...store.liga_novedades]
    .filter((n) => n.season_id === seasonId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────

function activePairKey(s: {
  season_id: string;
  week_start: string;
  jugador_a: string;
  jugador_b: string;
  fecha: string;
}): string {
  const [a, b] = [s.jugador_a, s.jugador_b].sort();
  return `${s.season_id}|${s.week_start}|${a}|${b}|${s.fecha}`;
}

export function ensureMockWeeklySchedule(weekStart: string): ScheduledMatch[] {
  const store = getStoreInternal();

  const generated = generateWeeklySchedule(
    store.seasons.find((s) => s.activa)!.id,
    weekStart,
    store.users,
    store.availability.filter((a) => a.disponible),
    store.matches,
    store.scheduled_matches.filter((s) => s.week_start === weekStart)
  );

  // Deduplicar por par normalizado + fecha, solo contra los activos.
  const activePairs = new Set(
    store.scheduled_matches
      .filter((s) => s.week_start === weekStart && s.status === "programado")
      .map((s) => activePairKey(s))
  );

  const newOnes = generated.filter((g) => !activePairs.has(activePairKey(g)));

  if (newOnes.length > 0) {
    store.scheduled_matches.push(...newOnes);
  }

  return store.scheduled_matches.filter((s) => s.week_start === weekStart);
}

export function cancelMockScheduledMatch(
  matchId: string,
  playerId: string
): boolean {
  const store = getStoreInternal();
  const match = store.scheduled_matches.find((s) => s.id === matchId);
  if (!match) return false;
  if (match.jugador_a !== playerId && match.jugador_b !== playerId) return false;

  const { jugador_a, jugador_b, week_start } = match;
  const actorName =
    store.users.find((u) => u.id === playerId)?.nombre ?? playerId;
  const opponentId = getOpponentId(playerId, jugador_a, jugador_b);

  addAviso(store, {
    jugador_id: opponentId,
    tipo: "partido_cancelado",
    mensaje: `${actorName} ha cancelado vuestro partido programado.`,
    actor_id: playerId,
    scheduled_match_id: matchId,
  });

  match.status = "cancelado";

  // Intentar re-emparejar a los jugadores liberados (y cualquier otro sin partido).
  ensureMockWeeklySchedule(week_start);

  return true;
}

export type ScheduledMatchWithPlayers = ScheduledMatch & {
  jugador_a_data: User;
  jugador_b_data: User;
};

export function getMockScheduledWithPlayers(
  weekStart: string
): ScheduledMatchWithPlayers[] {
  ensureMockWeeklySchedule(weekStart);
  const store = getStoreInternal();

  return store.scheduled_matches
    .filter((s) => s.week_start === weekStart && s.status === "programado")
    .map((s) => ({
      ...s,
      jugador_a_data: store.users.find((u) => u.id === s.jugador_a)!,
      jugador_b_data: store.users.find((u) => u.id === s.jugador_b)!,
    }))
    .filter((s) => s.jugador_a_data && s.jugador_b_data);
}

export function getCurrentWeekStart(): string {
  return getWeekStartIso();
}
