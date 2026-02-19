-- AlterTable
ALTER TABLE "lawyers" ADD COLUMN     "password_reset_expires" TIMESTAMP(3),
ADD COLUMN     "password_reset_code" TEXT;
