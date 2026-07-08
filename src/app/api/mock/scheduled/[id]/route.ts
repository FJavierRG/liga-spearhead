import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { cancelMockScheduledMatch } from "@/lib/mock/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const userId = await getMockSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const ok = cancelMockScheduledMatch(id, userId);

  if (!ok) {
    return NextResponse.json({ error: "No se pudo cancelar" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
