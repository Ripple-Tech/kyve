import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Hydrate } from "@/components/hydrate-client"
import { QueryClient, dehydrate } from "@tanstack/react-query"
import { db } from "@/lib/db"
import getCurrentUser from "@/actions/getCurrentUser"
import { EscrowGridClient } from "@/app/(dashboard)/dashboard/escrow-grid.client"

async function prefetchEscrows(qc: QueryClient, userId: string) {
  const escrows = await db.escrow.findMany({
    where: {
      OR: [{ creatorId: userId }, { buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  })

  // 🔑 The query key must match your TRPC call: ["escrow.listMine", { limit }]
  qc.setQueryData(["escrow.listMine", { limit: 20 }], {
    items: escrows,
    nextCursor: null,
  })

  return dehydrate(qc)
}

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) return null

  const qc = new QueryClient()
  const state = await prefetchEscrows(qc, user.id)

  return (
    <DashboardPage title="Your Escrows" hideBackButton showCreate isDashboard={true}>
      <Hydrate state={state}>
        <EscrowGridClient />
      </Hydrate>
    </DashboardPage>
  )
}
