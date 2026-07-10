import { isMockMode, isStaticDemo } from "@/lib/config";
import { ensureWeeklySchedule } from "@/lib/data/scheduled-queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCronScheduleWeekStart,
  WEEKEND_SCHEDULE_CRON_HOUR,
  WEEKLY_SCHEDULE_CRON_HOUR,
} from "@/lib/league/week";

export type ScheduleRunKind = "friday" | "saturday" | "sunday";

const SCHEDULE_TIMEZONE = "Europe/Madrid";

const MADRID_WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getMadridScheduleContext(reference: Date): {
  weekday: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(reference);

  const weekdayLabel = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");

  return {
    weekday: MADRID_WEEKDAY[weekdayLabel] ?? 1,
    hour,
  };
}

/** Qué pasadas de emparejamiento toca ejecutar ahora (hora peninsular). */
export function getDueScheduleRunKinds(reference = new Date()): ScheduleRunKind[] {
  const { weekday, hour } = getMadridScheduleContext(reference);
  const due: ScheduleRunKind[] = [];

  if (
    (weekday === 5 && hour >= WEEKLY_SCHEDULE_CRON_HOUR) ||
    weekday === 6 ||
    weekday === 0
  ) {
    due.push("friday");
  }

  if ((weekday === 6 && hour >= WEEKEND_SCHEDULE_CRON_HOUR) || weekday === 0) {
    due.push("saturday");
  }

  if (weekday === 0 && hour >= WEEKEND_SCHEDULE_CRON_HOUR) {
    due.push("sunday");
  }

  return due;
}

/** Evita repetir la misma pasada varias veces mientras el servidor sigue vivo. */
const executedSlots = new Set<string>();

/**
 * Ejecuta emparejamientos programados si toca (viernes 20:00, sáb/dom 23:00).
 * Se llama al cargar la liga y en segundo plano desde el arranque del servidor.
 */
export async function maybeRunWeeklySchedules(
  reference = new Date()
): Promise<void> {
  if (isMockMode() || isStaticDemo()) return;
  if (!createAdminClient()) return;

  const weekStart = getCronScheduleWeekStart(reference);
  const due = getDueScheduleRunKinds(reference);
  if (due.length === 0) return;

  const pending = due.filter((kind) => !executedSlots.has(`${weekStart}:${kind}`));
  if (pending.length === 0) return;

  await ensureWeeklySchedule(weekStart);

  for (const kind of pending) {
    executedSlots.add(`${weekStart}:${kind}`);
  }
}

const TICK_MS = 15 * 60 * 1000;

/** Comprueba los horarios programados cada 15 minutos mientras el proceso del servidor sigue activo. */
export function startScheduleTicker(): void {
  void maybeRunWeeklySchedules();
  setInterval(() => {
    void maybeRunWeeklySchedules();
  }, TICK_MS);
}
