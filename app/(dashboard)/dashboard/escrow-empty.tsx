import HeroForm from "@/components/heroform";

export function EscrowEmpty() {
  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-24">
      <p className="text-lg font-medium">No escrows yet</p>
      <p className="text-sm mb-10">Create your first escrow to get started.</p>
      <HeroForm inDashboard/>
    </div>
  )
}