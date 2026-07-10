import type { TimeSlot } from "@/types/database";
import { ACTIVE_TIME_SLOTS } from "@/types/database";

const TIMEZONE = "Europe/Madrid";

/** Ventanas orientativas por franja (hora local, Sevilla). */
const SLOT_HOURS: Record<TimeSlot, { start: [number, number]; end: [number, number] }> = {
  manana: { start: [10, 0], end: [13, 0] },
  tarde: { start: [17, 0], end: [20, 0] },
  noche: { start: [20, 0], end: [23, 0] },
};

function slotLabel(franja: TimeSlot): string {
  return ACTIVE_TIME_SLOTS.find((s) => s.key === franja)?.label ?? franja;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYYMMDDTHHmmss para enlaces de Google Calendar (hora local). */
function formatLocalDateTime(date: string, hour: number, minute: number): string {
  const [y, m, d] = date.split("-");
  return `${y}${m}${d}T${pad(hour)}${pad(minute)}00`;
}

function formatIcsUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface MatchCalendarEventInput {
  matchId: string;
  fecha: string;
  franja: TimeSlot;
  playerName: string;
  opponentName: string;
}

export function buildMatchCalendarEvent(input: MatchCalendarEventInput) {
  const { start, end } = SLOT_HOURS[input.franja];
  const startStr = formatLocalDateTime(input.fecha, start[0], start[1]);
  const endStr = formatLocalDateTime(input.fecha, end[0], end[1]);

  const title = `Liga Spearhead vs ${input.opponentName}`;
  const details = [
    `Partido de liga asignado automáticamente.`,
    `Jugador: ${input.playerName}`,
    `Rival: ${input.opponentName}`,
    `Franja: ${slotLabel(input.franja)}`,
  ].join("\n");

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", title);
  googleUrl.searchParams.set("dates", `${startStr}/${endStr}`);
  googleUrl.searchParams.set("details", details);
  googleUrl.searchParams.set("ctz", TIMEZONE);

  const uid = `liga-spearhead-${input.matchId}@liga-spearhead`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Liga Spearhead//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtcStamp(new Date())}`,
    `DTSTART;TZID=${TIMEZONE}:${startStr}`,
    `DTEND;TZID=${TIMEZONE}:${endStr}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    googleUrl: googleUrl.toString(),
    icsContent: ics,
    icsFilename: `spearhead-${input.fecha}-${input.franja}.ics`,
  };
}

export function openMatchInGoogleCalendar(input: MatchCalendarEventInput): void {
  const { googleUrl } = buildMatchCalendarEvent(input);
  window.open(googleUrl, "_blank", "noopener,noreferrer");
}

export function downloadMatchIcs(input: MatchCalendarEventInput): void {
  const { icsContent, icsFilename } = buildMatchCalendarEvent(input);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = icsFilename;
  anchor.click();
  URL.revokeObjectURL(url);
}
