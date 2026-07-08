import type {
  Availability,
  Match,
  ScheduledMatch,
  User,
} from "@/types/database";
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
): User | null {
  const store = getStoreInternal();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  store.users[index] = { ...store.users[index], ...data };
  return store.users[index];
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

export function ensureMockWeeklySchedule(weekStart: string): ScheduledMatch[] {
  const store = getStoreInternal();
  const existing = store.scheduled_matches.filter(
    (s) => s.week_start === weekStart && s.status === "programado"
  );

  if (existing.length > 0) {
    return store.scheduled_matches.filter((s) => s.week_start === weekStart);
  }

  const generated = generateWeeklySchedule(
    store.seasons.find((s) => s.activa)!.id,
    weekStart,
    store.users,
    store.availability.filter((a) => a.disponible),
    store.matches,
    store.scheduled_matches
  );

  const existingIds = new Set(store.scheduled_matches.map((s) => s.id));
  const newOnes = generated.filter((g) => !existingIds.has(g.id));

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

  match.status = "cancelado";
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
