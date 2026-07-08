/** Utilidades de semana (lunes–domingo, fechas locales). */

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export function isSundayNight(reference = new Date()): boolean {
  return reference.getDay() === 0 && reference.getHours() >= 20;
}

export function getScheduleTargetWeekStart(reference = new Date()): string {
  if (isSundayNight(reference)) {
    return getWeekStartIso(reference, 1);
  }
  return getWeekStartIso(reference, 0);
}
