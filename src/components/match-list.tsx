"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchResultPicker } from "@/components/match-result-picker";
import { getPlayerMatchOutcome, isPlayerInMatch } from "@/lib/league/match-result";
import {
  buildMatchPointsIndex,
  pointsDeltaColorClass,
  type MatchPointsInfo,
} from "@/lib/league/match-points";
import { formatDate, cn } from "@/lib/utils";
import { captureStandingsSnapshot } from "@/lib/league/position-snapshot";
import type { MatchWithPlayers } from "@/lib/data/queries";
import { apiFetch, notifyDemoDataChanged } from "@/lib/api-client";
import type { MatchResult, StandingRow, User } from "@/types/database";

export type MatchListVariant = "personal" | "general";

function getPersonalResultBadge(
  match: MatchWithPlayers,
  profilePlayerId: string
): { label: string; variant: "success" | "danger" | "default" } {
  const outcome = getPlayerMatchOutcome(
    match.resultado,
    profilePlayerId,
    match.jugador_a,
    match.jugador_b
  );
  if (outcome === "draw") return { label: "Empate", variant: "default" };
  if (outcome === "win") return { label: "Victoria", variant: "success" };
  return { label: "Derrota", variant: "danger" };
}

function getProfilePlayerAndOpponent(
  match: MatchWithPlayers,
  profilePlayerId: string
): { profilePlayer: User; opponent: User } | null {
  if (!isPlayerInMatch(profilePlayerId, match.jugador_a, match.jugador_b)) {
    return null;
  }
  if (profilePlayerId === match.jugador_a) {
    return {
      profilePlayer: match.jugador_a_data,
      opponent: match.jugador_b_data,
    };
  }
  return {
    profilePlayer: match.jugador_b_data,
    opponent: match.jugador_a_data,
  };
}

interface MatchListProps {
  matches: MatchWithPlayers[];
  variant?: MatchListVariant;
  /** Requerido en variant="personal". */
  profilePlayerId?: string;
  editableForPlayerId?: string;
  seasonId?: string;
  standings?: StandingRow[];
}

export function MatchList({
  matches,
  variant = "personal",
  profilePlayerId,
  editableForPlayerId,
  seasonId,
  standings,
}: MatchListProps) {
  const matchPointsIndex = useMemo(
    () => (variant === "general" ? buildMatchPointsIndex(matches) : null),
    [matches, variant]
  );

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
          variant={variant}
          profilePlayerId={profilePlayerId}
          editableForPlayerId={editableForPlayerId}
          seasonId={seasonId}
          standings={standings}
          pointsInfo={matchPointsIndex?.get(match.id)}
        />
      ))}
    </div>
  );
}

function MatchListItem({
  match,
  variant,
  profilePlayerId,
  editableForPlayerId,
  seasonId,
  standings,
  pointsInfo,
}: {
  match: MatchWithPlayers;
  variant: MatchListVariant;
  profilePlayerId?: string;
  editableForPlayerId?: string;
  seasonId?: string;
  standings?: StandingRow[];
  pointsInfo?: MatchPointsInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draftResult, setDraftResult] = useState<MatchResult>(match.resultado);

  const isPersonal = variant === "personal" && profilePlayerId;
  const isGeneral = variant === "general";
  const players = isPersonal
    ? getProfilePlayerAndOpponent(match, profilePlayerId)
    : null;

  const canEdit =
    editableForPlayerId &&
    isPlayerInMatch(
      editableForPlayerId,
      match.jugador_a,
      match.jugador_b
    );

  const badge = isPersonal
    ? getPersonalResultBadge(match, profilePlayerId!)
    : null;

  function saveEdit() {
    startTransition(async () => {
      if (seasonId && standings) {
        captureStandingsSnapshot(seasonId, standings);
      }
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="font-medium">
            {players ? (
              <>
                {players.profilePlayer.nombre}
                {" vs "}
                <Link
                  href={`/jugador/${players.opponent.id}`}
                  className="link-fantasy"
                >
                  {players.opponent.nombre}
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
          {isGeneral && pointsInfo && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-sm">
              <span className="text-[var(--muted)]" aria-hidden>
                →
              </span>
              <LeaguePointsSummary
                player={match.jugador_a_data}
                points={pointsInfo.jugador_a}
              />
              <span className="text-[var(--muted)]" aria-hidden>
                |
              </span>
              <LeaguePointsSummary
                player={match.jugador_b_data}
                points={pointsInfo.jugador_b}
              />
            </div>
          )}
        </div>
        {!editing && isPersonal && badge && (
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

function LeaguePointsSummary({
  player,
  points,
}: {
  player: User;
  points: { delta: number; total: number };
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1">
      <Link href={`/jugador/${player.id}`} className="link-fantasy font-medium">
        {player.nombre}
      </Link>
      <span className="text-[var(--muted)]">(</span>
      <span className={cn("font-medium", pointsDeltaColorClass(points.delta))}>
        +{points.delta} puntos
      </span>
      <span className="text-[var(--muted)]">: {points.total} puntos)</span>
    </span>
  );
}
