import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { updateMockUser } from "@/lib/mock/store";

export async function PATCH(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const userId = await getMockSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { nombre, faccion } = await request.json();
  const updated = updateMockUser(userId, {
    nombre,
    faccion: faccion || null,
  });

  if (!updated) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
