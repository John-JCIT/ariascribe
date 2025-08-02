# Aria Scribe – Row‑Level Security (RLS) Policy Reference

> **Goal** – Enforce strict multi‑tenant isolation **and** fine‑grained clinician permissions while letting Supabase Auth issue JWTs.  This document defines every policy you should apply to the production database after the base schema is migrated.

---

## 1  Roles & context helpers

### 1.1  Supabase roles used

| Supabase Role   | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `anon`          | Unauthenticated users (never allowed DB access here)           |
| `authenticated` | Clinicians logged in via GoTrue                                |
| `service_role`  | Server‑side trusted calls (NestJS background jobs, migrations) |

### 1.2  Helper functions

Create once in the `public` schema so policies stay readable:

```sql
-- Returns the clinician row matching current JWT uid, or NULL
CREATE OR REPLACE FUNCTION current_clinician_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM clinicians WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_practice_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT practice_id FROM clinicians WHERE auth_user_id = auth.uid();
$$;
```

> These use **SECURITY DEFINER** so they run with table read rights even if RLS blocks direct selects.

---

## 2  Global pattern

For every business table we apply:

1. `ENABLE ROW LEVEL SECURITY;`
2. A **SELECT** policy → records limited to same `practice_id`.
3. **INSERT / UPDATE** policies with `WITH CHECK` to ensure new/edited rows carry the correct `practice_id` and (if relevant) `clinician_id`.
4. **DELETE** allowed only to `service_role`.

---

## 3  Policies by table

Below are copy‑ready snippets (run as `postgres` or another superuser).  Adjust names only if you changed column spelling.

### 3.1  practices

```sql
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Clinicians read their own practice record
CREATE POLICY p_select ON practices
FOR SELECT TO authenticated
USING (id = current_practice_id());

-- No INSERT/UPDATE/DELETE via client (admins use service_role)
GRANT ALL ON practices TO service_role;
```

### 3.2  practice\_settings

```sql
ALTER TABLE practice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ps_rw ON practice_settings
FOR ALL TO authenticated
USING (practice_id = current_practice_id())
WITH CHECK (practice_id = current_practice_id());
```

### 3.3  clinicians

```sql
ALTER TABLE clinicians ENABLE ROW LEVEL SECURITY;
-- Read all clinicians in same practice (for dropdowns etc.)
CREATE POLICY c_select ON clinicians
FOR SELECT TO authenticated
USING (practice_id = current_practice_id());

-- Self‑update only (e.g. profile photo)
CREATE POLICY c_update_self ON clinicians
FOR UPDATE TO authenticated
USING (id = current_clinician_id())
WITH CHECK (id = current_clinician_id());
```

### 3.4  patients & sub‑tables

```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_rw ON patients
FOR ALL TO authenticated
USING (practice_id = current_practice_id())
WITH CHECK (practice_id = current_practice_id());

ALTER TABLE patient_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_rw ON patient_contacts
FOR ALL TO authenticated
USING (patient_id IN (SELECT id FROM patients WHERE practice_id = current_practice_id()))
WITH CHECK (patient_id IN (SELECT id FROM patients WHERE practice_id = current_practice_id()));

ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY pd_rw ON patient_documents
FOR ALL TO authenticated
USING (patient_id IN (SELECT id FROM patients WHERE practice_id = current_practice_id()))
WITH CHECK (patient_id IN (SELECT id FROM patients WHERE practice_id = current_practice_id()));
```

### 3.5  consultations & artefacts

```sql
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cons_rw ON consultations
FOR ALL TO authenticated
USING (practice_id = current_practice_id())
WITH CHECK (practice_id = current_practice_id());

-- child tables reference consultation_id so we piggy‑back
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['audio_records','transcripts','clinical_notes'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY %I_rw ON %I
                    FOR ALL TO authenticated
                    USING (consultation_id IN (SELECT id FROM consultations WHERE practice_id = current_practice_id()))
                    WITH CHECK (consultation_id IN (SELECT id FROM consultations WHERE practice_id = current_practice_id()));', tbl, tbl);
  END LOOP;
END $$;
```

### 3.6  documents & mbs\_suggestions

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY doc_rw ON documents
FOR ALL TO authenticated
USING (consultation_id IN (SELECT id FROM consultations WHERE practice_id = current_practice_id()))
WITH CHECK (consultation_id IN (SELECT id FROM consultations WHERE practice_id = current_practice_id()));

ALTER TABLE mbs_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mbs_sel ON mbs_suggestions
FOR SELECT TO authenticated
USING (consultation_id IN (SELECT id FROM consultations WHERE practice_id = current_practice_id()));
```

### 3.7  template\_categories & templates

```sql
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tc_rw ON template_categories
FOR ALL TO authenticated
USING (practice_id = current_practice_id())
WITH CHECK (practice_id = current_practice_id());

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tpl_rw ON templates
FOR ALL TO authenticated
USING (practice_id = current_practice_id())
WITH CHECK (practice_id = current_practice_id());
```

### 3.8  audit\_logs

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- No client‑side access; service_role only
GRANT ALL ON audit_logs TO service_role;
REVOKE ALL ON audit_logs FROM authenticated, anon;
```

---

## 4  Privilege summary

| Table                  | anon | authenticated   | service\_role |
| ---------------------- | ---- | --------------- | ------------- |
| **practices**          | ×    | R               | RW            |
| **practice\_settings** | ×    | RW              | RW            |
| **clinicians**         | ×    | R / self‑update | RW            |
| **patients**           | ×    | RW              | RW            |
| **consultations**      | ×    | RW              | RW            |
| **audio\_records**     | ×    | RW              | RW            |
| **transcripts**        | ×    | RW              | RW            |
| **clinical\_notes**    | ×    | RW              | RW            |
| **documents**          | ×    | RW              | RW            |
| **mbs\_suggestions**   | ×    | R               | RW            |
| **templates**          | ×    | RW              | RW            |
| **audit\_logs**        | ×    | ×               | RW            |

Legend: **R** = SELECT , **RW** = SELECT + INSERT + UPDATE (+ DELETE via service\_role only)

---

## 5  Validation queries

After policies are in place, connect as an authenticated user (`supabase.auth.signInWithPassword`) and verify:

```sql
-- Should return only practice‑scoped rows
select count(*) from patients;

-- Should fail (insert into wrong practice)
insert into patients (id, practice_id, first_name, last_name) values (gen_random_uuid(),'some‑other‑practice', 'Bad', 'Guy');
```

Both PostgREST & direct psql (with JWT) will respect these rules.

---

## 6  Change management

- Every PR that modifies a table **must** update its RLS policies.  Supabase CLI `supabase db diff` helps catch missing policies.
- Keep a regression test suite in Jest (NestJS) that authenticates with a clinician JWT and confirms cross‑practice leakage is impossible.

---

> These policies provide a secure foundation; extend with finer scopes (e.g. patient‑level sharing) as features evolve.

