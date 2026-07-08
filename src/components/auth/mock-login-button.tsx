"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, apiPath, notifyDemoDataChanged } from "@/lib/api-client";
import { MOCK_USER_IDS } from "@/lib/mock/seed";

export function MockLoginButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function enterDemo() {
    startTransition(async () => {
      await apiFetch("/api/mock/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: MOCK_USER_IDS.ana }),
      });
      notifyDemoDataChanged();
      router.push(apiPath("/"));
      router.refresh();
    });
  }

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={enterDemo}
    >
      {isPending ? "Entrando..." : "Entrar"}
    </Button>
  );
}
