import { ArrowDown, ArrowUp } from "lucide-react";
import { getPositionChange } from "@/lib/league/position-snapshot";
import { cn } from "@/lib/utils";

interface PositionChangeIndicatorProps {
  posicion?: number;
  posicionAnterior?: number;
  className?: string;
}

export function PositionChangeIndicator({
  posicion,
  posicionAnterior,
  className,
}: PositionChangeIndicatorProps) {
  const change = getPositionChange(posicion, posicionAnterior);
  if (!change) return null;

  if (change === "up") {
    return (
      <ArrowUp
        className={cn("h-3.5 w-3.5 shrink-0 text-[#B4DB7B]", className)}
        aria-label="Sube posiciones"
      />
    );
  }

  return (
    <ArrowDown
      className={cn("h-3.5 w-3.5 shrink-0 text-[#94310A]", className)}
      aria-label="Baja posiciones"
    />
  );
}
