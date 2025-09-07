import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"

type Ctx = Awaited<ReturnType<typeof import("./context").createTRPCContext>>

const t = initTRPC.context<Ctx>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({ ctx })
})