"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MatchResultPicker } from "@/components/match-result-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, notifyDemoDataChanged } from "@/lib/api-client";
import type { MatchResult, User } from "@/types/database";

interface MatchFormProps {
  players: User[];
  currentPlayerId: string;
  seasonId: string;
}

export function MatchForm({ players, currentPlayerId, seasonId }: MatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentPlayer = players.find((p) => p.id === currentPlayerId)!;
  const others = players.filter((p) => p.id !== currentPlayerId);
  const defaultOpponent = others[0]?.id ?? "";

  const [opponentId, setOpponentId] = useState(defaultOpponent);
  const [result, setResult] = useState<MatchResult>("victoria_jugador_a");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const opponent = players.find((p) => p.id === opponentId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!opponentId || !opponent) {
      toast.error("Selecciona un rival");
      return;
    }

    startTransition(async () => {
      const res = await apiFetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season_id: seasonId,
          jugador_a: currentPlayerId,
          jugador_b: opponentId,
          resultado: result,
          fecha,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo registrar la partida");
        return;
      }

      toast.success("Partida registrada");
      notifyDemoDataChanged();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 fantasy-panel p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="rival">Rival</Label>
        <Select value={opponentId} onValueChange={setOpponentId}>
          <SelectTrigger id="rival">
            <SelectValue placeholder="Selecciona rival" />
          </SelectTrigger>
          <SelectContent>
            {others.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {opponent && (
        <div className="space-y-2">
          <Label>¿Quién ganó?</Label>
          <MatchResultPicker
            jugadorA={currentPlayer}
            jugadorB={opponent}
            value={result}
            onChange={setResult}
            disabled={isPending}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={isPending || !opponentId}>
        {isPending ? "Guardando..." : "Registrar"}
      </Button>
    </form>
  );
}
