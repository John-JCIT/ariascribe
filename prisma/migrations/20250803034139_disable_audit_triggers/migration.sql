-- Temporarily disable audit triggers for testing

DROP TRIGGER IF EXISTS audit_tenants_trigger ON tenants;
DROP TRIGGER IF EXISTS audit_patients_trigger ON patients;
DROP TRIGGER IF EXISTS audit_consultations_trigger ON consultations;
DROP TRIGGER IF EXISTS audit_clinical_notes_trigger ON clinical_notes;
DROP TRIGGER IF EXISTS audit_exports_trigger ON exports;