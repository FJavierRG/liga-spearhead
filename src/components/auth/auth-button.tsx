"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/database";
import { apiFetch, apiPath, appPath } from "@/lib/api-client";
import { isMockMode, isStaticDemo } from "@/lib/config";

interface AuthButtonProps {
  profile?: User | null;
}

export function AuthButton({ profile }: AuthButtonProps) {
  const router = useRouter();

  if (!profile) return null;

  async function signOut() {
    if (isMockMode() || isStaticDemo()) {
      await apiFetch("/api/mock/auth", { method: "DELETE" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    if (isStaticDemo()) {
      window.location.assign(apiPath("/login"));
      return;
    }
    router.push(appPath("/login"));
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-neutral-600 sm:inline">
        {profile.nombre}
      </span>
      <Button variant="outline" size="sm" onClick={signOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
