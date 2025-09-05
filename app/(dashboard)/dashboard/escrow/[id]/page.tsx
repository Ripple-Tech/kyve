import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { DashboardPage } from "@/components/dashboard-page"
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow-detail"
import getCurrentUser from "@/actions/getCurrentUser"

interface EscrowDetailPageProps {
  params: { id: string }
}

export default async function EscrowDetailPage({ params }: EscrowDetailPageProps) {
  const awaitedParam = await params
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.id) return notFound()
 
  
  const escrow = await db.escrow.findUnique({
    where: { id: awaitedParam.id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (!escrow) return notFound()

  if (
    escrow.creatorId !== sessionUser.id &&
    escrow.buyerId !== sessionUser.id &&
    escrow.sellerId !== sessionUser.id
  ) {
    return notFound()
  }

  return (
    <DashboardPage title="Escrow Details">
      <EscrowDetail escrow={escrow} />
    </DashboardPage>
  )
}