import { redirect } from "next/navigation";
import { isStaticDemo } from "@/lib/config";
import { StaticDemoShell } from "@/components/demo/static-demo-shell";
import MainLayoutServer from "@/components/layout/main-layout-server";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isStaticDemo()) {
    return <StaticDemoShell>{children}</StaticDemoShell>;
  }

  return <MainLayoutServer>{children}</MainLayoutServer>;
}
