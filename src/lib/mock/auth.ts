import { cookies } from "next/headers";

export const MOCK_SESSION_COOKIE = "liga-mock-user";

export async function getMockSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MOCK_SESSION_COOKIE)?.value ?? null;
}

export function mockSessionCookieOptions(userId: string) {
  return {
    name: MOCK_SESSION_COOKIE,
    value: userId,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearMockSessionCookieOptions() {
  return {
    name: MOCK_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
