import { NextResponse } from "next/server";
import { cancelScheduledMatchAction } from "@/lib/data/match-actions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await cancelScheduledMatchAction(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
