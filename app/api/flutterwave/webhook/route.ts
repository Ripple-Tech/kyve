// app/api/flutterwave/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("verif-hash") // Flutterwave sends this

    // (1) Verify signature
    if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
      console.error("❌ Invalid signature", { signature })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log("🔔 Flutterwave Webhook Event:", event)

    const reference = event.data?.tx_ref
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    // (2) Find transaction
    const transaction = await db.transaction.findUnique({
      where: { reference },
    })

    if (!transaction) {
      console.error("❌ Transaction not found for ref:", reference)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // (3) Handle success
    if (event.data.status === "successful") {
      await db.transaction.update({
        where: { reference },
        data: { status: "SUCCESS" },
      })

      const user = await db.user.findUnique({ where: { id: transaction.userId } })
      if (user) {
        const newBalance = user.balance + Math.floor(transaction.amount)
        await db.user.update({
          where: { id: user.id },
          data: { balance: newBalance },
        })
        console.log(
          `✅ Balance updated for user ${user.email}: ${user.balance} → ${newBalance}`
        )
      }

      revalidatePath("/dashboard")
    }

    // (4) Handle failed
    else if (event.data.status === "failed") {
      await db.transaction.update({
        where: { reference },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("Webhook Error:", err)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
