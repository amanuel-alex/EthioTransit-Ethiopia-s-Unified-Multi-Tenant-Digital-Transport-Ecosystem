-- Enforce one row per (provider, externalRef) when reconciling webhooks (NULL externalRef allowed multiple times per PG rules).
CREATE UNIQUE INDEX "Payment_provider_externalRef_key" ON "Payment"("provider", "externalRef");

-- At most one pending payment per booking (idempotent initiate / no double STK).
CREATE UNIQUE INDEX "Payment_one_pending_per_booking_idx" ON "Payment" ("bookingId") WHERE "status" = 'PENDING';
