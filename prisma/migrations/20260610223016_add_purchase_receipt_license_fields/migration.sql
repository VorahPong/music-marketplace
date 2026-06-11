/*
  Warnings:

  - A unique constraint covering the columns `[receiptNumber]` on the table `TrackPurchase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('STANDARD', 'CUSTOM');

-- AlterTable
ALTER TABLE "TrackPurchase" ADD COLUMN     "licenseType" "LicenseType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "receiptNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrackPurchase_receiptNumber_key" ON "TrackPurchase"("receiptNumber");

-- CreateIndex
CREATE INDEX "TrackPurchase_receiptNumber_idx" ON "TrackPurchase"("receiptNumber");

-- CreateIndex
CREATE INDEX "TrackPurchase_paypalOrderId_idx" ON "TrackPurchase"("paypalOrderId");

-- CreateIndex
CREATE INDEX "TrackPurchase_paypalCaptureId_idx" ON "TrackPurchase"("paypalCaptureId");

-- CreateIndex
CREATE INDEX "TrackPurchase_createdAt_idx" ON "TrackPurchase"("createdAt");
