-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('client_request', 'lawyer_upload');

-- AlterTable
ALTER TABLE "document_requests" ADD COLUMN "source" "DocumentSource" NOT NULL DEFAULT 'client_request';
