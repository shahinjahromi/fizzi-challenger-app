# Requirements Version Log

This document maps each source-code version (Git tag / PR / build) to the **exact snapshot of requirements documents** that were considered at implementation time.

Future builds can use this log to identify which requirement changes occurred between any two builds, enabling precise impact analysis and regression testing.

---

## Format

Each entry records:
- **Source version**: Git tag, branch, or PR reference
- **Requirements snapshot date**: The most recent change-log entry date in effect when implementation started
- **Schema version**: `docs/requirements/requirements.index.yaml` schema_version at that time
- **Requirement artifacts considered**: File, last-changed date, content hash (sha256), and key IDs in scope
- **Notable gaps / deferred items**: Known requirements intentionally deferred to a later build

---

## v0.1.0 — 2026-03-10

### Source version
- **Branch**: `copilot/start-design-implementation`
- **Tag**: `v0.1.0` (pending release)
- **Build date**: 2026-03-10

### Requirements snapshot
- **Requirements schema version**: `1.0` (`docs/requirements/requirements.index.yaml`)
- **Most recent change-log entry**: `2026-03-10` (Design linkage expansion)
- **Change-log entries considered**:
  - `2026-03-10` — Design linkage expansion (Figma node IDs, traceability)
  - `2026-03-09` — External systems: Transmit Security Mosaic, Nymbus Core, Mastercard Finicity
  - `2026-03-09` — Auth & Accounts clarifications (Login V2/MFA, forgot-password flow)
  - `2026-02-26` — Initial unified export (FR-001 to FR-088, NFR-001 to NFR-021)

### Requirement artifacts considered

| Artifact | Path | Last changed | Key IDs in scope |
|----------|------|-------------|-----------------|
| Business Context | `docs/requirements/business_context.md` | 2026-02-26 | Business scope, personas |
| Functional Requirements | `docs/requirements/functional_requirements.md` | 2026-03-09 | FR-001 to FR-088 |
| Non-Functional Requirements | `docs/requirements/non_functional_requirements.md` | 2026-03-09 | NFR-001 to NFR-029 |
| API Contracts | `docs/requirements/api_contracts.md` | 2026-03-09 | All endpoints |
| Data Contracts | `docs/requirements/data_contracts.md` | 2026-03-09 | All entities |
| UI Contracts | `docs/requirements/ui_contracts.md` | 2026-03-09 | All screens |
| Acceptance Tests | `docs/requirements/acceptance_tests.md` | 2026-03-09 | All scenarios |
| Architecture Overview | `docs/architecture/overview.md` | 2026-03-09 | Full stack spec |
| SOLID Architecture Guide | `docs/architecture/FIZZI_SOLID_ARCHITECTURE.md` | 2026-03-09 | SOLID principles |
| Build Roadmap | `BUILD_ROADMAP.md` | 2026-03-09 | Phases 1–12 |
| Figma Index | `docs/design/figma_index.md` | 2026-03-10 | All 12 design scopes |
| Traceability Matrix | `docs/traceability/traceability_matrix.csv` | 2026-03-10 | FR-001–088, NFR-001–029 |

### Implementation scope (v0.1.0)

#### ✅ Implemented (Build Roadmap Phase 1: Project Structure & Setup)

**Server** (`server/`)
- Full Prisma schema with 19 models (User, Workspace, Account, Transaction, InternalTransfer, AchTransfer, ExternalAccount, AchConsent, Statement, MessageThread, Message, Notification, LimitTier, LimitAssignment, LimitDecision, AuditEvent, IdempotencyKey, RefreshToken, WorkspaceMembership)
- Authentication module: login, logout, refresh, forgot-password stub, forgot-username stub, `/me` endpoint
- Workspace module: list entitled workspaces, workspace-scoped account listing
- Accounts module: account details with masked account/routing numbers
- Transactions module: paginated, sorted, filterable transaction list
- Internal Transfers module: same-account check, funds check, cutoff rules, paired ledger entries, idempotency
- ACH Transfers module: consent enforcement, routing validation stub, Nymbus integration stub
- Statements module: available months listing, PDF download stub
- Messaging module: inbox/thread views, compose, read/unread state
- Limits module: tenure defaulting, most-restrictive tier enforcement, limit decisions
- Profile/Security module: view-only profile, security center
- Middleware: auth (JWT), correlation ID, rate limiting (3 tiers), request validation (Zod), error handler
- Utilities: logger (Winston, PII-safe), JWT utils, date utils (ET cutoff, business days), mask utils
- Audit service: structured audit events for key operations
- Seed data: alice, bob, carol, dave (password: demo1234); 2 workspaces; 4 accounts; 40 transactions; 4 limit tiers

**Client** (`client/`)
- Angular 17 standalone-component SPA
- Core: auth service, workspace service, account/transaction/transfer/statement/message services
- Auth interceptor (Bearer token, 401 refresh), correlation ID interceptor
- Auth guard, workspace guard
- Layout: header (last login, unread badge), left nav (active route highlight), footer (compliance links)
- Login page with loading state, error messages, forgot-password/username links
- Workspace selector (keyboard accessible)
- Dashboard: total available balance card, per-account rows, quick actions
- Account detail: masked account/routing, interest info, transaction table with search/sort/pagination
- Move Money hub: Internal, External, Send Money cards
- Internal Transfer: Form → Review → Confirmation 3-step flow
- Statements: available months listing, PDF download
- Messaging: inbox, thread view, compose with character count
- Profile: view-only profile
- Security Center: username, password (16 bullets), 2SV, trusted devices

**Infrastructure**
- Root `package.json` with `npm run dev` (starts both server + client via concurrently)
- Azure Pipelines (`azure-pipelines.yml`)
- Updated `.gitignore`

#### ⏳ Deferred to future builds

| FR/NFR | Area | Reason |
|--------|------|--------|
| FR-002, FR-003 | Forgot-password/username full flow | Requires Transmit Security Mosaic integration (NFR-027) |
| FR-009 | MFA challenge/verify | Requires Transmit Security Mosaic integration |
| FR-046 | Mastercard Finicity modal | Requires Mastercard Finicity Open Finance API keys (NFR-029) |
| FR-065 | Mobile push notifications | Phase 2/3 (Android/iOS) |
| NFR-027 | Transmit Security Mosaic | External dependency; stubs in place |
| NFR-028 | Nymbus Core APIs | External dependency; stubs in place |
| NFR-029 | Mastercard Finicity Open Finance | External dependency; stubs in place |
| FR-084 | Predictive limit scheduling | Future build (requires scheduling engine) |
| NFR-009 | Full idempotency key persistence | Partial; middleware stub in place |
| NFR-010 | Exponential backoff retries | Future build |
| NFR-016 | Correlation ID end-to-end | Partial; correlation ID set, not propagated to all stubs |

### Traceability
- All implemented items cross-referenced in `docs/traceability/traceability_matrix.csv`
- This log entry maps to Build Roadmap Step 1 (Project Structure & Setup)

---

## v0.1.1 — 2026-03-10

### Source version
- **Branch**: `copilot/start-design-implementation`
- **Build date**: 2026-03-10 (same day patch)

### Changes from v0.1.0
This patch addresses the two items left incomplete from v0.1.0:

#### 1. Angular vulnerability remediation (Security)
- **Problem**: `@angular/common`, `@angular/compiler`, `@angular/core` at version `17.3.x` were affected by:
  - XSRF Token Leakage via Protocol-Relative URLs (`@angular/common < 19.2.16`)
  - XSS via Unsanitized SVG Script Attributes (`@angular/compiler ≤ 18.2.14`)
  - Stored XSS via SVG Animation/MathML (`@angular/compiler ≤ 18.2.14`)
  - i18n XSS (`@angular/core ≤ 18.2.14`)
- **Fix**: Upgraded all `@angular/*` packages from `^17.3.0` → `^19.2.19` in `client/package.json`; upgraded `zone.js` from `~0.14.4` → `~0.15.0` (required by Angular 19); upgraded `typescript` from `~5.4.2` → `~5.7.0`
- **Verified**: Build succeeds with zero errors and zero warnings; `@angular/core` at `19.2.19` confirmed

#### 2. Figma design conformance validation
- **Added**: `docs/design/figma_conformance_report.md` — full per-screen conformance review against all 10 approved Figma frames
- **Conformance result**: All in-scope screens pass; 5 items deferred pending external integrations
- **Component fixes applied**:
  - `dashboard.component.ts`: Added "Linked Accounts" quick action (FR-019, Figma `6242:19969`)
  - `internal-transfer/internal-transfer.component.ts`: Added 1:00 PM ET cutoff notice to Review screen (FR-038, Figma `293:20409`)
  - `thread/thread.component.ts`: Removed unused `NgClass` import (build warning)
  - `internal-transfer/internal-transfer.component.ts`: Removed unused `NgClass` import (build warning)
- **Traceability matrix**: Updated `docs/traceability/traceability_matrix.csv` — 61 rows updated with actual code paths and "Met" status for implemented requirements

### Requirements snapshot (unchanged from v0.1.0)
- Same requirements snapshot date: `2026-03-10`
- Same schema version: `1.0`

---

## How to update this log

When starting a new build cycle:

1. Identify the latest change-log entries in `docs/requirements/change_log.md` that are new since the last entry above.
2. Add a new entry block with the new version, date, and relevant requirement IDs.
3. List which requirements are newly implemented or updated.
4. Update `docs/traceability/traceability_matrix.csv` to reflect new code paths.

> **Rule**: Every merged PR or release tag must have a corresponding entry in this file.
