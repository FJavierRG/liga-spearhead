"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchResultPicker } from "@/components/match-result-picker";
import { getWinnerLabel, isPlayerInMatch } from "@/lib/league/match-result";
import { formatDate } from "@/lib/utils";
import type { MatchWithPlayers } from "@/lib/data/queries";
import { apiFetch, notifyDemoDataChanged } from "@/lib/api-client";
import type { MatchResult } from "@/types/database";

function getResultBadge(
  match: MatchWithPlayers
): { label: string; variant: "success" | "warning" | "danger" | "default" } {
  if (match.resultado === "empate") {
    return { label: "Empate", variant: "warning" };
  }

  const winner = getWinnerLabel(
    match.resultado,
    match.jugador_a_data,
    match.jugador_b_data
  );

  return { label: `Victoria ${winner}`, variant: "default" };
}

interface MatchListProps {
  matches: MatchWithPlayers[];
  viewerId?: string;
  editableForPlayerId?: string;
}

export function MatchList({
  matches,
  viewerId,
  editableForPlayerId,
}: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="fantasy-panel border-dashed p-6 text-center text-[var(--muted)]">
        Todavía no hay partidas registradas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchListItem
          key={match.id}
          match={match}
          viewerId={viewerId}
          editableForPlayerId={editableForPlayerId}
        />
      ))}
    </div>
  );
}

function MatchListItem({
  match,
  viewerId,
  editableForPlayerId,
}: {
  match: MatchWithPlayers;
  viewerId?: string;
  editableForPlayerId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draftResult, setDraftResult] = useState<MatchResult>(match.resultado);

  const opponent =
    viewerId === match.jugador_a
      ? match.jugador_b_data
      : viewerId === match.jugador_b
        ? match.jugador_a_data
        : null;

  const canEdit =
    editableForPlayerId &&
    isPlayerInMatch(
      editableForPlayerId,
      match.jugador_a,
      match.jugador_b
    );

  const badge = getResultBadge(match);

  function saveEdit() {
    startTransition(async () => {
      const res = await apiFetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado: draftResult }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo actualizar");
        return;
      }
      toast.success("Resultado actualizado");
      setEditing(false);
      notifyDemoDataChanged();
      router.refresh();
    });
  }

  return (
    <div className="fantasy-panel px-4 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">
            {viewerId && opponent ? (
              <>
                vs{" "}
                <Link
                  href={`/jugador/${opponent.id}`}
                  className="link-fantasy"
                >
                  {opponent.nombre}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/jugador/${match.jugador_a_data.id}`}
                  className="link-fantasy"
                >
                  {match.jugador_a_data.nombre}
                </Link>
                {" vs "}
                <Link
                  href={`/jugador/${match.jugador_b_data.id}`}
                  className="link-fantasy"
                >
                  {match.jugador_b_data.nombre}
                </Link>
              </>
            )}
          </div>
          <div className="text-[var(--muted)]">{formatDate(match.fecha)}</div>
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setDraftResult(match.resultado);
                  setEditing(true);
                }}
              >
                Editar
              </Button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)]/60 pt-3">
          <p className="text-[var(--muted)]">¿Quién ganó?</p>
          <MatchResultPicker
            jugadorA={match.jugador_a_data}
            jugadorB={match.jugador_b_data}
            value={draftResult}
            onChange={setDraftResult}
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending} onClick={saveEdit}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getMatchSummary(
  match: MatchWithPlayers,
  playerId: string
): MatchResult {
  return match.resultado;
}
