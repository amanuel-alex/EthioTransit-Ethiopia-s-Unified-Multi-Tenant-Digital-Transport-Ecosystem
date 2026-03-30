-- Optional vehicle photo + display name for passenger-facing UI
ALTER TABLE "Bus" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Bus" ADD COLUMN IF NOT EXISTS "vehicleName" TEXT;
