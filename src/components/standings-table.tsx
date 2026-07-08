"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PositionChangeIndicator } from "@/components/position-change-indicator";
import { enrichStandingsWithPositionChanges } from "@/lib/league/position-snapshot";
import type { StandingRow } from "@/types/database";
import { cn } from "@/lib/utils";

interface StandingsTableProps {
  standings: StandingRow[];
  seasonId: string;
  highlightId?: string;
  compact?: boolean;
}

export function StandingsTable({
  standings,
  seasonId,
  highlightId,
  compact,
}: StandingsTableProps) {
  const rows = useMemo(
    () => enrichStandingsWithPositionChanges(standings, seasonId),
    [standings, seasonId]
  );

  return (
    <table className="w-full whitespace-nowrap text-sm">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_80%,#000)]">
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            #
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            Jugador
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            Pts
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            V
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            E
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            D
          </th>
          <th className="font-display h-9 px-3 text-left text-xs font-semibold tracking-wider text-[var(--accent)]">
            Partidas
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="h-16 px-3 text-center text-[var(--muted)]">
              Sin jugadores
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.jugador_id}
              className={cn(
                "border-b border-[var(--border)]/40 last:border-0",
                highlightId === row.jugador_id && "row-highlight"
              )}
            >
              <td className={cn("px-3 text-[var(--muted)]", compact ? "py-2" : "py-2.5")}>
                {row.posicion}
              </td>
              <td className={cn("px-3", compact ? "py-2" : "py-2.5")}>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/jugador/${row.jugador_id}`}
                    className="link-fantasy font-medium"
                  >
                    {row.nombre}
                  </Link>
                  <PositionChangeIndicator
                    posicion={row.posicion}
                    posicionAnterior={row.posicion_anterior}
                  />
                </div>
              </td>
              <td
                className={cn(
                  "px-3 font-semibold text-[var(--accent-hover)]",
                  compact ? "py-2" : "py-2.5"
                )}
              >
                {row.puntos}
              </td>
              <td className={cn("px-3", compact ? "py-2" : "py-2.5")}>{row.victorias}</td>
              <td className={cn("px-3", compact ? "py-2" : "py-2.5")}>{row.empates}</td>
              <td className={cn("px-3", compact ? "py-2" : "py-2.5")}>{row.derrotas}</td>
              <td className={cn("px-3", compact ? "py-2" : "py-2.5")}>{row.partidas}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
