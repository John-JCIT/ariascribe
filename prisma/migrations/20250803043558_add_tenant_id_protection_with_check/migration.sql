-- Add WITH CHECK clauses to existing update policies to prevent tenantId modifications
-- This ensures data integrity by preventing tenant_id changes on existing records

-- Drop and recreate patient update policy with WITH CHECK clause
DROP POLICY IF EXISTS patient_tenant_isolation_update ON patients;
CREATE POLICY patient_tenant_isolation_update ON patients
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Drop and recreate consultation update policy with WITH CHECK clause
DROP POLICY IF EXISTS consultation_tenant_isolation_update ON consultations;
CREATE POLICY consultation_tenant_isolation_update ON consultations
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Drop and recreate clinical_notes update policy with WITH CHECK clause
DROP POLICY IF EXISTS clinical_note_tenant_isolation_update ON clinical_notes;
CREATE POLICY clinical_note_tenant_isolation_update ON clinical_notes
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Drop and recreate exports update policy with WITH CHECK clause
DROP POLICY IF EXISTS export_tenant_isolation_update ON exports;
CREATE POLICY export_tenant_isolation_update ON exports
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id())
  WITH CHECK ("tenantId" = get_current_tenant_id());