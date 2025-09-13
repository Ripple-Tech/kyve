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
      console.error("❌ Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log("📩 Incoming Paystack Event:", event)

    // Handle successful payment
    if (event.event === "charge.success") {
      const reference = event.data.reference
      console.log("✅ Charge Success for Reference:", reference)

      const transaction = await db.transaction.findUnique({
        where: { reference },
      })

      if (!transaction) {
        console.error("❌ Transaction not found for reference:", reference)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      console.log("📦 Transaction from DB:", transaction)

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
        console.log("👤 User before update:", user)

        const currentBalance = user.balance ?? 0
        const newBalance = currentBalance + Math.round(transaction.amount * 100) 
        // 👆 store in kobo

        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: { balance: newBalance },
        })

        console.log("💰 User after update:", updatedUser)
      }

      revalidatePath("/dashboard")
    }

    // Handle failed payments
    else if (event.event === "charge.failed") {
      const reference = event.data.reference
      console.log("❌ Charge Failed for Reference:", reference)

      await db.transaction.update({
        where: { reference },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("🚨 Webhook error:", err)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
