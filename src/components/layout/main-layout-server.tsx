import { redirect } from "next/navigation";
import { MainContentGate } from "@/components/layout/main-content-gate";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentProfile, getSessionUser } from "@/lib/data/queries";

export default async function MainLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();

  return (
    <>
      <Navbar profile={profile} />
      <MainContentGate key={user.id}>
        <main className="mx-auto w-full px-4 py-6">{children}</main>
      </MainContentGate>
    </>
  );
}
