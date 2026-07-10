import { NextResponse } from "next/server";
import { isNombreDisponible } from "@/lib/auth/login-identifier";
import {
  enforceRateLimit,
  RATE_LIMIT_MESSAGE,
} from "@/lib/auth/rate-limit";
import { validatePlayerName } from "@/lib/validation/player-name";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(request, "nombre-disponible");
  if (!limit.ok) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let body: { nombre?: string; excludeUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nombre no válido." }, { status: 400 });
  }

  const nameCheck = validatePlayerName(body.nombre ?? "");
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.error }, { status: 400 });
  }

  const available = await isNombreDisponible(
    nameCheck.value,
    body.excludeUserId
  );

  return NextResponse.json({ available });
}
