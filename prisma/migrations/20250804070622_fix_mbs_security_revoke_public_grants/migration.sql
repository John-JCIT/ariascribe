-- Fix MBS Security: Revoke dangerous PUBLIC grants and assign to application role
-- This migration addresses the security vulnerability where the MBS schema was granted
-- ALL PRIVILEGES to the PUBLIC role, which allows any database user to access the data.

-- Step 1: Revoke all dangerous PUBLIC privileges on MBS schema
REVOKE ALL PRIVILEGES ON SCHEMA mbs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA mbs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mbs FROM PUBLIC;

-- Step 2: Grant appropriate privileges only to the application role 'ariascribe'
-- This ensures only the application can access the MBS schema
GRANT USAGE ON SCHEMA mbs TO ariascribe;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mbs TO ariascribe;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mbs TO ariascribe;

-- Step 3: Update the RLS policy to use the application role instead of PUBLIC
-- The existing policy was also using PUBLIC, which we need to fix
DROP POLICY IF EXISTS mbs_suggestions_tenant_isolation ON mbs.suggestions;
CREATE POLICY mbs_suggestions_tenant_isolation ON mbs.suggestions
    FOR ALL
    TO ariascribe
    USING (tenant_id = current_setting('app.tenant_id', true));