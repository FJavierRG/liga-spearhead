import type { MatchResult } from "@/types/database";

export function getWinnerLabel(
  resultado: MatchResult,
  jugadorA: { nombre: string },
  jugadorB: { nombre: string }
): string {
  if (resultado === "empate") return "Empate";
  if (resultado === "victoria_jugador_a") return jugadorA.nombre;
  return jugadorB.nombre;
}

export function isPlayerInMatch(
  playerId: string,
  jugadorA: string,
  jugadorB: string
): boolean {
  return playerId === jugadorA || playerId === jugadorB;
}
