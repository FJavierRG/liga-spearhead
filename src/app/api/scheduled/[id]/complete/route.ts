import { NextResponse } from "next/server";
import { completeScheduledMatchAction } from "@/lib/data/match-actions";
import type { MatchResult } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { resultado } = (await request.json()) as { resultado: MatchResult };

  if (!resultado) {
    return NextResponse.json({ error: "Falta el resultado" }, { status: 400 });
  }

  const result = await completeScheduledMatchAction(id, resultado);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
