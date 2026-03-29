/**
 * Reads payment-related env vars. Never log secrets.
 * Adjust variable names to match your Safaricom / Chapa dashboards.
 */
export interface MpesaEnv {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  /** e.g. https://sandbox.safaricom.co.ke or production base */
  baseUrl: string;
  callbackUrl: string;
}

export interface ChapaEnv {
  secretKey: string;
  publicKey?: string;
  baseUrl: string;
  callbackUrl?: string;
  returnUrl?: string;
}

function readEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v : undefined;
}

export function getMpesaEnv(): MpesaEnv | null {
  const consumerKey = readEnv("MPESA_CONSUMER_KEY");
  const consumerSecret = readEnv("MPESA_CONSUMER_SECRET");
  const shortcode = readEnv("MPESA_SHORTCODE");
  const passkey = readEnv("MPESA_PASSKEY");
  const baseUrl =
    readEnv("MPESA_BASE_URL") ?? "https://sandbox.safaricom.co.ke";
  const callbackUrl = readEnv("MPESA_CALLBACK_URL");
  if (
    !consumerKey ||
    !consumerSecret ||
    !shortcode ||
    !passkey ||
    !callbackUrl
  ) {
    return null;
  }
  return {
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    baseUrl,
    callbackUrl,
  };
}

export function getChapaEnv(): ChapaEnv | null {
  const secretKey = readEnv("CHAPA_SECRET_KEY");
  const baseUrl = readEnv("CHAPA_BASE_URL") ?? "https://api.chapa.co/v1";
  if (!secretKey) return null;
  return {
    secretKey,
    publicKey: readEnv("CHAPA_PUBLIC_KEY"),
    baseUrl,
    callbackUrl: readEnv("CHAPA_CALLBACK_URL"),
    returnUrl: readEnv("CHAPA_RETURN_URL"),
  };
}
