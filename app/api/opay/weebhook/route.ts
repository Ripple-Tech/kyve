import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reference, status } = body

    // Find deposit record
    const tx = await db.transaction.findUnique({ where: { reference } })
    if (!tx) return NextResponse.json({ ok: false }, { status: 404 })

    if (status === "SUCCESS") {
      // Mark as success
      await db.transaction.update({
        where: { reference },
        data: { status: "SUCCESS" },
      })

      // Update user's wallet balance
      // Fetch current balance, convert to number, increment, and update
      const user = await db.user.findUnique({ where: { id: tx.userId } })
      const currentBalance = Number(user?.balance ?? 0)
      const newBalance = currentBalance + tx.amount
      await db.user.update({
        where: { id: tx.userId },
        data: {
          balance: newBalance.toString(),
        },
      })
    } else {
      await db.transaction.update({
        where: { reference },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}