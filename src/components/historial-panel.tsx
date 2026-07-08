"use client";

import { useMemo, useState } from "react";
import { MatchList } from "@/components/match-list";
import { SectionTitle } from "@/components/ui/section-title";
import { isPlayerInMatch } from "@/lib/league/match-result";
import { cn } from "@/lib/utils";
import type { MatchWithPlayers } from "@/lib/data/queries";
import type { StandingRow } from "@/types/database";

type HistorialTab = "personal" | "general";

interface HistorialPanelProps {
  matches: MatchWithPlayers[];
  currentPlayerId: string;
  seasonId: string;
  standings: StandingRow[];
}

export function HistorialPanel({
  matches,
  currentPlayerId,
  seasonId,
  standings,
}: HistorialPanelProps) {
  const [tab, setTab] = useState<HistorialTab>("personal");

  const sorted = useMemo(
    () =>
      [...matches].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [matches]
  );

  const myMatches = useMemo(
    () =>
      sorted.filter((match) =>
        isPlayerInMatch(currentPlayerId, match.jugador_a, match.jugador_b)
      ),
    [sorted, currentPlayerId]
  );

  return (
    <section className="space-y-4">
      <SectionTitle>Historial de partidas</SectionTitle>

      <div
        className="flex gap-1 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_60%,#000)] p-1"
        role="tablist"
        aria-label="Historial de partidas"
      >
        <TabButton
          active={tab === "personal"}
          onClick={() => setTab("personal")}
        >
          Mi historial
        </TabButton>
        <TabButton
          active={tab === "general"}
          onClick={() => setTab("general")}
        >
          Resultados Liga
        </TabButton>
      </div>

      {tab === "personal" ? (
        <>
          <p className="text-sm text-[var(--muted)]">
            Tus partidas de la temporada. Puedes corregir el resultado si hubo un
            error.
          </p>
          <MatchList
            matches={myMatches}
            variant="personal"
            profilePlayerId={currentPlayerId}
            editableForPlayerId={currentPlayerId}
            seasonId={seasonId}
            standings={standings}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">
            Todos los resultados de la liga en esta temporada.
          </p>
          <MatchList matches={sorted} variant="general" />
        </>
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "font-display flex-1 rounded-sm px-3 py-2 text-sm tracking-wide transition-colors",
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-hover)]"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      )}
    >
      {children}
    </button>
  );
}
