-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'ET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusStation" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusStation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "BusStation_cityId_idx" ON "BusStation"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "BusStation_cityId_name_key" ON "BusStation"("cityId", "name");

-- AddForeignKey
ALTER TABLE "BusStation" ADD CONSTRAINT "BusStation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN "originStationId" TEXT,
ADD COLUMN "destinationStationId" TEXT;

-- CreateIndex
CREATE INDEX "Route_companyId_originStationId_destinationStationId_idx" ON "Route"("companyId", "originStationId", "destinationStationId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_originStationId_fkey" FOREIGN KEY ("originStationId") REFERENCES "BusStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationStationId_fkey" FOREIGN KEY ("destinationStationId") REFERENCES "BusStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
