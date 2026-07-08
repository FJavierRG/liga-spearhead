"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/database";

import { apiFetch } from "@/lib/api-client";
import { isMockMode, isStaticDemo } from "@/lib/config";

export function useReglasPendientes(profile: User) {
  const [pending, setPending] = useState(() =>
    isMockMode() || isStaticDemo() ? true : profile.reglas_pendientes
  );

  useEffect(() => {
    setPending(isMockMode() || isStaticDemo() ? true : profile.reglas_pendientes);
  }, [profile.id, profile.reglas_pendientes]);

  const marcarReglasVistas = useCallback(async () => {
    setPending(false);
    if (isMockMode() || isStaticDemo()) return;

    await apiFetch("/api/profile/reglas-vistas", { method: "POST" });
  }, []);

  return { reglasPendientes: pending, marcarReglasVistas };
}
