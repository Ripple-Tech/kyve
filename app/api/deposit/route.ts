import { NextResponse } from "next/server";
import crypto from "crypto";

const OPaySecret = process.env.OPAY_SECRET_KEY || "";     // OPAYPRV...
const OPayMerchantId = process.env.OPAY_MERCHANT_ID || ""; // e.g. 256625091223939
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const OPayBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.opaycheckout.com"
    : "https://sandboxapi.opaycheckout.com";

function hmacSha512Hex(data: string, secret: string) {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex");
}

type CreatePaymentPayload = {
  country: string;
  reference: string;
  amount: { currency: string; total: number }; // total in minor units (cent)
  callbackUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
  product: { name: string; description: string };
  userInfo: { userName: string; userMobile: string; userEmail: string };
  userClientIP?: string;
  expireAt?: number; // minutes
  payMethod: "MWALLET";
  walletAccount: string;
};

export async function POST(req: Request) {
  try {
    if (!OPaySecret || !OPayMerchantId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing OPay credentials",
          needed: {
            hasSecret: Boolean(OPaySecret),
            hasMerchantId: Boolean(OPayMerchantId),
          },
        },
        { status: 500 }
      );
    }

    const client = await req.json().catch(() => ({} as any));
    const amount = Number(client?.amount); // amount in major units from client (e.g., 400.00)
    const walletAccount = String(client?.walletAccount || "01066668888"); // must be 11-digit for EG; for NG, use valid number
    const currency = String(client?.currency || "NGN"); // Use "EGP" if you are testing EG doc
    const country = String(client?.country || "NG"); // "EG" per doc, or "NG" for Nigeria
    const userMobile = String(client?.userMobile || "08000000000");
    const userEmail = String(client?.userEmail || "customer@example.com");
    const userName = String(client?.userName || "OPay Test Name");

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, message: "Invalid amount" }, { status: 400 });
    }

    // According to doc: amount.total is in cent unit (minor unit)
    const amountInCents = Math.round(amount * 100);

    const payload: CreatePaymentPayload = {
      country, // e.g., "EG" in the doc; make sure it matches the wallet account/currency region
      reference: `DEP_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      amount: {
        currency, // e.g., "EGP" per doc or "NGN" for Nigeria products
        total: amountInCents,
      },
      callbackUrl: `${APP_URL}/api/opay/webhook`,
      returnUrl: `${APP_URL}/payment/success`,
      cancelUrl: `${APP_URL}/payment/cancel`,
      product: {
        name: "Wallet Deposit",
        description: "Deposit into wallet",
      },
      userInfo: {
        userName,
        userMobile,
        userEmail,
      },
      userClientIP: "127.0.0.1",
      expireAt: 30,
      payMethod: "MWALLET",
      walletAccount,
    };

    const url = `${OPayBaseUrl}/api/v1/international/payment/create`;
    // Important: The doc examples sign the exact JSON string (no extra spaces). We’ll stringify once.
    const rawBody = JSON.stringify(payload);

    // Signature = HMAC_SHA512(rawBody, PRIVATE_KEY)
    const signature = hmacSha512Hex(rawBody, OPaySecret);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${signature}`, // per doc
      MerchantId: OPayMerchantId,
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

    // Expect code "00000" on success
    if (resp.ok && data?.code === "00000") {
      // data.data.nextAction may include SCAN_QR_CODE or a QR image/base64
      return NextResponse.json({
        ok: true,
        reference: data?.data?.reference || payload.reference,
        orderNo: data?.data?.orderNo,
        status: data?.data?.status,
        nextAction: data?.data?.nextAction,
        amount: data?.data?.amount,
        data: data?.data,
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