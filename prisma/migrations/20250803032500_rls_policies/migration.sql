-- ============================================================================
-- Row-Level Security (RLS) Policies for Phase 2A Standalone Mode
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to set the current tenant for a session
CREATE OR REPLACE FUNCTION set_tenant(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Set the tenant_id in the current session
  PERFORM set_config('app.tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the current tenant from session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS text AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE RLS ON ALL CLINICAL TABLES
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Users can only see their own tenant
CREATE POLICY tenant_isolation_select ON tenants
  FOR SELECT
  USING (id = get_current_tenant_id());

-- Users can only update their own tenant
CREATE POLICY tenant_isolation_update ON tenants
  FOR UPDATE
  USING (id = get_current_tenant_id());

-- Only allow inserts if the tenant_id matches the session
CREATE POLICY tenant_isolation_insert ON tenants
  FOR INSERT
  WITH CHECK (id = get_current_tenant_id());

-- ============================================================================
-- PATIENTS TABLE POLICIES
-- ============================================================================

-- Users can only see patients from their tenant
CREATE POLICY patient_tenant_isolation_select ON patients
  FOR SELECT
  USING ("tenantId" = get_current_tenant_id());

-- Users can only insert patients for their tenant
CREATE POLICY patient_tenant_isolation_insert ON patients
  FOR INSERT
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Users can only update patients from their tenant
CREATE POLICY patient_tenant_isolation_update ON patients
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id());

-- Users can only delete patients from their tenant
CREATE POLICY patient_tenant_isolation_delete ON patients
  FOR DELETE
  USING ("tenantId" = get_current_tenant_id());

-- ============================================================================
-- CONSULTATIONS TABLE POLICIES
-- ============================================================================

-- Users can only see consultations from their tenant
CREATE POLICY consultation_tenant_isolation_select ON consultations
  FOR SELECT
  USING ("tenantId" = get_current_tenant_id());

-- Users can only insert consultations for their tenant
CREATE POLICY consultation_tenant_isolation_insert ON consultations
  FOR INSERT
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Users can only update consultations from their tenant
CREATE POLICY consultation_tenant_isolation_update ON consultations
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id());

-- Users can only delete consultations from their tenant
CREATE POLICY consultation_tenant_isolation_delete ON consultations
  FOR DELETE
  USING ("tenantId" = get_current_tenant_id());

-- ============================================================================
-- CLINICAL_NOTES TABLE POLICIES
-- ============================================================================

-- Users can only see clinical notes from their tenant
CREATE POLICY clinical_note_tenant_isolation_select ON clinical_notes
  FOR SELECT
  USING ("tenantId" = get_current_tenant_id());

-- Users can only insert clinical notes for their tenant
CREATE POLICY clinical_note_tenant_isolation_insert ON clinical_notes
  FOR INSERT
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Users can only update clinical notes from their tenant
CREATE POLICY clinical_note_tenant_isolation_update ON clinical_notes
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id());

-- Users can only delete clinical notes from their tenant
CREATE POLICY clinical_note_tenant_isolation_delete ON clinical_notes
  FOR DELETE
  USING ("tenantId" = get_current_tenant_id());

-- ============================================================================
-- EXPORTS TABLE POLICIES
-- ============================================================================

-- Users can only see exports from their tenant
CREATE POLICY export_tenant_isolation_select ON exports
  FOR SELECT
  USING ("tenantId" = get_current_tenant_id());

-- Users can only insert exports for their tenant
CREATE POLICY export_tenant_isolation_insert ON exports
  FOR INSERT
  WITH CHECK ("tenantId" = get_current_tenant_id());

-- Users can only update exports from their tenant
CREATE POLICY export_tenant_isolation_update ON exports
  FOR UPDATE
  USING ("tenantId" = get_current_tenant_id());

-- Users can only delete exports from their tenant
CREATE POLICY export_tenant_isolation_delete ON exports
  FOR DELETE
  USING ("tenantId" = get_current_tenant_id());

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  tenant_id TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_by TEXT, -- user_id or session info
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_val TEXT;
  record_id_val TEXT;
BEGIN
  -- Get tenant_id from the record (works for both OLD and NEW)
  IF TG_OP = 'DELETE' THEN
    tenant_id_val := OLD."tenantId";
    record_id_val := OLD.id;
  ELSE
    tenant_id_val := NEW."tenantId";
    record_id_val := NEW.id;
  END IF;

  -- Insert audit record
  INSERT INTO audit_logs (
    table_name,
    operation,
    tenant_id,
    record_id,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    tenant_id_val,
    record_id_val,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.user_id', true) -- Will be set by application
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE AUDIT TRIGGERS
-- ============================================================================

-- Create triggers for all clinical tables
CREATE TRIGGER audit_tenants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_consultations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON consultations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_clinical_notes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_exports_trigger
  AFTER INSERT OR UPDATE OR DELETE ON exports
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- INDEXES FOR AUDIT TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_changed_at_idx ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS audit_logs_operation_idx ON audit_logs(operation);