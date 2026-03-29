import { getMpesaEnv } from "@ethiotransit/config";
import { MpesaTransactionType } from "@ethiotransit/shared";
import type { MpesaStkPushDto } from "@ethiotransit/shared";

function sanitizePhone(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  return digits;
}

async function getAccessToken(env: NonNullable<ReturnType<typeof getMpesaEnv>>) {
  const auth = Buffer.from(
    `${env.consumerKey}:${env.consumerSecret}`,
  ).toString("base64");
  const url = new URL("/oauth/v1/generate", env.baseUrl);
  url.searchParams.set("grant_type", "client_credentials");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`mpesa_oauth_failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function stkPassword(shortcode: string, passkey: string, timestamp: string) {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export async function initiateMpesaStk(dto: MpesaStkPushDto): Promise<
  | {
      ok: true;
      data: { checkoutRequestId?: string; merchantRequestId?: string };
    }
  | { ok: false; status: number; code: string; message: string }
> {
  const env = getMpesaEnv();
  if (!env) {
    return {
      ok: false,
      status: 503,
      code: "mpesa_not_configured",
      message:
        "Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL",
    };
  }
  if (!dto.phoneNumber?.trim()) {
    return {
      ok: false,
      status: 400,
      code: "missing_phone",
      message: "phoneNumber is required for M-Pesa",
    };
  }

  try {
    const token = await getAccessToken(env);
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = stkPassword(env.shortcode, env.passkey, timestamp);
    const phone = sanitizePhone(dto.phoneNumber);
    const url = new URL("/mpesa/stkpush/v1/processrequest", env.baseUrl);
    const body = {
      BusinessShortCode: env.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: MpesaTransactionType.CUSTOMER_PAY_BILL_ONLINE,
      Amount: Math.round(dto.amount),
      PartyA: phone,
      PartyB: env.shortcode,
      PhoneNumber: phone,
      CallBackURL: env.callbackUrl,
      AccountReference: dto.accountReference.slice(0, 12),
      TransactionDesc: dto.transactionDesc.slice(0, 13),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      errorCode?: string;
      errorMessage?: string;
      ResponseDescription?: string;
    };

    if (!res.ok || json.errorMessage) {
      return {
        ok: false,
        status: 502,
        code: "mpesa_stk_failed",
        message: json.errorMessage ?? json.ResponseDescription ?? "STK failed",
      };
    }

    return {
      ok: true,
      data: {
        checkoutRequestId: json.CheckoutRequestID,
        merchantRequestId: json.MerchantRequestID,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return {
      ok: false,
      status: 502,
      code: "mpesa_error",
      message,
    };
  }
}

export type ParsedMpesaStkCallback = {
  checkoutRequestId: string;
  merchantRequestId?: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceipt?: string;
};

/** Parse Safaricom STK callback JSON. Invalid shape returns null. */
export function parseMpesaStkCallback(body: unknown): ParsedMpesaStkCallback | null {
  const b = body as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        MerchantRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: { Item?: { Name?: string; Value?: unknown }[] };
      };
    };
  };
  const cb = b?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return null;

  let amount: number | undefined;
  let mpesaReceipt: string | undefined;
  const items = cb.CallbackMetadata?.Item ?? [];
  for (const it of items) {
    if (it.Name === "Amount" && typeof it.Value === "number") amount = it.Value;
    if (it.Name === "MpesaReceiptNumber" && typeof it.Value === "string") {
      mpesaReceipt = it.Value;
    }
  }

  return {
    checkoutRequestId: cb.CheckoutRequestID,
    merchantRequestId: cb.MerchantRequestID,
    resultCode: cb.ResultCode ?? -1,
    resultDesc: cb.ResultDesc ?? "",
    amount,
    mpesaReceipt,
  };
}
