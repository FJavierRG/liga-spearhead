import { NextResponse } from "next/server";
import { createMatchAction } from "@/lib/data/match-actions";
import type { MatchResult } from "@/types/database";

export async function POST(request: Request) {
  const body = await request.json();
  const { season_id, jugador_a, jugador_b, resultado, fecha } = body as {
    season_id: string;
    jugador_a: string;
    jugador_b: string;
    resultado: MatchResult;
    fecha: string;
  };

  if (!season_id || !jugador_a || !jugador_b || !resultado || !fecha) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const result = await createMatchAction({
    season_id,
    jugador_a,
    jugador_b,
    resultado,
    fecha,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
