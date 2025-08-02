# Prompt for CodeGuideDev  
Generate a **comprehensive product-planning document** for **Aria Scribe – an AI-powered clinical scribing assistant for Australian medical practices.**  
The output should be well-structured Markdown that a product team can immediately turn into PRDs, implementation plans, and engineering tickets.

---

## 1  | Executive Summary  
*High-level vision, elevator pitch, and strategic fit within the broader “Aria” product family.*

## 2  | Problem Statement  
*Current pain-points for Australian GPs/clinics (documentation burden, billing errors, duplicated data entry, lost revenue).*

## 3  | **Target Audience** ★  
**Clearly identify the specific users you are building the software for and understand their needs.**  
- Primary: General Practitioners & Practice Nurses using Best Practice or MedicalDirector  
- Secondary: Practice Managers, Billing/Reception staff  
- Tertiary: Patients completing pre-consult questionnaires

### Persona snapshots  
| Persona | Role & Context | Key Jobs-to-Be-Done | Success Criteria |
|---------|----------------|---------------------|------------------|
| Dr Jane | Full-time GP, urban clinic | Finish notes before next patient, maximise MBS billing |  < 2 min note finalisation, 0 missed billable items |

## 4  | Value Proposition  
*“Spend more time healing, less time typing.”* Aria Scribe → secure, Australian-hosted, understands MBS rules, drafts notes/referrals/care plans, sparks billing insights.

## 5  | Core Use-Cases & User Flows  
Mermaid flowcharts for:  
- Patient check-in → pre-fill symptoms → consult → Aria Scribe passive capture → note draft → GP review/accept → EHR push  
- Care-plan generation  
- Referral letter creation

## 6  | **Focus on User Experience (UX)** ★  
**Prioritize creating an intuitive and enjoyable experience for users interacting with your software.**  
Design principles: zero-friction start/stop, inline editing, minimal clicks, dark & light modes, accessibility AA, Aussie medical terminology.

## 7  | Feature Inventory  
| Tier | Feature | Notes |
|------|---------|-------|
| Must-have | Real-time ambient transcription, note templating, MBS item suggestions, Best Practice API push, Australian data residency | MVP scope |
| Should-have | Referral & care-plan generation, patient handout suggestions, secure cloud storage | Phase 2 |
| Could-have | Multi-specialty templates, voice-actuated controls, analytics dashboard | Phase 3 |

## 8  | **Prioritize Core Functionality** ★  
**Start by building the essential features of your software and avoid feature creep during initial development.**

## 9  | **Develop a Minimum Viable Product (MVP)** ★  
**Launch a basic version with core features to gather user feedback and validate your concept quickly.**  
### MVP definition  
- Passive audio capture (desktop & mobile mic)  
- On-device speech diarisation → secure streaming → OpenAI transcription (AUS accent model)  
- Prompt-engineered note summariser (SOAP)  
- Manual “Send to BP” button

### MVP success metrics  
- ≥ 90 % transcription word-error rate ≤ 8 %  
- Avg note acceptance time ≤ 60 s  
- Pilot cohort NPS ≥ 40

## 10  | **Iterate and Test Regularly** ★  
**Continuously test your software with users and iterate based on their feedback throughout the development process.**  
- Weekly GP usability sessions  
- Feature flags & A/B testing  
- Integrated BugSnag + PostHog analytics

## 11  | **Plan for Scalability** ★  
**Design your software architecture to handle increasing numbers of users and data as your product grows.**  
- Event-driven micro-frontends (Electron / PWA)  
- Kubernetes-based transcription & NLP services (autoscaling)  
- Australia-only Azure region with multi-zone redundancy  
- Pluggable EHR connectors (FHIR gateway)

## 12  | Technical Architecture Overview  
1. **Client Capture Layer** – Electron/PWA listens, encrypts, streams  
2. **Real-time Processing Layer** – WebSocket → Kafka → Transcription workers  
3. **NLP & Prompt-Engine Layer** – OpenAI/LLM fine-tuned for medical notes  
4. **Persistence** – Postgres + object storage in Au-East  
5. **Integration Layer** – REST/FHIR connectors to Best Practice, Medicare APIs  
6. **Observability & Security** – Loki, Prometheus, Sentry; zero-trust, OpenID Connect, audit logs

## 13  | Non-Functional Requirements  
- HIPAA-like plus Australian Privacy Principles compliance  
- Latency < 2 s for live transcription  
- Uptime 99.9 %  
- Role-based access, end-to-end encryption, local AES keys

## 14  | Testing & Quality Strategy  
- Unit & contract tests (Vitest)  
- Cypress e2e on staging  
- Clinical safety testing with mock records  
- Pen-testing & threat modelling (OWASP SAMM)

## 15  | Deployment & DevOps  
- GitHub Actions CI → Helm charts → AKS  
- Blue-green releases, feature flags, rollback hooks  
- Data-residency guardrails in pipeline

## 16  | Regulatory & Compliance  
- Australian Digital Health Agency integration guidelines  
- MBS billing rules updates feed  
- Medical Device Software guidance (TGA) evaluation path

## 17  | Risks & Mitigations  
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Poor transcription accuracy w/ accents | Medium | Medium | Custom acoustic model, local fine-tuning |

## 18  | Open Questions  
- Preferred EHRs beyond Best Practice?  
- On-prem vs cloud audio storage requirements?  
- Pricing model (seat vs usage)?

---

### Deliverable Notes  
- Use this document as the master blueprint; carve out PRDs per epic.  
- Leverage CodeGuideDev’s “Section → Ticket” feature to explode features into engineering tasks.  
- Attach mermaid diagrams inline for architecture and user journeys.
