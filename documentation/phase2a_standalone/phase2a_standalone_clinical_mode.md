# Phase 2A – Standalone Clinical Mode

> **Status:** Draft • Target Duration: Weeks 4-6 • Owner: Product & Engineering
>
> **Purpose:** Enable medical practices to use Aria Scribe without connecting to an external Electronic Health Record (EHR) system. This mode delivers immediate value, un-blocks pilots while waiting for EHR approval, and provides a fallback for tenants that either lack an EHR or choose not to integrate.

---

## 0 | Repository Context
For overall project structure, scripts (e.g., `db:migrate`, `dev`, `build`) and tooling, see the root-level **`repository-overview.md`** document.

## 1 | Executive Summary
Standalone Clinical Mode turns Aria Scribe into a self-contained clinical documentation assistant. Practices can:
1. Maintain a lightweight patient list inside Aria Scribe
2. Conduct consultations with audio capture, transcription, and AI-generated notes (future Phase 3 dependency)
3. Export consultation notes in common formats (PDF, DOCX, TXT) for manual upload to any PMS/EHR
4. Seamlessly migrate to full EHR integration later — data models are forward-compatible

---

## 2 | Goals & Non-Goals
### Goals
- Deliver useful functionality **without** needing external APIs
- Minimise time-to-value for early adopters and pilot sites
- Provide a **multi-tenant** configuration flag to toggle between Standalone and EHR modes per tenant
- Ensure all data created in Standalone mode can be synchronised once EHR mode is enabled

### Non-Goals
- Implement provider-specific EHR APIs (handled in Phase 2B)
- Replace an EHR’s full patient records function — only essential clinical fields are stored

---

## 3 | Feature Inventory (Standalone Mode)
| Category | Feature | Priority |
|----------|---------|----------|
| Patient Management | CRUD patient records, CSV import, quick search | Must-have |
| Consultation Workflow | Start/stop session, status tracking | Must-have |
| Clinical Notes | Rich-text editor, templates, version history | Must-have |
| Exports | PDF / DOCX / TXT, email or download | Must-have |
| Settings | Tenant-level operating-mode, user preferences | Must-have |
| Analytics | Basic usage metrics (consultations/day) | Should-have |
| Migration | Push standalone data to EHR when connected | Should-have |

---

## 4 | Data Model Additions
```typescript
interface Patient {
  id: string;               // Aria Scribe UUID
  ehrPatientId?: string;    // populated after migration
  source: 'aria-scribe' | 'ehr' | 'imported';
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'M' | 'F' | 'Other' | 'Unknown';
  contactInfo?: ContactInfo;
  lastConsultation?: Date;
}

interface Consultation {
  id: string;
  patientId: string;
  mode: 'standalone' | 'ehr-integrated';
  createdAt: Date;
  status: 'in-progress' | 'completed' | 'exported';
  noteContent: string;       // Markdown
  exportedFiles?: string[];  // paths / URLs of generated exports
}
```
*Tables are deliberately minimal; additional fields can be migrated from the EHR later.*

---

## 5 | Technical Architecture
```mermaid
graph TD
  subgraph Frontend (Next.js)
    A[Patient List]
    B[Consultation Panel]
    C[Note Editor]
    D[Export Modal]
  end
  subgraph Backend (API)
    E[PatientService]
    F[ConsultationService]
    G[ExportService]
    H[MigrationService]
  end
  A -- CRUD --> E
  B -- start/stop --> F
  C -- save draft --> F
  D -- generate --> G
  F -- export-ready --> D
  H -- sync --> ExternalEHR[(EHR – future)]
```
### Key Points
- **Zustand** & **React Query** manage local and server state.
- **ExportService** runs server-side to produce PDF/DOCX using templated Markdown → HTML → Puppeteer pipeline.
- **MigrationService** is dormant until EHR integration is configured.

---

## 6 | Multi-Tenant Configuration
```typescript
interface TenantConfiguration {
  tenantId: string;
  operatingMode: 'standalone' | 'ehr-integrated';
  adminCanChangeMode: boolean;
  requiresApproval: boolean;      // toggle to prevent accidental switches
  features: {
    manualExport: boolean;
    patientManagement: boolean;
    ehrSync: boolean;             // false in standalone
  };
}
```
- Configuration is stored in the **`tenants`** table of the shared Postgres cluster, protected via PostgreSQL **Row-Level Security (RLS)**.
- A **feature flag** (e.g., `NEXT_PUBLIC_OPERATING_MODE`) is injected at build/runtime (and echoed in SSR) to adapt UI components.

---

## 7 | UI / UX Considerations
1. **Mode Badge** – Prominent label (e.g., "Standalone Mode") in the sidebar header.
2. **Patient Onboarding Wizard** – Encourage CSV import of existing patient roster.
3. **Consultation Flow** – Identical to EHR mode; only data source changes.
4. **Export CTA** – "Export & Upload to PMS" button after note finalisation.
5. **Settings Screen** – For tenants that allow switching, present a "Connect to EHR" flow.

---

## 8 | Implementation Roadmap (Weeks 4-6)
| Week | Focus | Tasks | Deliverables |
|------|-------|-------|--------------|
| 4 | Patient Management | DB schema, API endpoints, React pages | Patient CRUD, search, CSV import |
| 5 | Consultation Workflow | Start session, drafts, templates | Consultation panel storing data in DB |
| 6 | Export & Prep for EHR | ExportService, tenant config, RLS policies | PDF/DOCX exports, mode toggle in settings |

---

## 9 | Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Standalone data divergence | Medium | Medium | Strict data model subset aligned with EHR schema |
| Export format issues | Low | Medium | Use library w/ unit tests (e.g., Puppeteer) |
| Tenant mis-configuration | Medium | Low | Admin approval workflow, audit logs |

---

## 10 | Success Metrics
- ≥ 90 % of pilot users can complete a consultation start → export in < 5 minutes
- Patient record creation takes < 30 seconds
- Export generation success rate ≥ 99 %
- Positive qualitative feedback from 3 pilot clinics

---

## 11 | Next Steps
1. **Product Sign-off** on this Phase 2A document
2. Create engineering tickets per roadmap tasks
3. Begin implementation with focus on Patient Management module
4. Parallel design of Export templates with clinical advisors

---

*Prepared by: <your name> • 2025-08-03*