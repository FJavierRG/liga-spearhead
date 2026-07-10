"use client";

import { useEffect } from "react";
import { MockLoginButton } from "@/components/auth/mock-login-button";
import { LigaLogo } from "@/components/icons/liga-logo";
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
  useEffect(() => {
    if (getClientSessionUserId()) {
      window.location.replace(apiPath("/"));
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <LigaLogo size="login" className="mx-auto mb-3" priority />
          <CardTitle className="text-lg text-[var(--foreground)]">
            Age of Sigmar: Spearhead
          </CardTitle>
          <CardDescription className="text-xl uppercase tracking-wider text-[var(--foreground)]">
            Liga Sevilla
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
