import { NextResponse } from "next/server";
import crypto from "crypto";

const OPaySecret = process.env.OPAY_SECRET_KEY || "";
const OPayMerchantId = process.env.OPAY_MERCHANT_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

const OPayBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.opaycheckout.com"
    : "https://sandboxapi.opaycheckout.com";

function assertEnv() {
  const missing: string[] = [];
  if (!OPaySecret) missing.push("OPAY_SECRET_KEY");
  if (!OPayMerchantId) missing.push("OPAY_MERCHANT_ID");
  if (!APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length) throw new Error(`Missing env(s): ${missing.join(", ")}`);
}

function hmacSha512(rawBody: string, secret: string) {
  return crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
}

type CreatePaymentPayload = {
  country: "NG";
  reference: string;
  amount: { currency: "NGN"; total: number };
  callbackUrl?: string;
  product: { name: string; description: string };
  productList?: Array<{
    productId?: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    imageUrl?: string;
  }>;
  userInfo?: {
    userName: string;
    userMobile: string; // MSISDN; can be +234... or local 0XXXXXXXXXX
    userEmail: string;
  };
  userClientIP?: string;
  expireAt?: number;
  payMethod: "MWALLET" | "QR";
  walletAccount?: string; // required for MWALLET (payer's wallet phone number)
};

function normalizeNgMsisdn(input: string): string {
  // Accept +234XXXXXXXXXX or 234XXXXXXXXXX or 0XXXXXXXXXX and return local 0XXXXXXXXXX
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    return "0" + digits.slice(3);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits;
  }
  return input; // leave as-is; OPay may accept MSISDN format for some tenants
}

function isLikelyNgLocalMobile(input: string): boolean {
  return /^0\d{10}$/.test(input);
}

export async function POST(req: Request) {
  try {
    assertEnv();

    // Expected JSON body examples:
    // - MWALLET: { amount: 500, payMethod: "MWALLET", walletAccount: "08012345678", userName?, userEmail?, userMobile? }
    // - QR:      { amount: 500, payMethod: "QR" }
    const client = await req.json().catch(() => ({} as any));
    const amount = Number(client?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const payMethod: CreatePaymentPayload["payMethod"] =
      client?.payMethod === "QR" ? "QR" : "MWALLET";

    // Nigeria defaults
    const country: CreatePaymentPayload["country"] = "NG";
    const currency: CreatePaymentPayload["amount"]["currency"] = "NGN";

    let walletAccount: string | undefined =
      payMethod === "MWALLET" ? client?.walletAccount || "08060122245" : undefined;

    if (payMethod === "MWALLET") {
      if (!walletAccount) {
        return NextResponse.json(
          { message: "walletAccount (payer's wallet phone number) is required for MWALLET" },
          { status: 400 }
        );
      }
      walletAccount = normalizeNgMsisdn(walletAccount);
      // Most NG integrations expect local 0XXXXXXXXXX; adjust if your OPay tenant requires +234 format.
      if (!isLikelyNgLocalMobile(walletAccount)) {
        return NextResponse.json(
          { message: "walletAccount must be a Nigerian mobile in local format, e.g., 08012345678" },
          { status: 400 }
        );
      }
    }

    const reference = client?.reference?.toString() || `DEP_${Date.now()}`;
    const callbackUrl = `${APP_URL.replace(/\/$/, "")}/api/opay/webhook`;

    const payload: CreatePaymentPayload = {
      country,
      reference,
      amount: { currency, total: amount },
      callbackUrl,
      product: {
        name: client?.productName || "Wallet Deposit",
        description: client?.productDescription || "Deposit into wallet",
      },
      userInfo: {
        userName: client?.userName || "NG User",
        // Keep a userMobile for your records; not the same as walletAccount necessarily.
        userMobile: normalizeNgMsisdn(String(client?.userMobile || "08000000000")),
        userEmail: client?.userEmail || "customer@email.com",
      },
      userClientIP: client?.userClientIP || "127.0.0.1",
      expireAt: Number.isFinite(client?.expireAt) ? Number(client?.expireAt) : 30,
      payMethod,
      ...(payMethod === "MWALLET" ? { walletAccount } : {}),
    };

    const requestPath = "/api/v1/international/payment/create";
    const url = `${OPayBaseUrl}${requestPath}`;

    const rawBody = JSON.stringify(payload);
    const signature = hmacSha512(rawBody, OPaySecret);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${signature}`,
        MerchantId: OPayMerchantId,
      },
      body: rawBody,
    });

    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    if (resp.ok && data && data.code === "00000") {
      // For QR: data.data.nextAction.actionType === "SCAN_QR_CODE"
      // For MWALLET: status likely PENDING; confirm via webhook at callbackUrl
      return NextResponse.json(
        {
          ok: true,
          reference,
          orderNo: data?.data?.orderNo,
          status: data?.data?.status,
          nextAction: data?.data?.nextAction || null,
          opay: data,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Opay init failed",
        httpStatus: resp.status,
        opay: data ?? text,
        sent: {
          env: process.env.NODE_ENV,
          baseUrl: OPayBaseUrl,
          path: requestPath,
          headers: {
            MerchantId: OPayMerchantId,
            Authorization: "Bearer <HMAC_SHA512(body)>",
          },
          payload,
        },
      },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: "Server error", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}