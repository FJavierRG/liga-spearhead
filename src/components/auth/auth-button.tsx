"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/database";

import { apiFetch, apiPath } from "@/lib/api-client";
import { isMockMode, isStaticDemo } from "@/lib/config";

interface AuthButtonProps {
  profile?: User | null;
}

export function AuthButton({ profile }: AuthButtonProps) {
  const router = useRouter();

  async function signOut() {
    if (isMockMode() || isStaticDemo()) {
      await apiFetch("/api/mock/auth", { method: "DELETE" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push(apiPath("/login"));
    router.refresh();
  }

  if (profile) {
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

  if (isMockMode() || isStaticDemo()) return null;

  const supabase = createClient();

  async function signInWith(provider: "google" | "discord") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button size="sm" onClick={() => signInWith("google")}>
        Google
      </Button>
      <Button size="sm" variant="outline" onClick={() => signInWith("discord")}>
        Discord
      </Button>
    </div>
  );
}
