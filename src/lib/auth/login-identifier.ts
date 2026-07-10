import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizePlayerName,
  validatePlayerName,
} from "@/lib/validation/player-name";

export function isEmailLoginIdentifier(value: string): boolean {
  return value.includes("@");
}

export async function resolveLoginEmail(
  identifier: string
): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (isEmailLoginIdentifier(trimmed)) {
    return trimmed;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const nameCheck = validatePlayerName(sanitizePlayerName(trimmed));
  if (!nameCheck.ok) return null;

  const { data: profile } = await admin
    .from("users")
    .select("auth_user_id")
    .ilike("nombre", nameCheck.value)
    .maybeSingle();

  if (!profile?.auth_user_id) return null;

  const { data: authData, error } = await admin.auth.admin.getUserById(
    profile.auth_user_id
  );

  if (error || !authData.user?.email) return null;

  return authData.user.email;
}

export async function isNombreDisponible(
  nombre: string,
  excludeUserId?: string
): Promise<boolean> {
  const nameCheck = validatePlayerName(nombre);
  if (!nameCheck.ok) return false;

  const admin = createAdminClient();
  if (!admin) return false;

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .ilike("nombre", nameCheck.value)
    .maybeSingle();

  if (!existing) return true;
  return excludeUserId !== undefined && existing.id === excludeUserId;
}

export function isUniqueNombreViolation(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return error.code === "23505" || /users_nombre_unique_ci/i.test(error.message ?? "");
}
