import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(5).max(20),
  code: z.string().min(4).max(10).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
