import { z } from "zod";

export const createBookingSchema = z.object({
  scheduleId: z.string().min(1),
  seats: z.array(z.number().int().positive()).min(1),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
});
