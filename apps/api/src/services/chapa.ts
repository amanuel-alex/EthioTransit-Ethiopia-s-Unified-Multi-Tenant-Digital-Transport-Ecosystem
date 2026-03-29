import { getChapaEnv } from "@ethiotransit/config";
import type { ChapaInitializeDto } from "@ethiotransit/shared";

type ChapaInitResponse = {
  message?: string;
  data?: { checkout_url?: string; tx_ref?: string };
  status?: string;
};

export async function initiateChapa(
  dto: ChapaInitializeDto,
): Promise<
  | { ok: true; data: { checkoutUrl: string; txRef: string } }
  | { ok: false; status: number; code: string; message: string }
> {
  const env = getChapaEnv();
  if (!env) {
    return {
      ok: false,
      status: 503,
      code: "chapa_not_configured",
      message: "Set CHAPA_SECRET_KEY (and optional CHAPA_BASE_URL)",
    };
  }

  const payload = {
    amount: dto.amount,
    currency: dto.currency,
    email: dto.email,
    first_name: dto.first_name ?? "Customer",
    last_name: dto.last_name ?? "EthioTransit",
    tx_ref: dto.tx_ref,
    callback_url: dto.callback_url ?? env.callbackUrl,
    return_url: dto.return_url ?? env.returnUrl,
    customization: dto.customization ?? {
      title: "EthioTransit",
      description: "Transport payment",
    },
  };

  try {
    const base = env.baseUrl.replace(/\/$/, "");
    const url = `${base}/transaction/initialize`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as ChapaInitResponse;
    const checkoutUrl = json.data?.checkout_url;
    if (!res.ok || !checkoutUrl) {
      return {
        ok: false,
        status: 502,
        code: "chapa_init_failed",
        message: json.message ?? "Chapa initialize failed",
      };
    }
    return {
      ok: true,
      data: {
        checkoutUrl,
        txRef: json.data?.tx_ref ?? dto.tx_ref,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return {
      ok: false,
      status: 502,
      code: "chapa_error",
      message,
    };
  }
}
