-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Track_createdAt_idx" ON "Track"("createdAt");

-- CreateIndex
CREATE INDEX "Track_ownerId_idx" ON "Track"("ownerId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
