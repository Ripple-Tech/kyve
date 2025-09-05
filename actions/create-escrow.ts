"use server"

import { db } from "@/lib/db"
import { EscrowFormSchema } from "@/lib/validators/escrow-form"
import getCurrentUser from "@/actions/getCurrentUser" 

export async function createEscrowAction(raw: unknown) {
  // 1) Validate payload
  const input = EscrowFormSchema.parse(raw)

  // 2) Get current user from NextAuth (server-side)
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.id) {
    throw new Error("Unauthorized")
  }

  // 3) Optional: Verify the user exists in DB (good for hard guarantees)
  const appUser = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true },
  })
  if (!appUser) {
    throw new Error("Unauthorized")
  }

  // 4) Map UI enums to Prisma enums
  const roleMap = {
    buyer: "BUYER",
    seller: "SELLER",
  } as const

  const logisticsMap = {
    no: "NO",
    pickup: "PICKUP",
    delivery: "DELIVERY",
  } as const

  const amountNumber = Number(input.amount.replaceAll(",", ""))

  // 5) Generate a share token and URL
  const shareToken = crypto.randomUUID()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/escrow/${shareToken}`

  // 6) Prefill buyer/seller based on role
  let buyerId: string | undefined
  let sellerId: string | undefined
  if (input.role === "buyer") {
    buyerId = appUser.id
  } else {
    sellerId = appUser.id
  }

  // 7) Create escrow
  const escrow = await db.escrow.create({
    data: {
      role: roleMap[input.role],
      category: input.category,
      logistics: logisticsMap[input.logistics],
      amount: amountNumber,
      currency: input.currency as any, // "NGN" | "USD" | "GHS"
      status: "PENDING",

      shareToken,
      shareUrl,

      creatorId: appUser.id,
      buyerId,
      sellerId,
    },
    select: {
      id: true,
      shareToken: true,
      shareUrl: true,
      status: true,
      role: true,
      category: true,
      amount: true,
      currency: true,
    },
  })

  return { success: true, escrow }
}