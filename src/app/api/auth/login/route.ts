import { NextResponse } from "next/server";
import { resolveLoginEmail } from "@/lib/auth/login-identifier";
import {
  enforceRateLimit,
  RATE_LIMIT_MESSAGE,
} from "@/lib/auth/rate-limit";
import { createClient } from "@/lib/supabase/server";

const INVALID_CREDENTIALS = "Email, nick o contraseña incorrectos.";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(request, "login");
  if (!limit.ok) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  let body: { identifier?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 400 });
  }

  const identifier = body.identifier?.trim() ?? "";
  const password = body.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const email = await resolveLoginEmail(identifier);
  if (!email) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
