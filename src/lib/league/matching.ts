import type { Match } from "../../types/database";

/**
 * Pesos del algoritmo de emparejamiento.
 *
 * BASE debe ser mayor que cualquier suma de desempatadores para que
 * añadir una pareja más siempre sea preferible a mejorar un desempatador.
 * Con n ≤ 15 jugadores (máximo 7 parejas), el máximo de desempatadores
 * acumulables es 7 × (100 + 10) = 770 → BASE = 1000 es suficiente.
 */
/**
 * Jerarquía de criterios (de mayor a menor prioridad):
 *
 * 1. Maximizar cobertura — base (1000) domina siempre a los desempatadores.
 * 2. Dar prioridad a quien lleva menos partidas — fewerMatches (2 por partida
 *    de diferencia). Con máx. 15 jugadores y ≤40 partidas de diferencia el
 *    bonus máximo por pareja es 2×40×2=160, inferior al siguiente nivel.
 * 3. Evitar repetir el último rival — repeatLast (−200).
 *    Debe dominar a fewerMatches: 200 > 160 ✓
 * 4. Preferir parejas que nunca se han enfrentado — neverPlayed (10).
 */
export const MATCH_WEIGHTS = {
  base: 1000,
  fewerMatches: 2,
  repeatLast: -200,
  neverPlayed: 10,
};

export function countMatches(playerId: string, matches: Match[]): number {
  return matches.filter(
    (m) => m.jugador_a === playerId || m.jugador_b === playerId
  ).length;
}

export function havePlayed(a: string, b: string, matches: Match[]): boolean {
  return matches.some(
    (m) =>
      (m.jugador_a === a && m.jugador_b === b) ||
      (m.jugador_a === b && m.jugador_b === a)
  );
}

export function getLastOpponent(playerId: string, matches: Match[]): string | null {
  const sorted = [...matches]
    .filter((m) => m.jugador_a === playerId || m.jugador_b === playerId)
    .sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  if (sorted.length === 0) return null;
  const last = sorted[0];
  return last.jugador_a === playerId ? last.jugador_b : last.jugador_a;
}
