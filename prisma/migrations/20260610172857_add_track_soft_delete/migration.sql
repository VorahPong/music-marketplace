-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Track_isPublished_idx" ON "Track"("isPublished");

-- CreateIndex
CREATE INDEX "Track_deletedAt_idx" ON "Track"("deletedAt");
