-- CreateEnum
CREATE TYPE "OperatingMode" AS ENUM ('STANDALONE', 'EHR_INTEGRATED');

-- CreateEnum
CREATE TYPE "PatientSource" AS ENUM ('ARIA_SCRIBE', 'EHR', 'IMPORTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('READY', 'RECORDING', 'PROCESSING', 'REVIEW', 'COMPLETE', 'ERROR');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('PROGRESS', 'SOAP', 'ASSESSMENT', 'PLAN', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'FINAL', 'AMENDED', 'SIGNED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'DOCX', 'TXT');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operatingMode" "OperatingMode" NOT NULL DEFAULT 'STANDALONE',
    "isDedicatedDb" BOOLEAN NOT NULL DEFAULT false,
    "dbConnectionUri" TEXT,
    "adminCanChangeMode" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB NOT NULL DEFAULT '{"manualExport": true, "patientManagement": true, "ehrSync": false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ehrPatientId" TEXT,
    "source" "PatientSource" NOT NULL DEFAULT 'ARIA_SCRIBE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "lastConsultation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "mode" "OperatingMode" NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'READY',
    "recordingStartTime" TIMESTAMP(3),
    "recordingEndTime" TIMESTAMP(3),
    "audioFileUrl" TEXT,
    "transcriptionText" TEXT,
    "selectedTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "noteType" "NoteType" NOT NULL DEFAULT 'PROGRESS',
    "template" TEXT,
    "status" "NoteStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedFromAudio" BOOLEAN NOT NULL DEFAULT false,
    "transcriptionId" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "filePath" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_tenantId_idx" ON "patients"("tenantId");

-- CreateIndex
CREATE INDEX "patients_tenantId_lastName_firstName_idx" ON "patients"("tenantId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "consultations_tenantId_idx" ON "consultations"("tenantId");

-- CreateIndex
CREATE INDEX "consultations_tenantId_patientId_idx" ON "consultations"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "consultations_tenantId_status_idx" ON "consultations"("tenantId", "status");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_idx" ON "clinical_notes"("tenantId");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_patientId_idx" ON "clinical_notes"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_status_idx" ON "clinical_notes"("tenantId", "status");

-- CreateIndex
CREATE INDEX "exports_tenantId_idx" ON "exports"("tenantId");

-- CreateIndex
CREATE INDEX "exports_tenantId_consultationId_idx" ON "exports"("tenantId", "consultationId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
