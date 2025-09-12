import { NextResponse } from "next/server";
import crypto from "crypto";

const OPaySecret = process.env.OPAY_SECRET_KEY || "";
const OPayMerchantId = process.env.OPAY_MERCHANT_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// Choose base URL by environment
const OPayBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://cashierapi.opayweb.com"
    : "https://sandbox.cashierapi.opayweb.com";

function assertEnv() {
  const missing: string[] = [];
  if (!OPaySecret) missing.push("OPAY_SECRET_KEY");
  if (!OPayMerchantId) missing.push("OPAY_MERCHANT_ID");
  if (!APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length) {
    throw new Error(`Missing env(s): ${missing.join(", ")}`);
  }
}

// Simplified buildAuthorization: HMAC of body only, common for OPay integrations
function buildAuthorization(options: {
  rawBody: string;
  secret: string;
}) {
  const { rawBody, secret } = options;
  const stringToSign = rawBody;
  const signature = crypto.createHmac("sha512", secret).update(stringToSign).digest("hex");
  return { authorization: `Bearer ${OPayMerchantId} ${signature}`, stringToSign };
}

type CreatePaymentPayload = {
  amount: { currency: "NGN"; total: number };
  callbackUrl: string;
  country: "NG";
  expireAt?: number;
  payMethod?: "CARD" | "BANK_TRANSFER" | "QR" | "MWALLET";
  product: { description: string; name: string };
  reference: string;
  userClientIP?: string;
  userInfo?: { userEmail?: string; userMobile?: string; userName?: string };
};

export async function POST(req: Request) {
  try {
    assertEnv();

    const input = await req.json().catch(() => ({}));
    const amount = Number(input?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const requestPath = "/api/v1/international/cashier/create";
    const reference = `DEP_${Date.now()}`;

    const callbackUrl = `${APP_URL.replace(/\/$/, "")}/api/opay/webhook`;

    const payload: CreatePaymentPayload = {
      amount: { currency: "NGN", total: amount },
      callbackUrl,
      country: "NG",
      expireAt: 30,
      payMethod: "MWALLET",
      product: { description: "Deposit into escrow wallet", name: "Wallet Deposit" },
      reference,
      userClientIP: "127.0.0.1",
      userInfo: {
        userEmail: "test@example.com",
        userMobile: "0000000000",
        userName: "Anonymous",
      },
    };

    // Exact JSON string that will be sent and signed
    const rawBody = JSON.stringify(payload);

    const { authorization } = buildAuthorization({
      rawBody,
      secret: OPaySecret,
    });

    const url = `${OPayBaseUrl}${requestPath}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: authorization,
        MerchantId: OPayMerchantId,
      },
      body: rawBody,
    });

    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON
    }

    if (resp.ok && data && data.code === "00000") {
      return NextResponse.json({
        reference,
        paymentUrl: data.data?.cashierUrl || data.data?.link,
        opay: data,
      });
    }

    // If OPay is rejecting due to signature format, surface all info needed to adjust quickly.
    return NextResponse.json(
      {
        message: "Opay init failed",
        opayStatus: resp.status,
        opayRaw: text,
        sent: {
          env: process.env.NODE_ENV,
          baseUrl: OPayBaseUrl,
          path: requestPath,
          headers: {
            MerchantId: OPayMerchantId,
            AuthorizationPrefix: authorization.split(" ")[0], // Bearer
          },
          payload,
        },
      },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Server error",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}