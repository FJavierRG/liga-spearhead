"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MockLoginButton } from "@/components/auth/mock-login-button";
import { CrestIcon } from "@/components/icons/crest-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClientSessionUserId } from "@/lib/client-demo/session";
import { apiPath } from "@/lib/api-client";

export function StaticDemoLogin() {
  const router = useRouter();

  useEffect(() => {
    if (getClientSessionUserId()) {
      router.replace(apiPath("/"));
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface-muted)]">
            <CrestIcon className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <CardTitle className="text-xl">Liga Spearhead</CardTitle>
          <CardDescription className="italic">
            Demo · Age of Sigmar: Spearhead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MockLoginButton />
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Datos de prueba en el navegador. No se guarda nada en servidor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
