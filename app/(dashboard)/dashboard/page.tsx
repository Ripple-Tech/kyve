import { getUserEscrows } from "@/actions/get-user-escrow"
import { EscrowGrid } from "@/app/(dashboard)/dashboard/escrow-grid"
import { DashboardPage } from "@/components/dashboard-page"

export default async function DashboardPageWrapper() {
  const escrows = await getUserEscrows()

  return (
    <DashboardPage title="Your Escrows">
      <EscrowGrid initialEscrows={escrows} />
    </DashboardPage>
  )
}