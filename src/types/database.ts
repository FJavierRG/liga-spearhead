export type UserRole = "jugador" | "administrador";

export type MatchResult =
  | "victoria_jugador_a"
  | "victoria_jugador_b"
  | "empate";

export type TimeSlot = "manana" | "tarde" | "noche";

export type ScheduledMatchStatus = "programado" | "cancelado" | "jugado";

export interface User {
  id: string;
  auth_user_id: string;
  nombre: string;
  avatar_url: string | null;
  faccion: string | null;
  rol: UserRole;
  /** true hasta que el jugador abra "Reglas del formato" por primera vez */
  reglas_pendientes: boolean;
  created_at: string;
}

export interface Season {
  id: string;
  nombre: string;
  activa: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  season_id: string;
  jugador_a: string;
  jugador_b: string;
  resultado: MatchResult;
  fecha: string;
  created_by: string;
  scheduled_match_id?: string | null;
  created_at: string;
}

export interface Availability {
  id: string;
  jugador_id: string;
  fecha: string;
  franja: TimeSlot;
  disponible: boolean;
}

export interface ScheduledMatch {
  id: string;
  season_id: string;
  jugador_a: string;
  jugador_b: string;
  fecha: string;
  franja: TimeSlot;
  week_start: string;
  status: ScheduledMatchStatus;
  created_at: string;
}

export interface StandingRow {
  jugador_id: string;
  nombre: string;
  avatar_url: string | null;
  faccion: string | null;
  partidas: number;
  victorias: number;
  empates: number;
  derrotas: number;
  puntos: number;
  posicion?: number;
  /** Posición previa a la última actualización de la clasificación. */
  posicion_anterior?: number;
}

export interface HandicapResult {
  /** PL extra si el underdog gana (+1 por cada 4 PLs de diferencia). */
  bonus_pl: number;
  beneficiario: string;
}

export type AvisoType =
  | "partido_cancelado"
  | "partido_finalizado"
  | "resultado_editado";

export interface PlayerAviso {
  id: string;
  jugador_id: string;
  tipo: AvisoType;
  mensaje: string;
  actor_id: string | null;
  scheduled_match_id: string | null;
  match_id: string | null;
  created_at: string;
}

export interface RecommendedMatch {
  opponent: User;
  score: number;
  overlappingSlots: { fecha: string; franja: TimeSlot }[];
  handicap: HandicapResult;
}

export const ACTIVE_TIME_SLOTS: { key: "manana" | "tarde"; label: string }[] = [
  { key: "manana", label: "Mañana" },
  { key: "tarde", label: "Tarde" },
];

export const DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const MATCH_RESULT_LABELS: Record<MatchResult, string> = {
  victoria_jugador_a: "Victoria jugador A",
  victoria_jugador_b: "Victoria jugador B",
  empate: "Empate",
};
