import { z } from "zod";
import { OperatorApplicationStatus } from "@prisma/client";

export const submitOperatorApplicationSchema = z.object({
  legalName: z.string().min(2).max(120),
  slug: z.string().min(2).max(48),
  applicantPhone: z.string().min(5).max(20),
  applicantEmail: z.string().email().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const adminOperatorApplicationsQuerySchema = z.object({
  status: z.nativeEnum(OperatorApplicationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminReviewOperatorApplicationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().max(500).optional().nullable(),
  }),
]);
