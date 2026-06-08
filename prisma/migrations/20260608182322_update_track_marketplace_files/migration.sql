/*
  Warnings:

  - You are about to drop the column `fileType` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `priceUsd` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `amountUsd` on the `TrackPurchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,trackId,version]` on the table `TrackPurchase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `previewMp3Url` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountCents` to the `TrackPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchaseVersion" AS ENUM ('REGULAR', 'FULL');

-- DropIndex
DROP INDEX "TrackPurchase_userId_trackId_key";

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "fileType",
DROP COLUMN "fileUrl",
DROP COLUMN "priceUsd",
ADD COLUMN     "bpm" INTEGER,
ADD COLUMN     "fullPriceCents" INTEGER,
ADD COLUMN     "fullZipKey" TEXT,
ADD COLUMN     "musicalKey" TEXT,
ADD COLUMN     "previewFileType" TEXT,
ADD COLUMN     "previewMp3Url" TEXT NOT NULL,
ADD COLUMN     "regularPriceCents" INTEGER,
ADD COLUMN     "regularWavKey" TEXT,
ADD COLUMN     "timeSignature" TEXT;

-- AlterTable
ALTER TABLE "TrackPurchase" DROP COLUMN "amountUsd",
ADD COLUMN     "amountCents" INTEGER NOT NULL,
ADD COLUMN     "version" "PurchaseVersion" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE UNIQUE INDEX "TrackPurchase_userId_trackId_version_key" ON "TrackPurchase"("userId", "trackId", "version");
