import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/config";
import { getMockSessionUserId } from "@/lib/mock/auth";
import { updateMockUser } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (isMockMode()) {
    const userId = await getMockSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const updated = updateMockUser(userId, { reglas_pendientes: false });
    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("users")
    .update({ reglas_pendientes: false })
    .eq("auth_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
