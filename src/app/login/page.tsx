import { isStaticDemo } from "@/lib/config";
import { StaticDemoLogin } from "@/components/demo/static-demo-login";
import { LoginPageServer } from "@/components/demo/login-page-server";

export default function LoginPage() {
  if (isStaticDemo()) {
    return <StaticDemoLogin />;
  }

  return <LoginPageServer />;
}
