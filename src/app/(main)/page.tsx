import { redirect } from "next/navigation";
import { isStaticDemo } from "@/lib/config";
import { StaticDemoHome } from "@/components/demo/static-demo-home";
import { HomePageServer } from "@/components/demo/home-page-server";

export default function HomePage() {
  if (isStaticDemo()) {
    return <StaticDemoHome />;
  }

  return <HomePageServer />;
}
