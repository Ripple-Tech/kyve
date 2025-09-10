import { format } from "date-fns"

interface EscrowDetailProps {
  escrow: any
  displayRole: string
}

export function EscrowDetail({ escrow, displayRole }: EscrowDetailProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold">Escrow Details</h2>
      <p className="text-gray-500">ID: {escrow.id}</p>

      <div className="divide-y divide-gray-200">
        <div className="py-2 flex justify-between">
          <span className="font-medium">Category</span>
          <span>{escrow.category}</span>
        </div>
        <div className="py-2 flex justify-between">
          <span className="font-medium">Role</span>
          <span>{displayRole}</span>
        </div>
        <div className="py-2 flex justify-between">
          <span className="font-medium">Amount</span>
          <span>{escrow.amount} {escrow.currency}</span>
        </div>
        <div className="py-2 flex justify-between">
          <span className="font-medium">Status</span>
          <span>{escrow.status}</span>
        </div>
        <div className="py-2 flex justify-between">
          <span className="font-medium">Created</span>
          <span>{format(new Date(escrow.createdAt), "PPpp")}</span>
        </div>
      </div>
    </div>
  )
}