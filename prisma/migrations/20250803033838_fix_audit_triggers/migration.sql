-- Fix audit triggers to handle tables without tenantId

-- Drop existing triggers
DROP TRIGGER IF EXISTS audit_tenants_trigger ON tenants;
DROP TRIGGER IF EXISTS audit_patients_trigger ON patients;
DROP TRIGGER IF EXISTS audit_consultations_trigger ON consultations;
DROP TRIGGER IF EXISTS audit_clinical_notes_trigger ON clinical_notes;
DROP TRIGGER IF EXISTS audit_exports_trigger ON exports;

-- Drop the old function
DROP FUNCTION IF EXISTS audit_trigger_function();

-- Create improved audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_val TEXT;
  record_id_val TEXT;
BEGIN
  -- Get record_id (always use 'id' field)
  IF TG_OP = 'DELETE' THEN
    record_id_val := OLD.id;
  ELSE
    record_id_val := NEW.id;
  END IF;

  -- Get tenant_id based on table
  IF TG_TABLE_NAME = 'tenants' THEN
    -- For tenants table, use the id as tenant_id
    IF TG_OP = 'DELETE' THEN
      tenant_id_val := OLD.id;
    ELSE
      tenant_id_val := NEW.id;
    END IF;
  ELSE
    -- For other tables, use tenantId field
    IF TG_OP = 'DELETE' THEN
      tenant_id_val := OLD."tenantId";
    ELSE
      tenant_id_val := NEW."tenantId";
    END IF;
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
    current_setting('app.user_id', true)
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
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