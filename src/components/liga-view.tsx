"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { StandingsTable } from "@/components/standings-table";
import { HistorialPanel } from "@/components/historial-panel";
import { ReglasPanel } from "@/components/reglas-panel";
import {
  SidebarNav,
  type LigaSection,
} from "@/components/layout/sidebar-nav";
import { useReglasPendientes } from "@/hooks/use-reglas-pendientes";
import { SectionTitle } from "@/components/ui/section-title";
import { formatWeekRange } from "@/lib/league/week";
import { cn } from "@/lib/utils";
import type { MatchWithPlayers, ScheduledMatchWithPlayers } from "@/lib/data/queries";
import type { Availability, Season, StandingRow, User } from "@/types/database";

const AvailabilityPanel = dynamic(
  () =>
    import("@/components/availability-panel").then((m) => m.AvailabilityPanel),
  {
    ssr: false,
    loading: () => <PanelSkeleton />,
  }
);

const ScheduledMatchesPanel = dynamic(
  () =>
    import("@/components/scheduled-matches-panel").then(
      (m) => m.ScheduledMatchesPanel
    ),
  {
    ssr: false,
    loading: () => <PanelSkeleton />,
  }
);

interface LigaViewProps {
  profile: User;
  season: Season;
  standings: StandingRow[];
  availability: Availability[];
  scheduled: ScheduledMatchWithPlayers[];
  players: User[];
  matches: MatchWithPlayers[];
}

export function LigaView({
  profile,
  season,
  standings,
  availability,
  scheduled,
  players,
  matches,
}: LigaViewProps) {
  const weekLabel = formatWeekRange(0);
  const [section, setSection] = useState<LigaSection>("tablon");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { reglasPendientes, marcarReglasVistas } = useReglasPendientes(profile);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(true);
    }
  }, []);

  function selectSection(next: LigaSection) {
    setSection(next);
    if (next === "reglas") {
      void marcarReglasVistas();
    }
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarOpen(false);
    }
  }

  return (
    <div className="relative">
      <SidebarNav
        active={section}
        onSelect={selectSection}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        reglasPendientes={reglasPendientes}
      />

      <div
        className={cn(
          "transition-[margin] duration-200 ease-out",
          sidebarOpen ? "lg:ml-56" : "lg:ml-14"
        )}
      >
        <div className="mb-4 lg:hidden">
          <span className="font-display text-sm tracking-wide text-[var(--muted)]">
            {section === "tablon"
              ? "Tablón"
              : section === "historial"
                ? "Historial"
                : "Reglas del formato"}
          </span>
        </div>

        {section === "tablon" && (
          <TablonContent
            profile={profile}
            season={season}
            standings={standings}
            availability={availability}
            scheduled={scheduled}
            players={players}
            weekLabel={weekLabel}
          />
        )}

        {section === "historial" && (
          <div className="mx-auto max-w-2xl pb-12">
            <HistorialPanel
              matches={matches}
              currentPlayerId={profile.id}
              seasonId={season.id}
              standings={standings}
            />
          </div>
        )}

        {section === "reglas" && (
          <div className="mx-auto max-w-2xl pb-12">
            <ReglasPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function TablonContent({
  profile,
  season,
  standings,
  availability,
  scheduled,
  players,
  weekLabel,
}: {
  profile: User;
  season: Season;
  standings: StandingRow[];
  availability: Availability[];
  scheduled: ScheduledMatchWithPlayers[];
  players: User[];
  weekLabel: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 pb-12">
      <aside className="hidden shrink-0 text-[80%] lg:block">
        <div className="sticky top-[3.75rem] w-max min-w-[26rem] space-y-2">
          <SectionTitle>Clasificación</SectionTitle>
          <div className="fantasy-panel overflow-hidden">
            <StandingsTable
              standings={standings}
              seasonId={season.id}
              highlightId={profile.id}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-8 lg:max-w-2xl">
        <header className="border-b border-[var(--border)]/60 pb-4">
          <p className="text-sm italic text-[var(--muted)]">{season.nombre}</p>
          <Link
            href={`/jugador/${profile.id}`}
            className="font-display link-fantasy text-xl font-semibold tracking-wide"
          >
            {profile.nombre}
          </Link>
        </header>

        <section className="lg:hidden">
          <SectionTitle className="mb-2">Clasificación</SectionTitle>
          <div className="fantasy-panel overflow-hidden">
            <StandingsTable
              standings={standings}
              seasonId={season.id}
              highlightId={profile.id}
              compact
            />
          </div>
        </section>

        <AvailabilityPanel
          playerId={profile.id}
          allAvailability={availability}
        />

        <ScheduledMatchesPanel
          profile={profile}
          seasonId={season.id}
          standings={standings}
          players={players}
          scheduled={scheduled}
          weekLabel={weekLabel}
        />
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="fantasy-panel h-40 animate-pulse opacity-60" />
  );
}
