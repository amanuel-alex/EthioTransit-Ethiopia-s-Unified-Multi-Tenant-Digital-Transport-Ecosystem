export const CHECKOUT_STORAGE_KEY = "ethiotransit_checkout_draft";

export type CheckoutDraft = {
  bookingId: string;
  totalAmount: string;
  currency: string;
  scheduleId: string;
  seatNumbers: number[];
  routeLabel: string;
  departsAt: string;
  companyName?: string;
};

export function saveCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
}

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
}
