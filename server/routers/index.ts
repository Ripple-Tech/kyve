import { router } from "../trpc/trpc"
import { escrowRouter } from "./escrow"

export const appRouter = router({
  escrow: escrowRouter,
})

export type AppRouter = typeof appRouter