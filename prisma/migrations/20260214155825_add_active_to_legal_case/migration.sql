-- AlterTable
ALTER TABLE "legal_cases" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "legal_cases_organization_id_active_idx" ON "legal_cases"("organization_id", "active");
