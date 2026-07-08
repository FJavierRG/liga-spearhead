"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { getClientSessionUserId } from "@/lib/client-demo/session";
import { getMockUserById } from "@/lib/mock/store";
import { appPath } from "@/lib/api-client";
import type { User } from "@/types/database";

export function StaticDemoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function syncProfile() {
      const userId = getClientSessionUserId();
      if (!userId) {
        router.replace(appPath("/login"));
        return;
      }
      setProfile(getMockUserById(userId) ?? null);
      setReady(true);
    }

    syncProfile();
    window.addEventListener("liga-demo-update", syncProfile);
    return () => window.removeEventListener("liga-demo-update", syncProfile);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Cargando demo…
      </div>
    );
  }

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto w-full px-4 py-6">{children}</main>
    </>
  );
}
