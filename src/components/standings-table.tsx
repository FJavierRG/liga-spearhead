"use client";

import { useMemo } from "react";
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

  const cellPad = compact ? "px-1" : "px-3";

  return (
    <table
      className={cn(
        "w-full whitespace-nowrap",
        compact ? "text-xs" : "text-sm"
      )}
    >
      <thead>
        <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_80%,#000)]">
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            #
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            Jugador
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            Pts
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            V
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            E
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            D
          </th>
          <th
            className={cn(
              "font-display h-9 text-left text-xs font-semibold tracking-wider text-[var(--accent)]",
              cellPad
            )}
          >
            {compact ? "Part." : "Partidas"}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} className={cn("h-16 text-center text-[var(--muted)]", cellPad)}>
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
              <td className={cn(cellPad, "text-[var(--muted)]", compact ? "py-2" : "py-2.5")}>
                {row.posicion}
              </td>
              <td className={cn(cellPad, compact ? "py-2" : "py-2.5")}>
                <div className="flex items-center gap-0.5">
                  <span className="max-w-[5.5rem] truncate font-medium">
                    {row.nombre}
                  </span>
                  <PositionChangeIndicator
                    posicion={row.posicion}
                    posicionAnterior={row.posicion_anterior}
                  />
                </div>
              </td>
              <td
                className={cn(
                  cellPad,
                  "font-semibold text-[var(--accent-hover)]",
                  compact ? "py-2" : "py-2.5"
                )}
              >
                {row.puntos}
              </td>
              <td className={cn(cellPad, compact ? "py-2" : "py-2.5")}>{row.victorias}</td>
              <td className={cn(cellPad, compact ? "py-2" : "py-2.5")}>{row.empates}</td>
              <td className={cn(cellPad, compact ? "py-2" : "py-2.5")}>{row.derrotas}</td>
              <td className={cn(cellPad, compact ? "py-2" : "py-2.5")}>{row.partidas}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
