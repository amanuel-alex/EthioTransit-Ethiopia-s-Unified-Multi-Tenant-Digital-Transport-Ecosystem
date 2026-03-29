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
       * Effective tenant for row-level isolation. ADMIN may leave null on admin-only routes.
       * PASSENGER must send x-company-id; COMPANY uses JWT companyId.
       */
      tenantId?: string | null;
      /** Raw body buffer for webhook signature verification (set before JSON parse). */
      rawBody?: Buffer;
    }
  }
}

export {};
