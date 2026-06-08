-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SELLER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
