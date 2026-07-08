"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiPath, notifyDemoDataChanged } from "@/lib/api-client";
import { isMockMode, isStaticDemo } from "@/lib/config";
import { MOCK_USER_IDS } from "@/lib/mock/seed";

const DEMO_USERS = [
  { id: MOCK_USER_IDS.admin, label: "Carlos" },
  { id: MOCK_USER_IDS.ana, label: "Ana" },
  { id: MOCK_USER_IDS.borja, label: "Borja" },
  { id: MOCK_USER_IDS.diana, label: "Diana" },
  { id: MOCK_USER_IDS.erik, label: "Erik" },
];

interface MockUserSwitcherProps {
  currentUserId?: string;
}

export function MockUserSwitcher({ currentUserId }: MockUserSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const switchingRef = useRef(false);

  if (!(isMockMode() || isStaticDemo()) || !currentUserId) return null;

  function switchUser(userId: string) {
    if (userId === currentUserId || switchingRef.current) return;

    switchingRef.current = true;
    startTransition(async () => {
      try {
        await apiFetch("/api/mock/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        notifyDemoDataChanged();
        router.refresh();
      } finally {
        switchingRef.current = false;
      }
    });
  }

  return (
    <select
      value={currentUserId}
      disabled={isPending}
      onChange={(e) => switchUser(e.target.value)}
      className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 text-xs text-[var(--foreground)]"
      aria-label="Cambiar usuario demo"
    >
      {DEMO_USERS.map((u) => (
        <option key={u.id} value={u.id}>
          {u.label}
        </option>
      ))}
    </select>
  );
}
