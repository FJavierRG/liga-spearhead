"use client";

import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types/database";

interface PlayerRef {
  id: string;
  nombre: string;
}

interface MatchResultPickerProps {
  jugadorA: PlayerRef;
  jugadorB: PlayerRef;
  value: MatchResult;
  onChange: (result: MatchResult) => void;
  disabled?: boolean;
  className?: string;
}

export function MatchResultPicker({
  jugadorA,
  jugadorB,
  value,
  onChange,
  disabled,
  className,
}: MatchResultPickerProps) {
  const options: { result: MatchResult; label: string }[] = [
    { result: "victoria_jugador_a", label: jugadorA.nombre },
    { result: "victoria_jugador_b", label: jugadorB.nombre },
    { result: "empate", label: "Empate" },
  ];

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="radiogroup"
      aria-label="Resultado de la partida"
    >
      {options.map(({ result, label }) => {
        const selected = value === result;
        return (
          <button
            key={result}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(result)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
              selected
                ? "border-[var(--border-light)] bg-[var(--accent-dim)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)] hover:border-[var(--border-light)] hover:text-[var(--foreground)]"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
