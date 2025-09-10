"use client"

import { trpc } from "@/lib/trpc/client"
import { EscrowCard } from "./escrow-card"
import { EscrowEmpty } from "./escrow-empty"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/forms/form-error"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useState, useTransition } from "react"
import { deleteEscrowAction } from "@/actions/delete-escrow"

export function EscrowGridClient() {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const utils = trpc.useUtils()

  const escrowsQuery = trpc.escrow.listMine.useQuery(
    { limit: 20 },
    { staleTime: 30_000 }
  )

  if (escrowsQuery.isLoading) return <div>Loading escrows…</div>
  if (!escrowsQuery.data || escrowsQuery.data.items.length === 0) {
    return <EscrowEmpty />
  }

  const confirmDelete = () => {
    if (!deletingId) return
    startTransition(async () => {
      try {
        await deleteEscrowAction(deletingId)
        await utils.escrow.listMine.invalidate({ limit: 20 }) // 🔁 refresh
        setDeletingId(null)
      } catch (e: any) {
        setError("Unable to delete escrow")
      }
    })
  }

  return (
    <>
      <ul className="grid max-w-6xl grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {escrowsQuery.data.items.map((escrow) => (
          <EscrowCard key={escrow.id} escrow={escrow} onDelete={setDeletingId} />
        ))}
      </ul>

      <Modal
        showModal={!!deletingId}
        setShowModal={() => setDeletingId(null)}
        className="max-w-md p-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Delete Escrow</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this escrow?
            </p>
          </div>

          {error && <FormError message={error} />}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <LoadingSpinner /> : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
