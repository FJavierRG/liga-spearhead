import { connection } from "next/server";
import { isStaticDemo } from "@/lib/config";
import { StaticDemoShell } from "@/components/demo/static-demo-shell";
import MainLayoutServer from "@/components/layout/main-layout-server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isStaticDemo()) {
    return <StaticDemoShell>{children}</StaticDemoShell>;
  }

  await connection();
  return <MainLayoutServer>{children}</MainLayoutServer>;
}
