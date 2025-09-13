// app/api/paystack/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    // (1) Verify signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    // Handle successful payment
    if (event.event === "charge.success") {
      const reference = event.data.reference

      const transaction = await db.transaction.findUnique({
        where: { reference },
      })

      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      // (2) Update transaction status
      await db.transaction.update({
        where: { reference },
        data: { status: "SUCCESS" },
      })

      // (3) Update user balance
      const user = await db.user.findUnique({
        where: { id: transaction.userId },
      })

      if (user) {
        const currentBalance = parseFloat(user.balance ?? "0.00")
        const newBalance = currentBalance + transaction.amount

        await db.user.update({
          where: { id: user.id },
          data: { balance: newBalance.toFixed(2) },
        })
      }
      revalidatePath("/dashboard")
    }

    // Handle failed payments
    else if (event.event === "charge.failed") {
      const reference = event.data.reference

      await db.transaction.update({
        where: { reference },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
