// app/api/paystack/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

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

    if (event.event === "charge.success") {
      const reference = event.data.reference

      await db.transaction.update({
        where: { reference },
        data: { status: "SUCCESS" },
      })
    } else if (event.event === "charge.failed") {
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
