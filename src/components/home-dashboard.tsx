import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { MatchWithPlayers } from "@/lib/data/queries";
import type { RecommendedMatch, StandingRow, User } from "@/types/database";
import { TIME_SLOTS } from "@/types/database";

interface HomeDashboardProps {
  profile: User;
  standing?: StandingRow;
  recommendation: RecommendedMatch | null;
  recentMatches: MatchWithPlayers[];
}

export function HomeDashboard({
  profile,
  standing,
  recommendation,
  recentMatches,
}: HomeDashboardProps) {
  const slotLabel = (franja: string) =>
    TIME_SLOTS.find((s) => s.key === franja)?.label ?? franja;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>¿Qué necesitas hacer ahora?</CardTitle>
          <CardDescription>
            Tu resumen personal para la temporada activa
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-50 p-4">
            <div className="text-sm text-neutral-500">Tu posición</div>
            <div className="mt-1 text-3xl font-semibold">
              {standing?.posicion ?? "—"}
            </div>
            <div className="text-sm text-neutral-600">
              {standing?.puntos ?? 0} puntos
            </div>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <div className="text-sm text-neutral-500">Partidas jugadas</div>
            <div className="mt-1 text-3xl font-semibold">
              {standing?.partidas ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <div className="text-sm text-neutral-500">Balance</div>
            <div className="mt-1 text-lg font-semibold">
              {standing?.victorias ?? 0}V · {standing?.empates ?? 0}E ·{" "}
              {standing?.derrotas ?? 0}D
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximo rival recomendado</CardTitle>
          <CardDescription>
            Emparejamiento basado en disponibilidad y estado de la liga
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendation ? (
            <div className="space-y-4">
              <Link
                href={`/perfil/${recommendation.opponent.id}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={recommendation.opponent.avatar_url ?? undefined}
                  />
                  <AvatarFallback>
                    {recommendation.opponent.nombre.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {recommendation.opponent.nombre}
                  </div>
                  {recommendation.opponent.faccion && (
                    <div className="text-sm text-neutral-500">
                      {recommendation.opponent.faccion}
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  +{recommendation.handicap.bonus_pv} PV para{" "}
                  {recommendation.handicap.beneficiario === profile.id
                    ? "ti"
                    : recommendation.opponent.nombre}
                </Badge>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-neutral-700">
                  Disponibilidad coincidente
                </div>
                {recommendation.overlappingSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recommendation.overlappingSlots.slice(0, 6).map((slot) => (
                      <Badge key={`${slot.fecha}-${slot.franja}`} variant="outline">
                        {formatDate(slot.fecha)} · {slotLabel(slot.franja)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Sin coincidencias esta semana. Actualiza tu disponibilidad.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">
              No hay rivales disponibles todavía. Invita a más jugadores o
              actualiza tu disponibilidad.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentMatches.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin partidas recientes.</p>
          ) : (
            recentMatches.slice(0, 5).map((match) => {
              const opponent =
                match.jugador_a === profile.id
                  ? match.jugador_b_data
                  : match.jugador_a_data;
              const won =
                (match.jugador_a === profile.id &&
                  match.resultado === "victoria_jugador_a") ||
                (match.jugador_b === profile.id &&
                  match.resultado === "victoria_jugador_b");
              const draw = match.resultado === "empate";

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2"
                >
                  <div>
                    <div className="font-medium">vs {opponent.nombre}</div>
                    <div className="text-xs text-neutral-500">
                      {formatDate(match.fecha)}
                    </div>
                  </div>
                  <Badge
                    variant={draw ? "warning" : won ? "success" : "danger"}
                  >
                    {draw ? "Empate" : won ? "Victoria" : "Derrota"}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
