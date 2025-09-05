"use client"

import { useState, useTransition } from "react"
import { EscrowCard } from "./escrow-card"
import { EscrowEmpty } from "./escrow-empty"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { deleteEscrowAction } from "@/actions/delete-escrow"
import { FormError } from "@/components/forms/form-error"
import { LoadingSpinner } from "@/components/loading-spinner"

interface EscrowGridProps {
  initialEscrows: any[]
}

export function EscrowGrid({ initialEscrows }: EscrowGridProps) {
  const [escrows, setEscrows] = useState(initialEscrows)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  if (!escrows || escrows.length === 0) {
    return <EscrowEmpty />
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (!deletingId) return
    startTransition(async () => {
      try {
        await deleteEscrowAction(deletingId)
        setEscrows((prev) => prev.filter((e) => e.id !== deletingId))
        setDeletingId(null)
      } catch (e: any) {
        setError("Unable to delete escrow")
      }
    })
  }

  return (
    <>
      <ul className="grid max-w-6xl grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {escrows.map((escrow) => (
          <EscrowCard key={escrow.id} escrow={escrow} onDelete={handleDelete} />
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