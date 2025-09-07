// app/(dashboard)/dashboard/page.tsx
import { getUserEscrows } from "@/actions/get-user-escrow";
import getCurrentUser from "@/actions/getCurrentUser";
import { EscrowGrid } from "@/app/(dashboard)/dashboard/escrow-grid";
import { DashboardPage } from "@/components/dashboard-page";
import { useSession } from "next-auth/react";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch the user's escrows
  const escrows = await getUserEscrows(user.id);

  // Render the dashboard page with fetched data
  return (
    <DashboardPage title="Your Escrows" hideBackButton={true}>
      <EscrowGrid initialEscrows={escrows} />
    </DashboardPage>
  );
}