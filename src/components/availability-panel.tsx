"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { getWeekDates, formatWeekRange } from "@/lib/league/week";
import { cn, formatDate } from "@/lib/utils";
import type { Availability } from "@/types/database";
import { ACTIVE_TIME_SLOTS, DAY_LABELS } from "@/types/database";

import { apiFetch, notifyDemoDataChanged } from "@/lib/api-client";

interface AvailabilityPanelProps {
  playerId: string;
  allAvailability: Availability[];
}

function buildSlotSet(items: Availability[], weekDates: string[]): Set<string> {
  const set = new Set<string>();
  for (const a of items) {
    if (a.disponible && weekDates.includes(a.fecha)) {
      set.add(`${a.fecha}|${a.franja}`);
    }
  }
  return set;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function AvailabilityPanel({
  playerId,
  allAvailability,
}: AvailabilityPanelProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftSlots, setDraftSlots] = useState<Set<string> | null>(null);
  const [isPending, startTransition] = useTransition();

  const weekDates = useMemo(
    () => getWeekDates(new Date(), weekOffset),
    [weekOffset]
  );
  const weekStart = weekDates[0];
  const weekLabel = formatWeekRange(weekOffset);

  const savedSlots = useMemo(
    () => buildSlotSet(allAvailability, weekDates),
    [allAvailability, weekDates]
  );

  const displaySlots = editing && draftSlots ? draftSlots : savedSlots;

  function changeWeek(offset: number) {
    setWeekOffset(offset);
    setEditing(false);
    setDraftSlots(null);
  }

  function startEdit() {
    setDraftSlots(new Set(savedSlots));
    setEditing(true);
  }

  function cancelEdit() {
    setDraftSlots(null);
    setEditing(false);
  }

  function toggleSlot(fecha: string, franja: string) {
    if (!editing || !draftSlots) return;
    const key = `${fecha}|${franja}`;
    const next = new Set(draftSlots);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setDraftSlots(next);
  }

  function handleSave() {
    if (!draftSlots) return;

    startTransition(async () => {
      const slots = weekDates.flatMap((fecha) =>
        ACTIVE_TIME_SLOTS.map(({ key }) => ({
          fecha,
          franja: key,
          disponible: draftSlots.has(`${fecha}|${key}`),
        }))
      );

      const res = await apiFetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jugador_id: playerId, week_start: weekStart, slots }),
      });

      if (!res.ok) {
        toast.error("No se pudo guardar la disponibilidad");
        return;
      }

      setEditing(false);
      setDraftSlots(null);
      toast.success("Disponibilidad guardada");
      notifyDemoDataChanged();
      router.refresh();
    });
  }

  const hasChanges =
    editing && draftSlots ? !setsEqual(draftSlots, savedSlots) : false;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>Tu disponibilidad · Semana {weekLabel}</SectionTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => changeWeek(weekOffset - 1)}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeWeek(0)}
            disabled={isPending}
            className={cn(weekOffset === 0 && "pointer-events-none")}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Semana siguiente"
            onClick={() => changeWeek(weekOffset + 1)}
            disabled={isPending}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="fantasy-panel fantasy-panel-torn">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-2.5 text-left text-xs font-medium text-[var(--muted)]" />
              {weekDates.map((fecha, index) => (
                <th
                  key={fecha}
                  className="p-2.5 text-center text-xs font-medium text-[var(--muted)]"
                >
                  <div>{DAY_LABELS[index].slice(0, 3)}</div>
                  <div className="mt-0.5 font-normal opacity-70">
                    {formatDate(fecha).split(" ")[1]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIVE_TIME_SLOTS.map(({ key, label }) => (
              <tr key={key} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="p-2.5 text-[var(--muted)]">{label}</td>
                {weekDates.map((fecha) => {
                  const active = displaySlots.has(`${fecha}|${key}`);
                  return (
                    <td key={`${fecha}-${key}`} className="p-1.5 text-center">
                      <button
                        type="button"
                        disabled={!editing || isPending}
                        onClick={() => toggleSlot(fecha, key)}
                        aria-pressed={active}
                        className={cn(
                          "relative mx-auto flex h-8 w-full max-w-[56px] items-center justify-center rounded-md border transition-colors",
                          active
                            ? "border-[var(--border-light)] bg-[color-mix(in_srgb,var(--accent)_35%,#1a1208)]"
                            : "border-[var(--border)] bg-[var(--surface-muted)]",
                          editing && "hover:ring-1 hover:ring-[var(--accent)]/40",
                          !editing && "cursor-default"
                        )}
                      >
                        {active && (
                          <Check
                            className="h-4 w-4 text-[#BAB777]"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !hasChanges}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={startEdit}>
            Editar
          </Button>
        )}
      </div>

      <p className="text-base leading-relaxed text-[var(--muted)]">
        Los emparejamientos se calculan automáticamente los lunes a las 01:00.
      </p>
    </section>
  );
}
