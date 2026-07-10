import type { StandingRow } from "@/types/database";

export function addPositions(standings: StandingRow[]): StandingRow[] {
  return standings.map((row, index) => ({
    ...row,
    posicion: index + 1,
  }));
}

export function getPlayerStanding(
  standings: StandingRow[],
  playerId: string
): StandingRow | undefined {
  return addPositions(standings).find((s) => s.jugador_id === playerId);
}

export function computeUnderdogWinBonus(
  pointsA: number,
  pointsB: number,
  playerAId: string,
  playerBId: string
) {
  const diff = Math.abs(pointsA - pointsB);
  const bonus_pl = Math.floor(diff / 4);
  const beneficiario = pointsA <= pointsB ? playerAId : playerBId;
  return { bonus_pl, beneficiario };
}
