import { NextResponse } from "next/server";
import { ensureWeeklySchedule } from "@/lib/data/scheduled-queries";
import { getScheduleTargetWeekStart } from "@/lib/league/week";

/**
 * Cron job: lunes 01:00 hora española (00:00 UTC invierno / necesita ajuste en verano).
 * Genera los emparejamientos de la semana que acaba de empezar.
 *
 * Vercel inyecta automáticamente Authorization: Bearer $CRON_SECRET.
 * En local se puede llamar con ese mismo header para probar.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const weekStart = getScheduleTargetWeekStart();

  try {
    await ensureWeeklySchedule(weekStart);
    return NextResponse.json({ ok: true, weekStart });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
