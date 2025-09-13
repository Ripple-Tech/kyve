import { NextResponse } from "next/server"
import crypto from "crypto"

// === OPay sandbox keys ===
const OPAY_SECRET_KEY = "OPAYPRV17576711948060.6147321313103867"
const OPAY_MERCHANT_ID = "256625091223939"

// --- helper: recursively sort object keys ---
function sortObjectRecursively(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObjectRecursively)
  }
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortObjectRecursively(value[key])
        return acc
      }, {})
  }
  return value
}

function canonicalJSONString(obj: any) {
  return JSON.stringify(sortObjectRecursively(obj))
}

function createSignature(payloadString: string) {
  return crypto
    .createHmac("sha512", OPAY_SECRET_KEY)
    .update(payloadString, "utf8")
    .digest("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount } = body

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { message: "Invalid amount" },
        { status: 400 }
      )
    }

    const total = amount * 100 // convert to kobo
    const reference = `DEP_${Date.now()}`

    // Use BankCard + OPay sandbox test card
    const payload = {
      authoriseAmount: { currency: "NGN", total },
      country: "NG",
      manualCapture: false,
      payMethod: "BankCard",
      product: {
        name: "Wallet Deposit",
        description: "User deposit into wallet",
      },
      reference,
      returnUrl: "http://localhost:3000/payment-success",
      callbackUrl: "http://localhost:3000/api/opay/webhook",
      userClientIP: "127.0.0.1",
      userInfo: {
        userId: "user-1",
        userName: "Sandbox User",
        userEmail: "sandbox@example.com",
        userMobile: "+2340000000000",
      },
      bankCard: {
        cardNumber: "5399838383838381", // ✅ OPay sandbox test card
        expiryMonth: "01",
        expiryYear: "39",
        cvv: "539",
      },
    }

    const canonical = canonicalJSONString(payload)
    const signature = createSignature(canonical)

    const res = await fetch(
      "https://sandboxapi.opaycheckout.com/api/v1/international/payment/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${signature}`,
          MerchantId: OPAY_MERCHANT_ID,
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await res.json()

    const paymentUrl = data?.data?.nextAction?.redirectUrl || null

    if (!paymentUrl) {
      return NextResponse.json(
        { message: "Failed to get redirect URL", opay: data },
        { status: 400 }
      )
    }

    return NextResponse.json({ paymentUrl })
  } catch (err: any) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    )
  }
}
