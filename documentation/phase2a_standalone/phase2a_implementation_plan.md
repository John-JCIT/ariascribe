# Phase 2A – Standalone Clinical Mode
## Technical Implementation Plan

> **Scope:** Convert Aria Scribe from mock-data demo to production-ready standalone system secured by PostgreSQL Row-Level Security (RLS).  No EHR integration required in this phase.
> **Duration:** 3 weeks (aligned with roadmap Weeks 4-6)

---

### 0 | Repository Context
Refer to **`repository-overview.md`** for the full project layout, available package.json scripts (run via **Bun** → `bun run dev`, `bun run build`, `bun run db:migrate`, etc.) and existing tooling. The tasks below build directly on that baseline.

### 1 | Context Recap
Phase 1 delivered UI components powered by `MockEHRService`.  We now need to:
1. Replace mocks with real data persisted in Postgres.
2. Enforce tenant isolation with RLS.
3. Keep interfaces untouched so React components remain functional.

---

### 1 | Database Work
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 1.1 | Create new tables: `tenants`, `patients`, `consultations`, `clinical_notes`, `exports` | DB Eng | `tenant_id` FK on every row |
| 1.2 | Write RLS policies for each table (SELECT/INSERT/UPDATE limited to session `current_setting('app.tenant_id')`) | DB Eng | Unit tests in CI |
| 1.3 | Add helper function `set_tenant(tenant_uuid uuid)` to set `app.tenant_id` at connection start (used by API layer) | DB Eng | |
| 1.4 | Migration scripts versioned via `bun run db:migrate` (Prisma) | DB Eng | Follow workspace rule (no `db push`) |

---

### 2 | Backend / API Layer
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 2.1 | **DataStore Abstraction** – create `src/server/datastore/*.ts` with interface:
```ts
interface DataStore {
  getTodaysAppointments(clinicianId: string, date: Date): Promise<Appointment[]>;
  getDashboardStats(clinicianId: string, date: Date): Promise<DashboardStats>;
  getPatientSummary(patientId: string): Promise<PatientSummary>;
  createClinicalNote(patientId: string, note: ClinicalNoteInput): Promise<ClinicalNote>;
  // …other methods mirrored from EHRProvider
}
``` | Backend | |
| 2.2 | Implement `SharedPostgresStore` using Prisma queries + RLS | Backend | Used when `tenant.is_dedicated_db = false` |
| 2.3 | Implement `DedicatedPostgresStore` (connection URI per tenant) | Backend | Shortcut: extend Shared store; connection string passed in |
| 2.4 | Service-locator `getDataStore(tenant)` returns correct store | Backend | Reads tenant from JWT/session |
| 2.5 | Replace `getMockEHRService()` calls in hooks with `getEHRService()` which internally uses `getDataStore()` (see integration blueprint) | Full-stack | Search-and-replace + type-check |

---

### 3 | Standalone Provider
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 3.1 | Create `StandaloneClinicService` implementing existing `EHRProvider` interface but delegating to `DataStore` | Backend | Minimal subset for Phase 2A |
| 3.2 | Add factory `getEHRService()` in `src/services/index.ts` | Backend | Chooses between Standalone vs (future) real providers |
| 3.3 | Unit tests with Vitest – mock DB pool and ensure correct SQL generated | Backend | |

---

### 4 | Feature Flag & Tenant Bootstrapping
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 4.1 | Add columns `operating_mode enum('standalone','ehr-integrated')`, `is_dedicated_db boolean`, `db_connection_uri text` to `tenants` table | DB Eng | |
| 4.2 | Extend onboarding CLI to create tenant row and (optionally) dedicated DB | DevOps | |
| 4.3 | Inject `operating_mode` into JWT claims at login | Backend | `app_mode` claim |
| 4.4 | Front-end helper `getOperatingMode()` reads claim (SSR safe) | Frontend | Already sketched in blueprint |
| 4.5 | `<ModeBadge/>` component in sidebar | Frontend | Simple tailwind badge |

---

### 5 | Exports Module
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 5.1 | `ExportService` – generate PDF/DOCX using Markdown → HTML → Puppeteer | Backend | Templates in `templates/exports` |
| 5.2 | API endpoint `POST /consultations/:id/export` | Backend | Stores file paths in `exports` table |
| 5.3 | UI: Export Modal after note completion | Frontend | Uses existing Dialog system + Spinner |

---

### 6 | Quality & Security
| # | Task | Owner | Notes |
|---|------|-------|-------|
| 6.1 | RLS test suite – PGTap or node-pg test verifying tenant isolation | QA | Runs in CI |
| 6.2 | Audit triggers – insert into `audit_log` on every DML | DB Eng | JSON column of changed row |
| 6.3 | OWASP ASVS checklist for API endpoints | Security | |

---

### 7 | Timeline & Milestones
| Week | Milestone | Exit Criteria |
|------|-----------|---------------|
| 4.0 | DB & RLS ready | Tables exist, policies pass test-suite |
| 4.5 | DataStore abstraction working | Unit tests green, hooks compile |
| 5.0 | StandaloneClinicService passes interface tests | Vitest suite green |
| 5.5 | Feature-flag & ModeBadge in UI | Can toggle mode via tenant row |
| 6.0 | ExportService generates PDF/DOCX | Manual QA of export |
| 6.0 | Pilot readiness | End-to-end flow: create patient → consult → export |

---

### 8 | Risks / Mitigations (additional)
| Risk | Mitigation |
|------|------------|
| RLS mis-configuration exposes rows | Automated tests; CI block on failures |
| Performance issues with many tenants | Connection pooling + proper indexes on `tenant_id`, `clinician_id` |
| Dedicated DB automation complexity | Start manual; invest in Terraform once >3 enterprise deals |

---

### 9 | Deliverables
1. Updated database schema & migration scripts
2. `DataStore` abstraction and StandaloneClinicService
3. Feature flag plumbing + ModeBadge UI
4. ExportService & templates
5. Comprehensive RLS test-suite
6. Documentation updates (this file + ERD)

---

*Last updated: 2025-08-03*