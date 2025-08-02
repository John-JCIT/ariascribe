# Aria Scribe – SQL Schema Reference

> **Purpose** – This document accompanies the database‑setup guide and provides a clear, version‑controlled reference for the core SQL objects that power Aria Scribe.

---

## 1  Conventions

- **UUID v4** primary keys for every business table
- ``** / **`` in UTC (`TIMESTAMPTZ`)
- **Snake‑case** table & column names
- **Soft multi‑tenancy** – almost every table carries `practice_id` for RLS isolation
- **CASCADE deletes** where child data has no meaning outside the parent (e.g. `patient_contacts`)

---

## 2  Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 3  Schema DDL

Below is the exact DDL as applied in migration `20250731_initial.sql`.

```sql
-- ░░ Practices & Settings ░░ --------------------------------------------------
CREATE TABLE practices (...);
CREATE TABLE practice_settings (...);

-- ░░ Clinicians ░░ -------------------------------------------------------------
CREATE TABLE clinicians (...);

-- ░░ Patients & Contacts ░░ ----------------------------------------------------
CREATE TABLE patients (...);
CREATE TABLE patient_contacts (...);
CREATE TABLE patient_documents (...);

-- ░░ Consultations & Artefacts ░░ ---------------------------------------------
CREATE TYPE consult_status AS ENUM ('recording','processing','ready','archived');
CREATE TABLE consultations (...);
CREATE TABLE audio_records (...);
CREATE TABLE transcripts (...);

-- ░░ Clinical Output ░░ -------------------------------------------------------
CREATE TABLE clinical_notes (...);
CREATE TABLE documents (...);
CREATE TABLE mbs_suggestions (...);

-- ░░ Templates ░░ -------------------------------------------------------------
CREATE TABLE template_categories (...);
CREATE TABLE templates (...);

-- ░░ Audit ░░ -----------------------------------------------------------------
CREATE TABLE audit_logs (...);

-- ░░ Indexes ░░ ---------------------------------------------------------------
CREATE INDEX ON patients(practice_id);
CREATE INDEX ON consultations(practice_id, started_at);
CREATE INDEX ON transcripts USING GIN (to_tsvector('english', transcript_txt));
```

> **Full text** lives in `/database/migrations/20250731_initial.sql` inside the repo.  The ellipses above are placeholders to keep this doc readable.

---

## 4  Entity Relationship Overview

```
practices 1───* clinicians 1───* consultations *───1 patients
                  │                          │
                  │                          ├── 1 audio_records
                  │                          ├── 1 transcripts
                  │                          └── 1 clinical_notes
patients   1───* patient_documents
consultations 1───* mbs_suggestions
practices 1───* templates
```

---

## 5  Applying the Schema

```bash
psql -U aria_owner -d aria_db -f database/migrations/20250731_initial.sql
```

After execution, verify:

```sql
\dt         -- list tables
\d patients -- table structure
```

---

## 6  Integrating with Prisma

1. Introspect:
   ```bash
   npx prisma db pull
   ```
2. Generate types:
   ```bash
   npx prisma generate
   ```
3. Example usage in NestJS service:
   ```ts
   const patients = await this.prisma.patient.findMany({
     where: { practice_id: currentPracticeId },
   });
   ```

---

## 7  Migration Strategy

- **Forward‑only** migrations, one per feature or DB‑level breaking change
- Name pattern: `YYYYMMDD_feature.sql`
- Store in repo under `/database/migrations`
- Use Prisma Migrate to generate but **review** SQL before committing (Supabase RLS doesn’t like implicit ALTERs that drop policies).

---

## 8  Changelog (excerpt)

| Version  | Date        | Key additions                        |
| -------- | ----------- | ------------------------------------ |
| 20250731 | 31 Jul 2025 | Initial schema, consult\_status enum |
| TBD      |             | RLS policies per table               |

---

> **Next:** A dedicated document will outline Row‑Level‑Security (RLS) policies to enforce tenant isolation and clinician‑level access.

