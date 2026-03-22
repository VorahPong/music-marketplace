-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('SONG', 'BEAT', 'LOOP', 'SAMPLE', 'STEM', 'VOCAL', 'DRUMKIT');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "isForSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceInPoints" INTEGER,
ADD COLUMN     "trackType" "TrackType" NOT NULL DEFAULT 'SONG';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;
