import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { insertMockMatch } from "@/lib/mock/store";
import type { MatchResult } from "@/types/database";

export async function POST(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const userId = await getMockSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { season_id, jugador_a, jugador_b, resultado, fecha } = body as {
    season_id: string;
    jugador_a: string;
    jugador_b: string;
    resultado: MatchResult;
    fecha: string;
  };

  const result = insertMockMatch({
    season_id,
    jugador_a,
    jugador_b,
    resultado,
    fecha,
    created_by: userId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
