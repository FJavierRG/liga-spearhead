import { isStaticDemo } from "@/lib/config";
import { StaticDemoLogin } from "@/components/demo/static-demo-login";
import { LoginPageServer } from "@/components/demo/login-page-server";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (isStaticDemo()) {
    return <StaticDemoLogin />;
  }

  const { error } = await searchParams;

  return <LoginPageServer authError={error === "auth"} />;
}
