"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientSessionUserId } from "@/lib/client-demo/session";
import { getStaticDemoJugadorData } from "@/lib/client-demo/handlers";
import { MatchList } from "@/components/match-list";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/section-title";
import { apiPath } from "@/lib/api-client";

export function StaticDemoJugador({ playerId }: { playerId: string }) {
  const [data, setData] = useState<ReturnType<
    typeof getStaticDemoJugadorData
  > | null>(null);

  const reload = useCallback(() => {
    const viewerId = getClientSessionUserId();
    setData(getStaticDemoJugadorData(playerId, viewerId));
  }, [playerId]);

  useEffect(() => {
    reload();
    window.addEventListener("liga-demo-update", reload);
    return () => window.removeEventListener("liga-demo-update", reload);
  }, [reload]);

  if (!data) {
    return <p className="text-[var(--muted)]">Jugador no encontrado.</p>;
  }

  const { player, standing, playerMatches, isOwn, viewerId } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <Link href={apiPath("/")} className="link-fantasy text-sm">
        ← Liga
      </Link>

      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-wide">
          {player.nombre}
        </h1>
        {player.faccion && (
          <p className="text-sm text-[var(--muted)]">{player.faccion}</p>
        )}
      </header>

      {standing && (
        <section>
          <SectionTitle className="mb-3">Estadísticas</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Posición" value={`#${standing.posicion}`} />
            <Stat label="Puntos" value={String(standing.puntos)} />
            <Stat label="Victorias" value={String(standing.victorias)} />
            <Stat label="Partidas" value={String(standing.partidas)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{standing.empates} empates</Badge>
            <Badge variant="outline">{standing.derrotas} derrotas</Badge>
            {player.rol === "administrador" && (
              <Badge variant="info">Administrador</Badge>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionTitle className="mb-3">
          Historial{isOwn ? " de partidas" : ""}
        </SectionTitle>
        {playerMatches.length > 0 ? (
          <MatchList
            matches={playerMatches}
            viewerId={player.id}
            editableForPlayerId={isOwn ? viewerId ?? undefined : undefined}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">Sin partidas todavía.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fantasy-panel p-4 text-center">
      <div className="font-display text-xl font-semibold text-[var(--accent)]">
        {value}
      </div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}
