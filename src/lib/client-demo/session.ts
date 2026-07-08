const SESSION_KEY = "liga-mock-user";

export function getClientSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setClientSessionUserId(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

export function clearClientSessionUserId(): void {
  localStorage.removeItem(SESSION_KEY);
}
