-- CreateEnum
CREATE TYPE "LawyerRole" AS ENUM ('owner', 'admin', 'lawyer');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'pending_approval', 'rejected', 'received');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('low_quality', 'wrong_document', 'incomplete', 'illegible', 'other');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('hearing', 'deadline', 'meeting', 'task', 'other');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "logo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "photo" TEXT,
    "oab" TEXT NOT NULL,
    "specialty" TEXT,
    "role" "LawyerRole" NOT NULL DEFAULT 'lawyer',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "columns" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "key" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_cases" (
    "id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "client" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "order" DOUBLE PRECISION NOT NULL,
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "file_url" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" "RejectionReason",
    "rejection_note" TEXT,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notifications" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "message" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareable_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shareable_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_documents" (
    "link_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "link_documents_pkey" PRIMARY KEY ("link_id","document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_document_key" ON "organizations"("document");

-- CreateIndex
CREATE INDEX "organizations_document_idx" ON "organizations"("document");

-- CreateIndex
CREATE INDEX "organizations_active_idx" ON "organizations"("active");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_email_key" ON "lawyers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_oab_key" ON "lawyers"("oab");

-- CreateIndex
CREATE INDEX "lawyers_organization_id_idx" ON "lawyers"("organization_id");

-- CreateIndex
CREATE INDEX "lawyers_email_idx" ON "lawyers"("email");

-- CreateIndex
CREATE INDEX "lawyers_oab_idx" ON "lawyers"("oab");

-- CreateIndex
CREATE INDEX "lawyers_role_idx" ON "lawyers"("role");

-- CreateIndex
CREATE INDEX "lawyers_active_idx" ON "lawyers"("active");

-- CreateIndex
CREATE INDEX "columns_organization_id_idx" ON "columns"("organization_id");

-- CreateIndex
CREATE INDEX "columns_organization_id_order_idx" ON "columns"("organization_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_number_key" ON "legal_cases"("number");

-- CreateIndex
CREATE INDEX "legal_cases_column_id_idx" ON "legal_cases"("column_id");

-- CreateIndex
CREATE INDEX "legal_cases_assigned_to_idx" ON "legal_cases"("assigned_to");

-- CreateIndex
CREATE INDEX "legal_cases_number_idx" ON "legal_cases"("number");

-- CreateIndex
CREATE INDEX "legal_cases_priority_idx" ON "legal_cases"("priority");

-- CreateIndex
CREATE INDEX "legal_cases_created_by_idx" ON "legal_cases"("created_by");

-- CreateIndex
CREATE INDEX "document_requests_case_id_idx" ON "document_requests"("case_id");

-- CreateIndex
CREATE INDEX "document_requests_status_idx" ON "document_requests"("status");

-- CreateIndex
CREATE INDEX "case_notifications_case_id_idx" ON "case_notifications"("case_id");

-- CreateIndex
CREATE INDEX "case_notifications_lawyer_id_idx" ON "case_notifications"("lawyer_id");

-- CreateIndex
CREATE INDEX "case_notifications_date_idx" ON "case_notifications"("date");

-- CreateIndex
CREATE INDEX "case_notifications_lawyer_id_is_read_idx" ON "case_notifications"("lawyer_id", "is_read");

-- CreateIndex
CREATE INDEX "case_notifications_is_sent_date_idx" ON "case_notifications"("is_sent", "date");

-- CreateIndex
CREATE UNIQUE INDEX "shareable_links_token_key" ON "shareable_links"("token");

-- CreateIndex
CREATE INDEX "shareable_links_token_idx" ON "shareable_links"("token");

-- CreateIndex
CREATE INDEX "shareable_links_case_id_idx" ON "shareable_links"("case_id");

-- CreateIndex
CREATE INDEX "link_documents_link_id_idx" ON "link_documents"("link_id");

-- CreateIndex
CREATE INDEX "link_documents_document_id_idx" ON "link_documents"("document_id");

-- AddForeignKey
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "columns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "lawyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notifications" ADD CONSTRAINT "case_notifications_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notifications" ADD CONSTRAINT "case_notifications_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareable_links" ADD CONSTRAINT "shareable_links_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "legal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareable_links" ADD CONSTRAINT "shareable_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "lawyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_documents" ADD CONSTRAINT "link_documents_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "shareable_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_documents" ADD CONSTRAINT "link_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
