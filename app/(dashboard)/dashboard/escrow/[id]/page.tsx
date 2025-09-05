import { db } from "@/lib/db";
import { DashboardPage } from "@/components/dashboard-page";
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow-detail";

interface EscrowDetailPageProps {
  params: Promise<{ id: string }>; // Change to Promise type
}

export default async function EscrowDetailPage({ params }: EscrowDetailPageProps) {
  const awaitedParams = await params; // Await params to access its properties
  
  const escrow = await db.escrow.findUnique({
    where: { id: awaitedParams.id }, // Now you can safely access awaitedParams.id
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  if (!escrow) {
    // Handle the case where escrow is not found (e.g., return a not found page)
    return null; // or return a 404 page
  }

  return (
    <DashboardPage title="Escrow Details">
      <EscrowDetail escrow={escrow} />
    </DashboardPage>
  );
}