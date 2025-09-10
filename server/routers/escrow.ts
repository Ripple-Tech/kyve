import { router, protectedProcedure } from "../trpc/trpc"
import { EscrowFormSchema } from "@/lib/validators/escrow-form"
import { z } from "zod"
import { TRPCError } from "@trpc/server"

const roleMap = { buyer: "BUYER", seller: "SELLER" } as const
const logisticsMap = { no: "NO", pickup: "PICKUP", delivery: "DELIVERY" } as const

export const escrowRouter = router({
  // Create an escrow; share URL = /escrow/:id after creation
  createEscrow: protectedProcedure
    .input(EscrowFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const amountNumber = Number(input.amount.replaceAll(",", ""))

      // Keep initial role setup as before (creator picks role)
      const creatorIsBuyer = input.role === "buyer"
      const buyerId = creatorIsBuyer ? user!.id : undefined
      const sellerId = creatorIsBuyer ? undefined : user!.id
      const invitedRole = creatorIsBuyer ? "SELLER" : "BUYER" as const

      const escrow = await db.escrow.create({
        data: {
          role: roleMap[input.role],
          category: input.category,
          logistics: logisticsMap[input.logistics],
          amount: amountNumber,
          currency: input.currency as any,
          status: "PENDING",
          creatorId: user!.id,
          buyerId,
          sellerId,
          invitedRole, // informational for now
          invitationStatus: "PENDING",
        },
        select: {
          id: true,
          status: true,
          invitedRole: true,
          buyerId: true,
          sellerId: true,
          creatorId: true,
        },
      })

      // Build share link with id
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
      const shareUrl = `${baseUrl}/escrow/${escrow.id}`

      return { ...escrow, shareUrl }
    }),

  // TEMPORARY permissive accept:
  // - Only restriction: creator cannot accept their own escrow
  // - Any other signed-in user can accept.
  // - Attach them to the first open side (buyer or seller). If both filled, just mark ACCEPTED.
  acceptInvitation: protectedProcedure
    .input(z.object({ escrowId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const escrow = await db.escrow.findUnique({
        where: { id: input.escrowId },
        select: {
          id: true,
          invitedRole: true,
          invitationStatus: true,
          buyerId: true,
          sellerId: true,
          creatorId: true,
        },
      })

      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not found" })

      // The only restriction we keep:
      if (escrow.creatorId === user!.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Creator cannot accept own escrow" })
      }

      // If user already a participant, mark accepted and return
      if (escrow.buyerId === user!.id || escrow.sellerId === user!.id) {
        await db.escrow.update({
          where: { id: input.escrowId },
          data: { invitationStatus: "ACCEPTED" },
        })
        return { success: true, escrowId: escrow.id }
      }

      // Attach user to whichever side is empty; prefer seller if both empty
      const needsBuyer = !escrow.buyerId
      const needsSeller = !escrow.sellerId

      if (needsSeller) {
        await db.escrow.update({
          where: { id: input.escrowId },
          data: {
            sellerId: user!.id,
            invitationStatus: "ACCEPTED",
          },
        })
      } else if (needsBuyer) {
        await db.escrow.update({
          where: { id: input.escrowId },
          data: {
            buyerId: user!.id,
            invitationStatus: "ACCEPTED",
          },
        })
      } else {
        // Both already set; just mark accepted idempotently
        await db.escrow.update({
          where: { id: input.escrowId },
          data: { invitationStatus: "ACCEPTED" },
        })
      }

      return { success: true, escrowId: escrow.id }
    }),

  // Decline invitation (kept)
  declineInvitation: protectedProcedure
    .input(z.object({ escrowId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      await db.escrow.update({
        where: { id: input.escrowId },
        data: { invitationStatus: "DECLINED" },
      })
      return { success: true }
    }),

    // Secure detail access:
// Only creator, buyer, or seller can view the escrow at any time.
// Everyone else (even if logged in) gets FORBIDDEN.
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

    const userId = user!.id
    const isParticipant =
      escrow.creatorId === userId ||
      escrow.buyerId === userId ||
      escrow.sellerId === userId

    if (!isParticipant) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed" })
    }

    return escrow
  }),



    

  // Dashboard list remains: only your own items
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