import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import {
  clearMockSessionCookieOptions,
  mockSessionCookieOptions,
} from "@/lib/mock/auth";
import { getMockUserById } from "@/lib/mock/store";

export async function POST(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const { userId } = await request.json();
  if (!userId || !getMockUserById(userId)) {
    return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(mockSessionCookieOptions(userId));
  return response;
}

export async function DELETE() {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearMockSessionCookieOptions());
  return response;
}
