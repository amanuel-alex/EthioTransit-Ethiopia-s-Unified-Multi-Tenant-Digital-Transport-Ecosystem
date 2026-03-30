import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Set by auth middleware after verifying access JWT. */
      user?: {
        id: string;
        role: UserRole;
        companyId: string | null;
      };
      /**
       * Effective tenant for row-level isolation. COMPANY uses JWT companyId.
       * PASSENGER may omit x-company-id for cross-operator route search; other routes
       * resolve company from schedule/route/booking when the header is absent.
       */
      tenantId?: string | null;
      /** Set by validateQuery middleware. */
      validatedQuery?: unknown;
      /** Raw body buffer for webhook signature verification (set before JSON parse). */
      rawBody?: Buffer;
    }
  }
}

export {};
