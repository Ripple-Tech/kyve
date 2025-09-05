import { db } from "@/lib/db"
import { DashboardPage } from "@/components/dashboard-page"
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow-detail"
import { useSession } from "next-auth/react"

interface EscrowDetailPageProps {
  params: { id: string }
}

export default async function EscrowDetailPage({ params }: { params: Promise<EscrowDetailPageProps> }) {
  const awaitedParam = await params
 const { data: session, status } = useSession();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return ;
 
  
  const escrow = await db.escrow.findUnique({
    where: { id: awaitedParam.params.id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (!escrow) return;

  if (
    escrow.creatorId !== sessionUser.id &&
    escrow.buyerId !== sessionUser.id &&
    escrow.sellerId !== sessionUser.id
  ) {
    return ;
  }

  return (
    <DashboardPage title="Escrow Details">
      <EscrowDetail escrow={escrow} />
    </DashboardPage>
  )
}