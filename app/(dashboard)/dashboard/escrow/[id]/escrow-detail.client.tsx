"use client"

import { trpc } from "@/lib/trpc/client"
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow-detail"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function EscrowDetailClient({ id }: { id: string }) {
  const utils = trpc.useUtils()
  const router = useRouter()

  const getQuery = trpc.escrow.getById.useQuery(
    { id },
    {
      staleTime: 30_000,
      refetchOnMount: false,
      retry: (failureCount, error) => {
        // If server forbids access before acceptance, we don’t want to keep retrying
        // Customize if your error shape differs
        const code = (error as any)?.data?.code
        if (code === "FORBIDDEN" || code === "UNAUTHORIZED") return false
        return failureCount < 2
      },
    }
  )

  const accept = trpc.escrow.acceptInvitation.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.escrow.getById.invalidate({ id }),
        utils.escrow.listMine.invalidate(),
      ])
      router.refresh()
    },
  })

  // Optional: if getById is forbidden for invited user before accept,
  // you can try showing a lightweight accept UI by probing once
  const [showMinimalAccept, setShowMinimalAccept] = useState(false)
  useEffect(() => {
    const code = (getQuery.error as any)?.data?.code
    if (getQuery.isError && (code === "FORBIDDEN" || code === "UNAUTHORIZED")) {
      setShowMinimalAccept(true)
    }
  }, [getQuery.isError, getQuery.error])

  // Minimal accept-only fallback (when getById is forbidden for invitee)
  if (showMinimalAccept) {
    return (
      <div className="max-w-xl mx-auto bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Join Escrow</h2>
        <p className="text-gray-600">
          You have been invited to join this escrow. Accept to proceed.
        </p>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => accept.mutate({ escrowId: id })}
          disabled={accept.isPending}
        >
          {accept.isPending ? "Joining…" : "Accept invitation"}
        </button>
        {accept.isError ? (
          <p className="text-red-600 text-sm">Failed to accept. Please try again.</p>
        ) : null}
      </div>
    )
  }

  if (getQuery.isLoading) return <div>Loading escrow…</div>
  if (getQuery.isError || !getQuery.data) return <div>Unable to load escrow.</div>

  const escrow = getQuery.data as any

  // Determine if current user should see the Accept button (invite still pending and their side not set)
  const needsJoin =
    escrow.invitationStatus === "PENDING" &&
    ((escrow.invitedRole === "BUYER" && !escrow.buyerId) ||
     (escrow.invitedRole === "SELLER" && !escrow.sellerId))

   // const needsJoin =
   // escrow.invitationStatus === "PENDING" &&
  // (!escrow.buyerId || !escrow.sellerId)

  return (
    <div className="space-y-4">
      {needsJoin ? (
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">You have been invited to this escrow</div>
              <div className="text-sm text-gray-600">
                Accept to join and start the conversation with your counterparty.
              </div>
            </div>
            <button
              className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              onClick={() => accept.mutate({ escrowId: id })}
              disabled={accept.isPending}
            >
              {accept.isPending ? "Joining…" : "Accept invitation"}
            </button>
          </div>
          {accept.isError ? (
            <div className="text-red-600 text-sm mt-2">
              Failed to accept. Please try again.
            </div>
          ) : null}
        </div>
      ) : null}

      <EscrowDetail escrow={escrow} />
    </div>
  )
}