import { redirect } from "next/navigation";
import { isMockMode } from "@/lib/config";
import { getSessionUser } from "@/lib/data/queries";
import { LoginForm } from "@/components/auth/login-form";
import { MockLoginButton } from "@/components/auth/mock-login-button";
import { CrestIcon } from "@/components/icons/crest-icon";
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
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface-muted)]">
            <CrestIcon className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <CardTitle className="text-xl">Liga Spearhead</CardTitle>
          <CardDescription className="italic">
            Age of Sigmar: Spearhead
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
