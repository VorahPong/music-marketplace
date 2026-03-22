/*
  Warnings:

  - The values [SAMPLE,STEM,VOCAL] on the enum `TrackType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrackType_new" AS ENUM ('SONG', 'BEAT', 'LOOP', 'DRUMKIT');
ALTER TABLE "Track" ALTER COLUMN "trackType" DROP DEFAULT;
ALTER TABLE "Track" ALTER COLUMN "trackType" TYPE "TrackType_new" USING ("trackType"::text::"TrackType_new");
ALTER TYPE "TrackType" RENAME TO "TrackType_old";
ALTER TYPE "TrackType_new" RENAME TO "TrackType";
DROP TYPE "TrackType_old";
ALTER TABLE "Track" ALTER COLUMN "trackType" SET DEFAULT 'SONG';
COMMIT;

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_trackId_key" ON "Like"("userId", "trackId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
