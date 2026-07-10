import { NextResponse } from "next/server";
import { isNombreDisponible } from "@/lib/auth/login-identifier";
import { validatePlayerName } from "@/lib/validation/player-name";

export async function POST(request: Request) {
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
