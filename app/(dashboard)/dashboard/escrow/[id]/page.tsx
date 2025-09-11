import { db } from "@/lib/db"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Hydrate } from "@/components/hydrate-client"
import { QueryClient, dehydrate } from "@tanstack/react-query"
import { EscrowDetailClient } from "./escrow-detail.client"

interface EscrowDetailPageProps {
  // params is async in Next.js 15 dynamic routes
  params: Promise<{ id: string }>
}

async function prefetchEscrow(qc: QueryClient, id: string) {
  const exists = await db.escrow.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!exists) return null

  const escrow = await db.escrow.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (escrow) {
    // Must match the tRPC query key used by trpc.escrow.getById.useQuery({ id })
    // Default @trpc/react-query key: ["escrow.getById", { id }]
    qc.setQueryData(["escrow.getById", { id }], escrow)
  }

  return dehydrate(qc)
}

export default async function EscrowDetailPage({ params }: EscrowDetailPageProps) {
  // IMPORTANT: Await params before using its properties (Next.js 15 async dynamic APIs)
  const awaitedParams = await params
  const id = awaitedParams.id

  const qc = new QueryClient()
  const state = await prefetchEscrow(qc, id)
  if (!state) return null // or notFound()

  return (
    <DashboardPage title="Escrow Details">
      <Hydrate state={state}>
        <EscrowDetailClient id={id} />
      </Hydrate>
    </DashboardPage>
  )
}