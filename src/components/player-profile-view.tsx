import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityGrid } from "@/components/availability-grid";
import { MatchList } from "@/components/match-list";
import type { MatchWithPlayers } from "@/lib/data/queries";
import type { Availability, StandingRow, User } from "@/types/database";

interface PlayerProfileViewProps {
  player: User;
  standing?: StandingRow;
  matches: MatchWithPlayers[];
  availability: Availability[];
  isOwnProfile?: boolean;
}

export function PlayerProfileView({
  player,
  standing,
  matches,
  availability,
  isOwnProfile = false,
}: PlayerProfileViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={player.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">
              {player.nombre.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{player.nombre}</h1>
            {player.faccion && (
              <p className="mt-1 text-neutral-500">{player.faccion}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {standing && (
                <>
                  <Badge variant="outline">#{standing.posicion} en liga</Badge>
                  <Badge variant="outline">{standing.puntos} puntos</Badge>
                  <Badge variant="outline">{standing.partidas} partidas</Badge>
                </>
              )}
              {player.rol === "administrador" && (
                <Badge variant="info">Administrador</Badge>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <Link
              href="/perfil/editar"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Editar perfil
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Victorias" value={standing?.victorias ?? 0} />
            <Stat label="Empates" value={standing?.empates ?? 0} />
            <Stat label="Derrotas" value={standing?.derrotas ?? 0} />
            <Stat label="Puntos" value={standing?.puntos ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de partidas</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchList matches={matches.slice(0, 5)} viewerId={player.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityGrid
            playerId={player.id}
            initialAvailability={availability}
            readOnly={!isOwnProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
