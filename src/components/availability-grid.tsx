"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
import { getWeekDates } from "@/lib/league/matching";
import { cn, formatDate } from "@/lib/utils";
import type { Availability, TimeSlot } from "@/types/database";
import { DAY_LABELS, TIME_SLOTS } from "@/types/database";

interface AvailabilityGridProps {
  playerId: string;
  initialAvailability: Availability[];
  readOnly?: boolean;
}

export function AvailabilityGrid({
  playerId,
  initialAvailability,
  readOnly = false,
}: AvailabilityGridProps) {
  const supabase = IS_MOCK ? null : createClient();
  const [isPending, startTransition] = useTransition();
  const weekDates = useMemo(() => getWeekDates(), []);

  const [slots, setSlots] = useState<Set<string>>(() => {
    const set = new Set<string>();
    initialAvailability
      .filter((a) => a.disponible)
      .forEach((a) => set.add(`${a.fecha}|${a.franja}`));
    return set;
  });

  function isActive(fecha: string, franja: TimeSlot) {
    return slots.has(`${fecha}|${franja}`);
  }

  function toggleSlot(fecha: string, franja: TimeSlot) {
    if (readOnly || isPending) return;

    const key = `${fecha}|${franja}`;
    const next = new Set(slots);
    const willEnable = !next.has(key);

    if (willEnable) next.add(key);
    else next.delete(key);

    setSlots(next);

    startTransition(async () => {
      if (IS_MOCK) {
        const res = await fetch("/api/mock/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jugador_id: playerId,
            fecha,
            franja,
            disponible: willEnable,
          }),
        });

        if (!res.ok) {
          setSlots(new Set(slots));
          toast.error("No se pudo guardar la disponibilidad");
        }
        return;
      }

      const { error } = await supabase!.from("availability").upsert(
        {
          jugador_id: playerId,
          fecha,
          franja,
          disponible: willEnable,
        },
        { onConflict: "jugador_id,fecha,franja" }
      );

      if (error) {
        setSlots(new Set(slots));
        toast.error("No se pudo guardar la disponibilidad");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="p-3 text-left text-xs font-medium text-[var(--muted)]">
              Franja
            </th>
            {weekDates.map((fecha, index) => (
              <th
                key={fecha}
                className="p-3 text-center text-xs font-medium text-[var(--muted)]"
              >
                <div>{DAY_LABELS[index]}</div>
                <div className="mt-1 font-normal text-[var(--muted)]/70">
                  {formatDate(fecha)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(({ key, label }) => (
            <tr key={key} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="p-3 font-medium text-[var(--muted)]">{label}</td>
              {weekDates.map((fecha) => {
                const active = isActive(fecha, key);
                return (
                  <td key={`${fecha}-${key}`} className="p-2 text-center">
                    <button
                      type="button"
                      disabled={readOnly || isPending}
                      onClick={() => toggleSlot(fecha, key)}
                      aria-pressed={active}
                      aria-label={`${label} ${formatDate(fecha)}`}
                      className={cn(
                        "mx-auto h-9 w-full max-w-[72px] rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
                        active
                          ? "border-green-800 bg-green-950/60 hover:bg-green-950"
                          : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--border)]",
                        (readOnly || isPending) && "cursor-default opacity-80"
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
