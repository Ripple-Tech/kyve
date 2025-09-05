"use server"

import { db } from "@/lib/db"
import getCurrentUser from "@/actions/getCurrentUser"

export async function getUserEscrows(id: string) {
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.id) {
    throw new Error("Unauthorized")
  }

  const escrows = await db.escrow.findMany({
    where: {
      OR: [
        { creatorId: sessionUser.id },
        { buyerId: sessionUser.id },
        { sellerId: sessionUser.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  return escrows
}