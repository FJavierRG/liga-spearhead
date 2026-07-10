import type {
  Availability,
  LigaNovedad,
  Match,
  PlayerAviso,
  ScheduledMatch,
  Season,
  StandingRow,
  TimeSlot,
  User,
} from "@/types/database";
import { buildPartidoFinalizadoMensaje } from "@/lib/league/liga-novedad-message";
import { computeStandingsFromMatches } from "@/lib/league/match-points";
import { getWeekDates, getWeekStartIso } from "@/lib/league/week";
import { generateWeeklySchedule } from "@/lib/league/weekly-schedule";

export const MOCK_USER_IDS = {
  admin: "mock-user-admin",
  ana: "mock-user-ana",
  borja: "mock-user-borja",
  diana: "mock-user-diana",
  erik: "mock-user-erik",
} as const;

export const MOCK_SEASON_ID = "mock-season-1";

const now = new Date().toISOString();

export const MOCK_USERS: User[] = [
  {
    id: MOCK_USER_IDS.admin,
    auth_user_id: "mock-auth-admin",
    nombre: "Carlos_A",
    avatar_url: null,
    faccion: "Stormcast Eternals",
    rol: "administrador",
    reglas_pendientes: true,
    created_at: now,
  },
  {
    id: MOCK_USER_IDS.ana,
    auth_user_id: "mock-auth-ana",
    nombre: "Ana",
    avatar_url: null,
    faccion: "Sylvaneth",
    rol: "jugador",
    reglas_pendientes: true,
    created_at: now,
  },
  {
    id: MOCK_USER_IDS.borja,
    auth_user_id: "mock-auth-borja",
    nombre: "Borja",
    avatar_url: null,
    faccion: "Skaven",
    rol: "jugador",
    reglas_pendientes: true,
    created_at: now,
  },
  {
    id: MOCK_USER_IDS.diana,
    auth_user_id: "mock-auth-diana",
    nombre: "Diana",
    avatar_url: null,
    faccion: "Daughters of Khaine",
    rol: "jugador",
    reglas_pendientes: true,
    created_at: now,
  },
  {
    id: MOCK_USER_IDS.erik,
    auth_user_id: "mock-auth-erik",
    nombre: "Erik",
    avatar_url: null,
    faccion: "Gloomspite Gitz",
    rol: "jugador",
    reglas_pendientes: true,
    created_at: now,
  },
];

export const MOCK_SEASON: Season = {
  id: MOCK_SEASON_ID,
  nombre: "Temporada demo",
  activa: true,
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: null,
  created_at: now,
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const MOCK_MATCHES: Match[] = [
  {
    id: "mock-match-1",
    season_id: MOCK_SEASON_ID,
    jugador_a: MOCK_USER_IDS.ana,
    jugador_b: MOCK_USER_IDS.borja,
    resultado: "victoria_jugador_a",
    fecha: daysAgo(6),
    created_by: MOCK_USER_IDS.ana,
    created_at: now,
  },
  {
    id: "mock-match-2",
    season_id: MOCK_SEASON_ID,
    jugador_a: MOCK_USER_IDS.admin,
    jugador_b: MOCK_USER_IDS.diana,
    resultado: "empate",
    fecha: daysAgo(4),
    created_by: MOCK_USER_IDS.admin,
    created_at: now,
  },
  {
    id: "mock-match-3",
    season_id: MOCK_SEASON_ID,
    jugador_a: MOCK_USER_IDS.borja,
    jugador_b: MOCK_USER_IDS.erik,
    resultado: "victoria_jugador_a",
    fecha: daysAgo(3),
    created_by: MOCK_USER_IDS.borja,
    created_at: now,
  },
  {
    id: "mock-match-4",
    season_id: MOCK_SEASON_ID,
    jugador_a: MOCK_USER_IDS.admin,
    jugador_b: MOCK_USER_IDS.borja,
    resultado: "victoria_jugador_a",
    fecha: daysAgo(2),
    created_by: MOCK_USER_IDS.admin,
    created_at: now,
  },
  {
    id: "mock-match-5",
    season_id: MOCK_SEASON_ID,
    jugador_a: MOCK_USER_IDS.ana,
    jugador_b: MOCK_USER_IDS.diana,
    resultado: "victoria_jugador_a",
    fecha: daysAgo(1),
    created_by: MOCK_USER_IDS.ana,
    created_at: now,
  },
];

function buildAvailability(): Availability[] {
  const weekDates = getWeekDates();
  const slots: { playerId: string; days: number[]; franjas: TimeSlot[] }[] = [
    {
      playerId: MOCK_USER_IDS.admin,
      days: [1, 2, 4],
      franjas: ["manana", "tarde"],
    },
    {
      playerId: MOCK_USER_IDS.ana,
      days: [0, 2, 3, 5],
      franjas: ["manana", "tarde"],
    },
    {
      playerId: MOCK_USER_IDS.borja,
      days: [1, 3, 4, 6],
      franjas: ["tarde"],
    },
    {
      playerId: MOCK_USER_IDS.diana,
      days: [2, 4, 5],
      franjas: ["manana", "tarde"],
    },
    {
      playerId: MOCK_USER_IDS.erik,
      days: [0, 1, 5, 6],
      franjas: ["tarde"],
    },
  ];

  const records: Availability[] = [];
  let id = 1;

  for (const { playerId, days, franjas } of slots) {
    for (const dayIndex of days) {
      for (const franja of franjas) {
        records.push({
          id: `mock-avail-${id++}`,
          jugador_id: playerId,
          fecha: weekDates[dayIndex],
          franja,
          disponible: true,
        });
      }
    }
  }

  return records;
}

export const MOCK_AVAILABILITY = buildAvailability();

export interface MockStore {
  users: User[];
  seasons: Season[];
  matches: Match[];
  availability: Availability[];
  scheduled_matches: ScheduledMatch[];
  avisos: PlayerAviso[];
  liga_novedades: LigaNovedad[];
}

function buildInitialSchedule(): ScheduledMatch[] {
  const weekStart = getWeekStartIso();
  return generateWeeklySchedule(
    MOCK_SEASON_ID,
    weekStart,
    MOCK_USERS,
    MOCK_AVAILABILITY,
    MOCK_MATCHES
  );
}

const SEED_AVISOS: PlayerAviso[] = [
  {
    id: "aviso-seed-1",
    jugador_id: MOCK_USER_IDS.ana,
    tipo: "partido_cancelado",
    mensaje: "Borja ha cancelado vuestro partido programado.",
    actor_id: MOCK_USER_IDS.borja,
    scheduled_match_id: null,
    match_id: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "aviso-seed-2",
    jugador_id: MOCK_USER_IDS.borja,
    tipo: "partido_finalizado",
    mensaje: "Diana ha finalizado el partido. Resultado: Diana.",
    actor_id: MOCK_USER_IDS.diana,
    scheduled_match_id: null,
    match_id: null,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

function buildSeedLigaNovedades(): LigaNovedad[] {
  const standings = computeStandings(MOCK_USERS, MOCK_MATCHES, MOCK_SEASON_ID);

  return [...MOCK_MATCHES]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 4)
    .map((match, index) => {
      const jugadorA = MOCK_USERS.find((user) => user.id === match.jugador_a)!;
      const jugadorB = MOCK_USERS.find((user) => user.id === match.jugador_b)!;

      return {
        id: `liga-novedad-seed-${index + 1}`,
        season_id: match.season_id,
        match_id: match.id,
        mensaje: buildPartidoFinalizadoMensaje(
          match,
          jugadorA,
          jugadorB,
          standings
        ),
        created_at: match.created_at,
      };
    });
}

export function createSeedStore(): MockStore {
  return {
    users: structuredClone(MOCK_USERS),
    seasons: [structuredClone(MOCK_SEASON)],
    matches: structuredClone(MOCK_MATCHES),
    availability: structuredClone(MOCK_AVAILABILITY),
    scheduled_matches: buildInitialSchedule(),
    avisos: structuredClone(SEED_AVISOS),
    liga_novedades: buildSeedLigaNovedades(),
  };
}

export function computeStandings(
  users: User[],
  matches: Match[],
  seasonId: string
): StandingRow[] {
  return computeStandingsFromMatches(users, matches, seasonId);
}
