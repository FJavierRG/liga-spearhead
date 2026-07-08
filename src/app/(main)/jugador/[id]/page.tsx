import { isStaticDemo } from "@/lib/config";
import { MOCK_USER_IDS } from "@/lib/mock/seed";
import { StaticDemoJugador } from "@/components/demo/static-demo-jugador";
import { JugadorPageServer } from "@/components/demo/jugador-page-server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_STATIC_DEMO !== "true") {
    return [];
  }

  return Object.values(MOCK_USER_IDS).map((id) => ({ id }));
}

export default async function JugadorPage({ params }: PageProps) {
  const { id } = await params;

  if (isStaticDemo()) {
    return <StaticDemoJugador playerId={id} />;
  }

  return <JugadorPageServer id={id} />;
}
