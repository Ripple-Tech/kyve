import { router, protectedProcedure } from "../trpc/trpc"
import { EscrowFormSchema } from "@/lib/validators/escrow-form"
import { z } from "zod"
import { TRPCError } from "@trpc/server"

const roleMap = { buyer: "BUYER", seller: "SELLER" } as const
const logisticsMap = { no: "NO", pickup: "PICKUP", delivery: "DELIVERY" } as const

export const escrowRouter = router({
  // Create an escrow (unchanged)
  createEscrow: protectedProcedure
    .input(EscrowFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const amountNumber = Number(input.amount.replaceAll(",", ""))
      const shareToken = crypto.randomUUID()
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
      const shareUrl = `${baseUrl}/escrow/${shareToken}`

      let buyerId: string | undefined
      let sellerId: string | undefined
      if (input.role === "buyer") buyerId = user!.id
      else sellerId = user!.id

      const escrow = await db.escrow.create({
        data: {
          role: roleMap[input.role],
          category: input.category,
          logistics: logisticsMap[input.logistics],
          amount: amountNumber,
          currency: input.currency as any,
          status: "PENDING",
          shareToken,
          shareUrl,
          creatorId: user!.id,
          buyerId,
          sellerId,
        },
        select: {
          id: true,
          shareToken: true,
          shareUrl: true,
          status: true,
        },
      })

      return escrow
    }),

  // Get one escrow by id (for the detail page)
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx

      const escrow = await db.escrow.findUnique({
        where: { id: input.id },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
      })

      if (!escrow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not found" })
      }

      // Optional authorization check: only participants or creator can view
      if (
        escrow.creatorId !== user!.id &&
        escrow.buyerId !== user!.id &&
        escrow.sellerId !== user!.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to view this escrow" })
      }

      return escrow
    }),

  // Optional: list escrows for the current user (for dashboard)
  listMine: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().nullish(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const limit = input?.limit ?? 20
      const cursor = input?.cursor ?? undefined

      const items = await db.escrow.findMany({
        where: {
          OR: [
            { creatorId: user!.id },
            { buyerId: user!.id },
            { sellerId: user!.id },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor } } : {}),
        include: {
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
        },
      })

      let nextCursor: string | undefined = undefined
      if (items.length > limit) {
        const next = items.pop()!
        nextCursor = next.id
      }

      return { items, nextCursor }
    }),
})