import { redirect } from "next/navigation";
import { isMockMode } from "@/lib/config";
import { getSessionUser } from "@/lib/data/queries";
import { LoginForm } from "@/components/auth/login-form";
import { MockLoginButton } from "@/components/auth/mock-login-button";
import { LigaLogo } from "@/components/icons/liga-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function LoginPageServer({
  authError = false,
}: {
  authError?: boolean;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const mockMode = isMockMode();

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
          {mockMode ? (
            <MockLoginButton />
          ) : (
            <LoginForm authError={authError} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
