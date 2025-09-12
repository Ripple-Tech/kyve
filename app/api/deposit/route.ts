import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import getCurrentUser from "@/actions/getCurrentUser"
import crypto from "crypto"

const OPaySecret = process.env.OPAY_SECRET_KEY!  // ✅ or hardcode here for testing
const OPayMerchantId = process.env.OPAY_MERCHANT_ID!

// Generate OPay signature (HMAC-SHA512) using RAW payload (unsorted)
function generateOpaySignature(
  payload: any,
  secretKey: string,
  requestPath: string,
  httpMethod: string = "POST"
): string {
  const payloadStr = JSON.stringify(payload) // ✅ raw, no sorting
  const stringToSign = `${httpMethod}${requestPath}${payloadStr}`

  console.log("=== OPay Debug ===")
  console.log("Payload:", payloadStr)
  console.log("StringToSign:", stringToSign)

  const hmac = crypto.createHmac("sha512", secretKey)
  hmac.update(stringToSign)
  const signature = hmac.digest("hex")

  console.log("Signature:", signature)
  console.log("==================")

  return signature
}

// Sandbox vs Production
const OPayBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.opaycheckout.com"
    : "https://sandboxapi.opaycheckout.com"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await req.json()
    const reference = `DEP_${user.id}_${Date.now()}`

    // Save transaction as pending in DB
    await db.transaction.create({
      data: {
        userId: user.id,
        amount,
        type: "DEPOSIT",
        reference,
        currency: "NGN",
        status: "PENDING",
      },
    })

    // Build Opay payload
    const payload = {
      amount: {
        currency: "NGN",
        total: amount,
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/opay/webhook`,
      country: "NG",
      expireAt: 30,
      payMethod: "MWALLET",
      product: {
        description: "Deposit into escrow wallet",
        name: "Wallet Deposit",
      },
      reference,
      userClientIP: "127.0.0.1",
      userInfo: {
        userEmail: user.email ?? "test@example.com",
        userMobile: (user as any).phone ?? "0000000000",
        userName: user.name ?? "Anonymous",
      },
    }

    // Generate signature (unsorted)
    const signature = generateOpaySignature(
      payload,
      OPaySecret,
      "/api/v1/international/payment/create",
      "POST"
    )

    // Call Opay API
    const resp = await fetch(
      `${OPayBaseUrl}/api/v1/international/payment/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: signature,
          MerchantId: OPayMerchantId,
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await resp.json()
    console.log("OPAY response:", JSON.stringify(data, null, 2))

    if (!resp.ok || data.code !== "00000") {
      console.error("Opay init error", data)
      return NextResponse.json(
        { message: "Opay init failed", details: data },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentUrl: data.data?.cashierUrl || data.data?.link,
    })
  } catch (error: any) {
    console.error("Deposit API error", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
