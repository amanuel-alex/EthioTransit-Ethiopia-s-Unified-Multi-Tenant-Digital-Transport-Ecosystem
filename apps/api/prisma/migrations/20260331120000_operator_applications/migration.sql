-- CreateEnum
CREATE TYPE "OperatorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OperatorApplication" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "applicantEmail" TEXT,
    "notes" TEXT,
    "status" "OperatorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "companyId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorApplication_companyId_key" ON "OperatorApplication"("companyId");

-- CreateIndex
CREATE INDEX "OperatorApplication_status_createdAt_idx" ON "OperatorApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OperatorApplication_slug_idx" ON "OperatorApplication"("slug");

-- AddForeignKey
ALTER TABLE "OperatorApplication" ADD CONSTRAINT "OperatorApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorApplication" ADD CONSTRAINT "OperatorApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
