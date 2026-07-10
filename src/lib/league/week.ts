/** Utilidades de semana (lunes–domingo, fechas en Europe/Madrid). */

const SCHEDULE_TIMEZONE = "Europe/Madrid";

/** Hora peninsular del cron principal (viernes). */
export const WEEKLY_SCHEDULE_CRON_HOUR = 20;

/** Hora peninsular de los repasos de fin de semana (sábado y domingo). */
export const WEEKEND_SCHEDULE_CRON_HOUR = 23;

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

/** Tras el cron del viernes (o sábado/domingo): mostrar la semana siguiente. */
export function isAfterFridayScheduleCron(reference = new Date()): boolean {
  const { weekday, hour } = getMadridScheduleContext(reference);
  if (weekday === 6 || weekday === 0) return true;
  if (weekday === 5) return hour >= WEEKLY_SCHEDULE_CRON_HOUR;
  return false;
}

/** Desplazamiento de semana para partidos programados visibles en la app. */
export function getScheduleWeekOffset(reference = new Date()): number {
  return isAfterFridayScheduleCron(reference) ? 1 : 0;
}

export function getWeekMonday(reference = new Date(), weekOffset = 0): Date {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  return d;
}

export function getWeekDates(reference = new Date(), weekOffset = 0): string[] {
  const monday = getWeekMonday(reference, weekOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalDateStr(d);
  });
}

export function getWeekStartIso(reference = new Date(), weekOffset = 0): string {
  return toLocalDateStr(getWeekMonday(reference, weekOffset));
}

export function formatWeekRange(weekOffset = 0, reference = new Date()): string {
  const dates = getWeekDates(reference, weekOffset);
  const start = new Date(dates[0] + "T12:00:00");
  const end = new Date(dates[6] + "T12:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${fmt(start)} a ${fmt(end)}`;
}

/** Semana cuyos emparejamientos debe ver el jugador al cargar la app. */
export function getScheduleTargetWeekStart(reference = new Date()): string {
  return getWeekStartIso(reference, getScheduleWeekOffset(reference));
}

/** Semana que genera el cron del viernes (siempre la siguiente). */
export function getCronScheduleWeekStart(reference = new Date()): string {
  return getWeekStartIso(reference, 1);
}
