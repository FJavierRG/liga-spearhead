import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import {
  cancelMockScheduledMatch,
  saveMockAvailabilityBatch,
} from "@/lib/mock/store";
import { getWeekDates } from "@/lib/league/week";
import type { TimeSlot } from "@/types/database";

export async function PUT(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const userId = await getMockSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { jugador_id, week_start, slots } = await request.json();

  if (jugador_id !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const weekDates = getWeekDates(new Date(week_start + "T00:00:00"), 0);

  saveMockAvailabilityBatch(
    jugador_id,
    week_start,
    weekDates,
    slots as { fecha: string; franja: TimeSlot; disponible: boolean }[]
  );

  return NextResponse.json({ ok: true });
}
