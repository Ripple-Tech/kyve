import { NextResponse } from "next/server";
import crypto from "crypto";

// ENV VARS (use exactly as provided)
const OPaySecret = process.env.OPAY_SECRET_KEY || "";   // e.g., OPAYPRV1757...
const OPayPublicKey = process.env.OPAY_PUBLIC_KEY || ""; // e.g., OPAYPUB1757...
const OPayMerchantId = process.env.OPAY_MERCHANT_ID || ""; // e.g., 256625091223939

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const OPayBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.opaycheckout.com"
    : "https://sandboxapi.opaycheckout.com";

// HMAC helper
function hmacSha512Hex(data: string, secret: string) {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex");
}

type CreatePaymentPayload = {
  country: string;
  reference: string;
  amount: { currency: string; total: number }; // major units
  callbackUrl: string;
  returnUrl: string;
  cancelUrl: string;
  product: { name: string; description: string };
  userInfo: { userName: string; userMobile: string; userEmail: string };
  userClientIP: string;
  expireAt: number; // minutes
  payMethod: string;
  walletAccount?: string;
};

export async function POST(req: Request) {
  try {
    // Basic checks
    if (!OPaySecret || !OPayPublicKey || !OPayMerchantId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing OPay credentials",
          needed: {
            hasSecret: Boolean(OPaySecret),
            hasPublicKey: Boolean(OPayPublicKey),
            hasMerchantId: Boolean(OPayMerchantId),
          },
        },
        { status: 500 }
      );
    }

    const client = await req.json().catch(() => ({}));
    const amount = Number(client?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, message: "Invalid amount" }, { status: 400 });
    }

    // Build payload
    const payload: CreatePaymentPayload = {
      country: "NG",
      reference: `DEP_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      amount: {
        currency: "NGN",
        total: Math.round((amount + Number.EPSILON) * 100) / 100, // major units, 2dp
      },
      callbackUrl: `${APP_URL}/api/opay/webhook`,
      returnUrl: `${APP_URL}/payment/success`,
      cancelUrl: `${APP_URL}/payment/cancel`,
      product: { name: "Wallet Deposit", description: "Deposit into wallet" },
      userInfo: {
        userName: "Customer",
        userMobile: "08000000000",
        userEmail: "customer@example.com",
      },
      userClientIP: "127.0.0.1",
      expireAt: 30,
      payMethod: "MWALLET",
      walletAccount: "08060122245",
    };

    const url = `${OPayBaseUrl}/api/v1/international/payment/create`;
    const rawBody = JSON.stringify(payload);

    // Auth headers
    const timestamp = Date.now().toString(); // unix millis
    const nonce = crypto.randomBytes(12).toString("hex");

    // Signature = HMAC_SHA512(rawBody + timestamp + nonce, SECRET)
    const stringToSign = rawBody + timestamp + nonce;
    const signature = hmacSha512Hex(stringToSign, OPaySecret);

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      Authorization: `Bearer ${OPayPublicKey}`,
      MerchantId: OPayMerchantId,
      Timestamp: timestamp,
      Nonce: nonce,
      Signature: signature,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: rawBody,
    });

    const text = await resp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawResponse: text };
    }

    // Success code for OPay is usually "00000"
    if (resp.ok && data && data.code === "00000") {
      return NextResponse.json({
        ok: true,
        reference: payload.reference,
        orderNo: data?.data?.orderNo,
        status: data?.data?.status,
        data: data.data,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "OPay request failed",
        httpStatus: resp.status,
        opayCode: data?.code,
        opayMessage: data?.message,
        data,
      },
      { status: resp.status || 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: "Server error", error: err?.message || String(err) },
      { status: 500 }
    );
  }
}