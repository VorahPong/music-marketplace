/*
  Warnings:

  - You are about to drop the column `priceInPoints` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `pointsPaid` on the `TrackPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - Added the required column `amountUsd` to the `TrackPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Track" DROP COLUMN "priceInPoints",
ADD COLUMN     "priceUsd" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "TrackPurchase" DROP COLUMN "pointsPaid",
ADD COLUMN     "amountUsd" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "points";
