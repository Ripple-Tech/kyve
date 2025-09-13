// app/api/flutterwave/initialize/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import getCurrentUser from "@/actions/getCurrentUser"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { amount } = await req.json()
    const reference = `DEP_${uuidv4()}`

    // (1) Create transaction in DB
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        status: "PENDING",
        reference,
        amount,
        currency: "NGN",
      },
    })

    // (2) Call Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: amount,
        currency: "NGN",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        customer: {
          email: user.email,
          name: user.name ?? "Anonymous",
        },
        customizations: {
          title: "Deposit",
          description: "Wallet Funding",
        },
      }),
    })

    const data = await response.json()

    if (!data.status || data.status !== "success") {
      return NextResponse.json(
        { error: "Failed to initialize Flutterwave transaction" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      paymentUrl: data.data.link,
      reference,
    })
  } catch (err) {
    console.error("Flutterwave Init Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
