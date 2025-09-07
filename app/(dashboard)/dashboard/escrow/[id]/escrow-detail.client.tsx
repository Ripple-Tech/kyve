"use client"

import { trpc } from "@/lib/trpc/client"
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow-detail";

export function EscrowDetailClient({ id }: { id: string }) {
  const { data, isLoading, isError } = trpc.escrow.getById.useQuery(
    { id },
    {
      staleTime: 30_000,
      refetchOnMount: false,
    }
  )

  if (isLoading) return <div>Loading escrow…</div>
  if (isError || !data) return <div>Unable to load escrow.</div>

  return <EscrowDetail escrow={data} />
}

