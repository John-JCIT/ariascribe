-- Create audit_logs table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_changed_at_idx ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS audit_logs_operation_idx ON audit_logs(operation);