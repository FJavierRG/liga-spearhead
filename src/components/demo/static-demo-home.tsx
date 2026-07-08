"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientSessionUserId } from "@/lib/client-demo/session";
import { getStaticDemoHomeData } from "@/lib/client-demo/handlers";
import { LigaView } from "@/components/liga-view";

export function StaticDemoHome() {
  const [data, setData] = useState<ReturnType<typeof getStaticDemoHomeData>>(null);

  const reload = useCallback(() => {
    const userId = getClientSessionUserId();
    if (!userId) return;
    setData(getStaticDemoHomeData(userId));
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener("liga-demo-update", reload);
    return () => window.removeEventListener("liga-demo-update", reload);
  }, [reload]);

  if (!data) {
    return (
      <p className="text-center text-[var(--muted)]">Sin temporada activa.</p>
    );
  }

  return (
    <LigaView
      profile={data.profile}
      season={data.season}
      standings={data.standings}
      availability={data.availability}
      scheduled={data.scheduled}
      players={data.players}
      matches={data.matches}
    />
  );
}
