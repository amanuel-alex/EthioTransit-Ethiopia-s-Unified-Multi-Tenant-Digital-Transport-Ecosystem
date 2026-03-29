import { Prisma } from "@prisma/client";
import { PLATFORM_FEE_RATE } from "../config/constants.js";

/**
 * Split gross amount into platform fee (7%) and company earning (93%).
 * Uses decimal math to avoid float drift.
 */
export function splitCommission(
  gross: Prisma.Decimal | number | string,
): { platformFee: Prisma.Decimal; companyEarning: Prisma.Decimal } {
  const total = new Prisma.Decimal(gross);
  const platformFee = total.mul(PLATFORM_FEE_RATE).toDecimalPlaces(2);
  const companyEarning = total.sub(platformFee).toDecimalPlaces(2);
  return { platformFee, companyEarning };
}
