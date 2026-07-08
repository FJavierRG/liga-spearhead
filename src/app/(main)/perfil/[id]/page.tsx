import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RedirectPerfilPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (profile?.id === id) redirect("/");
  redirect(`/jugador/${id}`);
}
