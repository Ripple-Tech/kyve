// app/(dashboard)/dashboard/page.tsx
import { getUserEscrows } from "@/actions/get-user-escrow";
import { EscrowGrid } from "@/app/(dashboard)/dashboard/escrow-grid";
import { DashboardPage } from "@/components/dashboard-page";
import { useSession } from "next-auth/react";

export default async function Page() {
 const { data: session, status } = useSession();
  // Check for session and redirect if unauthorized
  if (!session) {
    return ;
  }

  // Fetch the user's escrows
  const escrows = await getUserEscrows(session.user.id);

  // Render the dashboard page with fetched data
  return (
    <DashboardPage title="Your Escrows">
      <EscrowGrid initialEscrows={escrows} />
    </DashboardPage>
  );
}