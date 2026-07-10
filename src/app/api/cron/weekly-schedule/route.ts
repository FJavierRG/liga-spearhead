import { NextResponse } from "next/server";
import { maybeRunWeeklySchedules } from "@/lib/league/schedule-runner";

/**
 * Endpoint opcional para forzar emparejamientos (p. ej. pruebas manuales).
 * En producción el servidor los lanza solo; no hace falta configurar nada en Railway.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await maybeRunWeeklySchedules();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
