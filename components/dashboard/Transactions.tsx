"use client"

import { JSX, SVGProps } from "react"
import { cn } from "@/lib/utils" // optional helper

type Action = {
  key: string
  label: string
  subtitle?: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  onClick?: () => void
}

const actions: Action[] = [
  { key: "deposit", label: "Deposit", subtitle: "Add funds", icon: DepositIcon },
  { key: "withdraw", label: "Withdraw", subtitle: "Cash out", icon: WithdrawIcon },
  { key: "transfer", label: "Transfer", subtitle: "To wallet/bank", icon: TransferIcon },
  { key: "buy", label: "Buy", subtitle: "Purchase", icon: BuyIcon },
  { key: "sell", label: "Sell", subtitle: "Liquidate", icon: SellIcon },
  { key: "swap", label: "Swap", subtitle: "Exchange", icon: SwapIcon },
]

function CardButton({
  action,
  className,
}: {
  action: Action
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={cn(
        // container
        "relative w-full overflow-hidden rounded-2xl p-5 text-left transition",
        "bg-black border border-amber-700/30 hover:border-amber-500/50",
        "hover:shadow-[0_8px_24px_rgba(251,191,36,0.15)] active:scale-[0.99]"
      )}
    >
      {/* subtle vignette/gradients for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120px_80px_at_80%_20%,rgba(251,191,36,0.08),transparent_60%),radial-gradient(100px_60px_at_20%_80%,rgba(245,158,11,0.08),transparent_60%)]"
      />
      <div className="relative flex items-start gap-4">
        {/* Icon circle */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-400/20">
          <action.icon className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold text-amber-300">
            {action.label}
          </span>
          {action.subtitle ? (
            <span className="text-sm text-amber-200/70">{action.subtitle}</span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

const Transaction = () => {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 px-1">
        <h2 className="text-lg font-semibold text-amber-300">Quick actions</h2>
        <p className="text-sm text-amber-200/70">Manage your funds</p>
      </div>

      {/* Grid: 2 cols on mobile, 3 on md+; bigger cards per your request */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {actions.map((a) => (
          <CardButton key={a.key} action={a} />
        ))}
      </div>
    </div>
  )
}

export default Transaction

/* ------------------ ICONS (amber on black; currentColor = amber) ------------------ */
/* All SVGs use the SVG namespace: http://www.w3.org/2000/svg */

function DepositIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <rect x="3" y="17" width="18" height="4" rx="1.5" />
    </svg>
  )
}

function WithdrawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 21V9" />
      <path d="m17 14-5-5-5 5" />
      <rect x="3" y="3" width="18" height="4" rx="1.5" />
    </svg>
  )
}

function TransferIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {/* rightward */}
      <path d="M4 7h10" />
      <path d="m11 4 3 3-3 3" />
      {/* leftward */}
      <path d="M20 17H10" />
      <path d="m13 20-3-3 3-3" />
    </svg>
  )
}

function BuyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="10" cy="10" r="6" />
      <path d="M14.5 14.5 20 20" />
      <path d="M8 10h4" />
      <path d="M10 8v4" />
    </svg>
  )
}

function SellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M7 12h10" />
      <path d="M7 8h6" />
      <path d="M7 16h4" />
    </svg>
  )
}

function SwapIcon(props: SVGProps<SVGSVGElement>) {
  // Bi-directional curved arrows to suggest swapping
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 7c3-3 9-3 12 0" />
      <path d="M16 7l-3-3" />
      <path d="M16 7l-3 3" />
      <path d="M20 17c-3 3-9 3-12 0" />
      <path d="M8 17l3 3" />
      <path d="M8 17l3-3" />
    </svg>
  )
}