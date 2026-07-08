"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { MatchForm } from "@/components/match-form";
import { MatchResultPicker } from "@/components/match-result-picker";
import { formatWeekRange } from "@/lib/league/week";
import { formatDate } from "@/lib/utils";
import type { ScheduledMatchWithPlayers } from "@/lib/data/queries";
import type { MatchResult, User } from "@/types/database";
import { apiFetch, notifyDemoDataChanged } from "@/lib/api-client";

import { ACTIVE_TIME_SLOTS } from "@/types/database";

interface ScheduledMatchesPanelProps {
  profile: User;
  seasonId: string;
  players: User[];
  scheduled: ScheduledMatchWithPlayers[];
  weekLabel: string;
}

function slotLabel(franja: string) {
  return ACTIVE_TIME_SLOTS.find((s) => s.key === franja)?.label ?? franja;
}

export function ScheduledMatchesPanel({
  profile,
  seasonId,
  players,
  scheduled,
  weekLabel,
}: ScheduledMatchesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showManual, setShowManual] = useState(false);
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [finishResult, setFinishResult] = useState<MatchResult>("victoria_jugador_a");

  function cancelMatch(matchId: string) {
    startTransition(async () => {
      const res = await apiFetch(`/api/scheduled/${matchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo cancelar");
        return;
      }
      toast.success("Partido cancelado");
      notifyDemoDataChanged();
      router.refresh();
    });
  }

  function openFinish(match: ScheduledMatchWithPlayers) {
    setFinishingId(match.id);
    setFinishResult("victoria_jugador_a");
  }

  function confirmFinish(matchId: string) {
    startTransition(async () => {
      const res = await apiFetch(`/api/scheduled/${matchId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado: finishResult }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo registrar el resultado");
        return;
      }
      toast.success("Partida finalizada");
      setFinishingId(null);
      notifyDemoDataChanged();
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <SectionTitle>Siguientes partidos · Semana {weekLabel}</SectionTitle>

      {scheduled.length === 0 ? (
        <p className="fantasy-panel border-dashed px-4 py-6 text-center text-sm text-[var(--muted)]">
          Sin partidos asignados esta semana.
        </p>
      ) : (
        <div className="space-y-2">
          {scheduled.map((match) => {
            const opponent =
              match.jugador_a === profile.id
                ? match.jugador_b_data
                : match.jugador_a_data;
            const isFinishing = finishingId === match.id;

            return (
              <div key={match.id} className="fantasy-panel px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/jugador/${opponent.id}`}
                      className="link-fantasy font-medium"
                    >
                      vs {opponent.nombre}
                    </Link>
                    <p className="text-[var(--muted)]">
                      {formatDate(match.fecha)} · {slotLabel(match.franja)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!isFinishing && (
                      <>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => openFinish(match)}
                        >
                          Finalizado
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => cancelMatch(match.id)}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isFinishing && (
                  <div className="mt-4 space-y-3 border-t border-[var(--border)]/60 pt-4">
                    <p className="text-[var(--muted)]">¿Quién ganó?</p>
                    <MatchResultPicker
                      jugadorA={match.jugador_a_data}
                      jugadorB={match.jugador_b_data}
                      value={finishResult}
                      onChange={setFinishResult}
                      disabled={isPending}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => confirmFinish(match.id)}
                      >
                        {isPending ? "Guardando..." : "Confirmar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setFinishingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? "Ocultar registro manual" : "Registrar partida a mano"}
        </Button>
      </div>

      {showManual && (
        <MatchForm
          players={players}
          currentPlayerId={profile.id}
          seasonId={seasonId}
        />
      )}
    </section>
  );
}
