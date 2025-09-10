"use client"

import { trpc } from "@/lib/trpc/client"
import { EscrowDetail } from "@/app/(dashboard)/dashboard/escrow/[id]/escrow-detail"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import EscrowCompleteEmptyState from "./EmptyEscrow"

export function EscrowDetailClient({ id }: { id: string }) {
  const utils = trpc.useUtils()
  const router = useRouter()
const { data: session } = useSession()
const currentUserId = session?.user?.id
  const getQuery = trpc.escrow.getById.useQuery(
    { id },
    {
      staleTime: 30_000,
      refetchOnMount: false,
      retry: (failureCount, error) => {
        const code = (error as any)?.data?.code
        if (code === "FORBIDDEN" || code === "UNAUTHORIZED") return false
        return failureCount < 2
      },
    }
  )

  const [showMinimalAccept, setShowMinimalAccept] = useState(false)

  const accept = trpc.escrow.acceptInvitation.useMutation({
    onSuccess: async () => {
      // ✅ reset fallback UI
      setShowMinimalAccept(false)

      // ✅ refresh queries
      await Promise.all([
        utils.escrow.getById.invalidate({ id }),
        utils.escrow.listMine.invalidate(),
      ])

      // ✅ also force refetch immediately
      getQuery.refetch()

      // (optional) hard revalidate the page
      router.refresh()
    },
  })

  // Detect if escrow is forbidden → fallback UI
  useEffect(() => {
    const code = (getQuery.error as any)?.data?.code
    if (getQuery.isError && (code === "FORBIDDEN" || code === "UNAUTHORIZED")) {
      setShowMinimalAccept(true)
    }
  }, [getQuery.isError, getQuery.error])

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
  if (getQuery.isError) return <div>Unable to load escrow.</div>
if (!getQuery.data) return <div>Unable to load escrow.</div>

  const escrow = getQuery.data as any
const isCreator = escrow.creatorId === currentUserId
const isBuyer = escrow.buyerId === currentUserId
const isSeller = escrow.sellerId === currentUserId
const isParticipant = isCreator || isBuyer || isSeller

// Escrow is complete once both buyer and seller are present
const isComplete = Boolean(escrow.buyerId && escrow.sellerId)

// ❌ if escrow is complete and current user is not part of it → show empty state
if (isComplete && !isParticipant) {
  return <EscrowCompleteEmptyState />
}


// Decide what role to display
const displayRole = isCreator
  ? escrow.role
  : escrow.role === "BUYER"
    ? "SELLER"
    : "BUYER"

const needsJoin =
  !isParticipant &&
  !isComplete &&
  escrow.invitationStatus === "PENDING"
      

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

      <EscrowDetail escrow={escrow} displayRole={displayRole} isCreator={isCreator} />
    </div>
  )
}

