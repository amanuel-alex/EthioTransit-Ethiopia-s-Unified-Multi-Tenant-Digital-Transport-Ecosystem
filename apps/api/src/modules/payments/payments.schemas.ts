import { z } from "zod";

export const mpesaInitSchema = z.object({
  bookingId: z.string().min(1),
  phoneNumber: z.string().min(5),
});

export const chapaInitSchema = z.object({
  bookingId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
