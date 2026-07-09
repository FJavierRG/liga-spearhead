import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getCurrentProfile } from "@/lib/data/queries";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { saveMockAvailabilityBatch } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";
import { getWeekDates } from "@/lib/league/week";
import type { TimeSlot } from "@/types/database";

interface SlotInput {
  fecha: string;
  franja: TimeSlot;
  disponible: boolean;
}

export async function PUT(request: Request) {
  const { jugador_id, week_start, slots } = (await request.json()) as {
    jugador_id: string;
    week_start: string;
    slots: SlotInput[];
  };

  if (isMockMode()) {
    const userId = await getMockSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (jugador_id !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const weekDates = getWeekDates(new Date(week_start + "T00:00:00"), 0);
    saveMockAvailabilityBatch(jugador_id, week_start, weekDates, slots);
    return NextResponse.json({ ok: true });
  }

  // Producción: validar sesión y autoría.
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (profile.id !== jugador_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  // Upsert de todos los slots de la semana de una vez.
  const upsertRows = slots.map((s) => ({
    jugador_id,
    fecha: s.fecha,
    franja: s.franja,
    disponible: s.disponible,
  }));

  const { error } = await supabase
    .from("availability")
    .upsert(upsertRows, { onConflict: "jugador_id,fecha,franja" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
