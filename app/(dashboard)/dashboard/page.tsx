// app/(dashboard)/dashboard/page.js
import { getUserEscrows } from "@/actions/get-user-escrow"
import { EscrowGrid } from "@/app/(dashboard)/dashboard/escrow-grid"
import { DashboardPage } from "@/components/dashboard-page"
import { getSession } from "next-auth/react"

export default async function Page() {
  const session = await getSession()
  
  if (!session) {
    // Handle unauthorized access
    return { redirect: { destination: '/login', permanent: false } }
  }

  const escrows = await getUserEscrows(session.user.id) // pass user ID if needed

  return (
    <DashboardPage title="Your Escrows">
      <EscrowGrid initialEscrows={escrows} />
    </DashboardPage>
  )
}