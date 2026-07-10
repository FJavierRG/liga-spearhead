import { NextResponse } from "next/server";
import { resolveLoginEmail } from "@/lib/auth/login-identifier";
import { createClient } from "@/lib/supabase/server";

const INVALID_CREDENTIALS = "Email, nick o contraseña incorrectos.";

export async function POST(request: Request) {
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
