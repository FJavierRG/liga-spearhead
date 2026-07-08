import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { completeMockScheduledMatch } from "@/lib/mock/store";
import type { MatchResult } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const userId = await getMockSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { resultado } = (await request.json()) as { resultado: MatchResult };

  if (!resultado) {
    return NextResponse.json({ error: "Falta el resultado" }, { status: 400 });
  }

  const result = completeMockScheduledMatch(id, userId, resultado);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
