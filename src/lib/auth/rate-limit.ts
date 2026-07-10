import { createAdminClient } from "@/lib/supabase/admin";

export type AuthRateLimitAction = "signup" | "login" | "nombre-disponible";

const LIMITS: Record<AuthRateLimitAction, { max: number; windowMs: number }> = {
  signup: { max: 3, windowMs: 60 * 60 * 1000 },
  login: { max: 20, windowMs: 15 * 60 * 1000 },
  "nombre-disponible": { max: 60, windowMs: 10 * 60 * 1000 },
};

const PRUNE_OLDER_THAN_MS = 24 * 60 * 60 * 1000;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env.RATE_LIMIT_SALT ?? "liga-spearhead";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export async function enforceRateLimit(
  request: Request,
  action: AuthRateLimitAction
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: true };
  }

  const { max, windowMs } = LIMITS[action];
  const ipHash = await hashIp(getClientIp(request));
  const windowStart = new Date(Date.now() - windowMs).toISOString();
  const pruneBefore = new Date(Date.now() - PRUNE_OLDER_THAN_MS).toISOString();

  await admin
    .from("auth_rate_limit_events")
    .delete()
    .lt("created_at", pruneBefore);

  const { count, error: countError } = await admin
    .from("auth_rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (countError) {
    return { ok: true };
  }

  if ((count ?? 0) >= max) {
    const { data: oldest } = await admin
      .from("auth_rate_limit_events")
      .select("created_at")
      .eq("action", action)
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const retryAfterSec = oldest?.created_at
      ? Math.max(
          1,
          Math.ceil(
            (new Date(oldest.created_at).getTime() + windowMs - Date.now()) /
              1000
          )
        )
      : 60;

    return { ok: false, retryAfterSec };
  }

  const { error: insertError } = await admin
    .from("auth_rate_limit_events")
    .insert({ ip_hash: ipHash, action });

  if (insertError) {
    return { ok: true };
  }

  return { ok: true };
}

export const RATE_LIMIT_MESSAGE =
  "Demasiados intentos desde tu conexión. Espera un poco e inténtalo de nuevo.";
