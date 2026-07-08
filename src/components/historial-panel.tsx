import { MatchList } from "@/components/match-list";
import { SectionTitle } from "@/components/ui/section-title";
import type { MatchWithPlayers } from "@/lib/data/queries";

interface HistorialPanelProps {
  matches: MatchWithPlayers[];
  currentPlayerId: string;
}

export function HistorialPanel({ matches, currentPlayerId }: HistorialPanelProps) {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <section className="space-y-4">
      <SectionTitle>Historial de partidas</SectionTitle>
      <p className="text-sm text-[var(--muted)]">
        Partidas finalizadas de la temporada. Si participaste, puedes corregir el
        resultado si hubo un error.
      </p>
      <MatchList
        matches={sorted}
        editableForPlayerId={currentPlayerId}
      />
    </section>
  );
}
