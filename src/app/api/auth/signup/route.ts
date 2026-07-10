import { NextResponse } from "next/server";
import { isNombreDisponible } from "@/lib/auth/login-identifier";
import {
  enforceRateLimit,
  RATE_LIMIT_MESSAGE,
} from "@/lib/auth/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { validatePlayerName } from "@/lib/validation/player-name";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(request, "signup");
  if (!limit.ok) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let body: { email?: string; password?: string; nombre?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  const nameCheck = validatePlayerName(body.nombre ?? "");
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.error }, { status: 400 });
  }

  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: "Email y contraseña (mín. 6 caracteres) son obligatorios." },
      { status: 400 }
    );
  }

  const available = await isNombreDisponible(nameCheck.value);
  if (!available) {
    return NextResponse.json({ error: "Ese nick ya está cogido." }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: nameCheck.value },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already been registered")
        ? "Ya existe una cuenta con ese email."
        : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation: !data.session,
  });
}
