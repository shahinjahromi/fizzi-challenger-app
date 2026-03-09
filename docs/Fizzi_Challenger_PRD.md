# Fizzi Challenger – Product Requirements Document (PRD)
**Phase:** Web (Angular) – Phase 1  
**Audience:** PM, Design, Engineering, QA, Integrations  
**Status:** Standalone (consolidated)  
**Provenance:** Merged from Sixert ADO CSV exports (functional + defects) and DRyVE (ZiFi) backlog CSV. Contains business rules and acceptance criteria. Enhancement sections are explicitly labeled; DRyVE items are clearly marked.

**Revising this document:** Edit this PRD in human-friendly language first. Then add an entry to `docs/requirements/change_log.md` (summary + impacted requirement IDs) and have Cursor/Copilot update `docs/requirements/*` and `docs/traceability/traceability_matrix.csv`. Full steps: `docs/requirements/REQUIREMENTS_UPDATE_CHECKLIST.md`.

---

## 1. Purpose and Scope
This document defines the human‑readable, end‑to‑end requirements for Sixert's small‑business online banking experience. It covers: Authentication, Workspaces, Accounts, Transactions, Money Movement (Internal + ACH), Statements, Messaging, Profile & Security Center, Notifications, and Limits & Approvals. Mobile‑specific items are included where explicitly stated.

Out of scope: full dual‑approval workflows, wires, complex entitlements UI, banker desktop/back‑office UIs (except where called out for overrides).

---

## 2. Personas
- **Primary Admin (Business Owner):** full access across owned entities; initiates transfers/ACH; manages security.  
- **Authorized User (Bookkeeper):** limited to assigned entities and money‑movement entitlements.  
- **Bank Ops/Risk (Reference):** configures limits, receives risk alerts, performs overrides.

---

## 3. Authentication & Session
**Functional Requirements**
- Username/password login with precise error messages and visible loading states.  
- Password reset and username recovery return to a clean login (no residual banners or prefilled values).  
- Session expiration clears workspace and account caches on re‑authentication.  
- Multi‑entity users load all entitled entities; single‑workspace users auto‑select.  

**Business Rules**
- Reset/lookup flows must not leak stale UI state; profile summaries tolerate missing optional fields without breaking flows.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- **Login V2 (ZiFi Design System):** modern, accessible login; supports username or email; input validation; MFA inputs when required.  
- **Secure Account Recovery (Forgot Username):** username is never shown in‑app; deliver via verified channel; multi‑factor identity checks; CAPTCHA/rate limiting; audit trail; short‑lived tokens.  

**Acceptance Criteria**
- After password reset, returning to login shows no banners and no prefilled username.  
- On session timeout, re‑auth re‑initializes workspace and account caches.  
- A successful forgot‑username request results in delivery via verified channel only; requests are rate‑limited and logged.  

---

## 4. Workspaces (Multi‑Entity)
**Functional Requirements**
- Workspace selector lists all entitled entities.  
- Switching workspaces forces refresh of balances, transactions, feature flags; client caches invalidated.  
- Single‑workspace users bypass selection.  

**Business Rules**
- Avoid "no data" states after switch; aggregates and counts reflect the selected workspace only.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- Workspace switching follows ZiFi design system components and remains keyboard accessible.  

**Acceptance Criteria**
- After switching, dashboard and accounts reflect the selected workspace only and remain correctly scoped on back navigation.  

---

## 5. Accounts Overview
**Functional Requirements**
- List accounts with name, masked number (last‑4), account type, current and available balances.  
- Indicate when accounts are not eligible for move‑money.  
- Closed accounts are hidden by default; can be shown explicitly.  

**Business Rules**
- Totals and balances update promptly after posting/holds; prevent null/incorrect currency/type propagation.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- **Dashboard Reskin + Summary Cards:** total available + per‑account rows with click‑through.  
- **Quick Actions:** Move Money, Statements, Linked Accounts, Support.  
- Header shows **last login**; left navigation highlights active route; add **Footer** with compliance links.  

**Acceptance Criteria**
- Overview reflects pending/posted deltas accurately; closed accounts excluded by default and grouped under "Closed" if shown.  

---

## 6. Account Details & Activity
**Functional Requirements**
- Show posted and pending transactions with description, amount, status (Pending, Posted, Failed, On‑Hold), counterpart, timestamps; newest‑first.  
- Internal transfers produce paired entries (debit/credit).  
- Remove warehousing/internal markers from customer‑visible descriptions.  

**Business Rules**
- Lifecycle: Pending → Hold → Posted; never mark completed prematurely.  
- Sorting stable across transaction types; export/download includes correct fields and handles missing sources.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- Details panel shows masked account/routing, interest rate/earned, scheduled payments indicator; table supports search, sort, pagination.  

**Acceptance Criteria**
- Pending debit immediately reduces available balance; current balance updates on posting.  
- Null/partial fields render placeholders while preserving layout and usability.  

---

## 7. Money Movement – Internal Transfers
**Functional Requirements**
- Form: select From/To accounts, amount, optional memo; prevent same‑account and insufficient‑funds transfers.  
- Cutoff: submissions after **1:00 PM ET** post **next business day**; before cutoff post per policy.  
- Review screen confirms masked details and key notices; confirmation shows success, reference, timestamp.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- Three‑screen flow (Form → Review → Confirmation) with date picker enforcing business‑day rules and FDIC notice on review.  
- Move Money **Landing Hub** with cards (Internal / External / Send Money), scheduled placeholders, and "Manage Linked Accounts".  

**Acceptance Criteria**
- Submissions at 1:05 PM ET display Pending until next business day; insufficient funds blocks with actionable error and no transaction created.  

---

## 8. Money Movement – ACH (Inbound/Outbound)
**Functional Requirements**
- Inbound from linked accounts; outbound to linked/ad‑hoc with routing/account validation.  
- Respect cutoff times and lifecycle; avoid premature success notifications; never duplicate notifications.  

**Business Rules**
- UI copy reflects correct directionality (credit vs debit); external accounts display consistently across screens.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- **External Account Linking (Finicity):** modal integration; success/cancel/error handling; consistent naming/masking; clear retry guidance.  
- **ACH Level‑3 (Consumer Debit E‑Sign):** present Reg E, NACHA, E‑Sign disclosures before consumer debits; capture consent (timestamp, IP, externalAccountId); block without consent; bypass for business accounts; store auditable records.  

**Acceptance Criteria**
- Consumer debit requires disclosures + consent; without consent, block submission.  
- Invalid routing/account inputs show specific errors and prevent requests to core.  

---

## 9. Statements & Documents
- List available months; download PDFs; do not list nonexistent months; enforce branding and theming.  
- Handle backend errors gracefully; blank PDFs are invalid.  

**Acceptance Criteria**
- Only available months are shown; downloads return a valid PDF payload.  

---

## 10. Messaging & Notifications
**Functional Requirements**
- Inbox and thread views; compose; read/unread; character count; cross‑device draft persistence; history ordered chronologically.  
- Notifications include deep links, timestamps, unread badges; never include message body/PII; avoid duplication.  

🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- Risk alert email templates for operations; **mobile push** configuration/delivery for iOS/Android.  

**Acceptance Criteria**
- New message notifications carry a thread identifier for deep link; no sensitive content appears in notifications.  

---

## 11. Profile & Security Center
🟪 DRyVE Requirement (Added from DRyVE backlog — ZiFi Web/Mobile)
**DRyVE Requirements**
- **Profile v1 (Unified):** view‑only aggregation from onboarding/core + IDP; entitlement‑aware sections; link to Security Center for editing MFA contacts; responsive and accessible; Authorized‑User variations.  
- **Security Center:** single hub for Username; Password (render **exactly 16 bullets**); 2‑Step Verification (icons for enabled methods); Trusted Devices (count displayed when >0). Requires a **single step‑up per session** unless identity policy demands another challenge.  

**Acceptance Criteria**
- Only applicable rows are displayed; step‑up is enforced; password row renders 16 bullets; MFA icons reflect enabled factors.  

---

## 12. Limits & Approvals (Tiered by Tenure/Status)
**Objective**
Enforce configurable transaction limits that vary by **tenure** and **standing**, support **banker overrides** via admin tooling, and enable **fraud‑driven adjustments** by moving subjects between limit tiers.

**Entities**
- **LimitTier** (catalog): e.g., *New‑Tenure*, *Standard‑90+*, *Elevated*, *Restricted* (extensible).  
- **LimitAssignment**: subjectType (**user** or **account**), subjectId, tierId, effectiveFrom/to, overrideReason, assignedBy.  

**Default Tiering Logic**
1. **< 90 days tenure** ⇒ default to **New‑Tenure** (lower limits).  
2. **≥ 90 days + good standing** ⇒ default to **Standard‑90+** (higher limits).  
3. **Banker override** ⇒ assigned **Elevated/Restricted** tier takes effect immediately with audit.  
4. **Fraud/risk signal** ⇒ force **Restricted** regardless of tenure until cleared.  
5. If both user and account have assignments, **enforce the most‑restrictive** threshold set.  
6. Decision is evaluated at **submission time**; the applied tier and thresholds are attached to the transfer event for audit.  

**Threshold Types & Scope**
- Per‑transaction max; daily credit/debit max; monthly credit/debit max; optional **velocity**/count constraints; optional **Same‑Day ACH** sub‑limit.  
- Applies to **Internal Transfers** and **ACH** (immediate and future‑dated).  
- Scheduled payments use **predictive evaluation** against projected daily/monthly consumption.  

**UX Copy Rules**
- If blocked, show a **specific reason** (e.g., "Exceeds per‑transaction limit for your current limit tier").  
- On review, show informational notes (e.g., "Same‑Day ACH limited to $X for your tier").  
- Do **not** expose internal tier names in the customer UI; use friendly copy.  

**Audit & Observability**
- Log applied tier(s), thresholds consulted, decision outcome, tenure snapshot, standing indicator; for overrides, record assignedBy and reason.  

**Acceptance Criteria**
- **Tenure defaulting:** accounts < 90 days apply **New‑Tenure** limits; ≥ 90 days in good standing apply **Standard‑90+**.  
- **Most‑restrictive:** if a user is Elevated but a specific account is Restricted, the **Restricted** thresholds govern for that transaction.  
- **Override:** when a banker reassigns a user/account to Elevated, the next submission uses Elevated thresholds and the decision is audited.  
- **Fraud downgrade:** if risk sets an account to Restricted, all submissions use Restricted thresholds regardless of tenure.  
- **Predictive scheduling:** a future‑dated transfer that would breach daily/monthly max on the scheduled date is blocked with an explanatory message.  
- **Same‑Day ACH:** enforce sub‑limit where defined and present explanatory copy on breach.  

---

## 13. Non‑Functional Requirements
🟦 Enhancement (Added — Not in Original Source Requirements)
- **Security:** Mask account IDs; no PII in logs; OWASP‑aligned; audit MFA and consent events; JWT handling in dev with production‑grade plan.  
- **Performance:** <1s target for workspace switch, accounts load, dashboard summary in typical conditions; caching with invalidation on workspace switch.  
- **Reliability:** Retries/backoff for transient failures; idempotency on transfer endpoints; consistent pending/post lifecycle.  
- **Observability:** Correlation IDs end‑to‑end; domain events (login, switch, transfer, ACH, statement download).  
- **Accessibility:** WCAG AA for web; keyboard navigation and ARIA roles across reskinned components.  

---

## 14. Glossary (Selected)
🟦 Enhancement (Added — Not in Original Source Requirements)
- **Workspace/Entity:** business customer context for accounts & permissions.  
- **Available vs Current Balance:** available reflects holds/pending items; current reflects posted.  
- **Internal Transfer:** movement between accounts within the same entity.  
- **ACH:** network transfer between institutions; inbound or outbound.  
- **Statement:** monthly account document (PDF).  
- **TOTP:** time‑based one‑time password generated by an authenticator app.  
- **Limit Tier:** bank‑defined grouping governing thresholds by tenure/standing.  

---

## 15. Data Model Overview (Conceptual)
🟦 Enhancement (Added — Not in Original Source Requirements)
- **User:** id, role, workspaces[]  
- **Workspace:** id, name  
- **Account:** id, workspaceId, name, last4, type, availableBalance, currentBalance  
- **Transaction:** id, accountId, createdOn, postedOn?, amount, direction, status, description, counterpart  
- **Message:** id, threadId, createdOn, from, subject, body, read  
- **Statement:** id, accountId, month, url  
- **Consent (ACH L3):** userId, externalAccountId, timestamp, ip, artifacts  
- **LimitTier:** id, name, rules{perTxnMax, dailyCreditMax, dailyDebitMax, monthlyCreditMax, monthlyDebitMax, velocity, sameDayACHMax}  
- **LimitAssignment:** subjectType, subjectId, tierId, effectiveFrom, effectiveTo, overrideReason, assignedBy  

---

## 16. API Behavioral Expectations (Non‑code)
🟦 Enhancement (Added — Not in Original Source Requirements)
- **Auth:** login → token + profile with entities; `/me` → current profile.  
- **Accounts:** list by workspace; get by id; per‑account transactions with status filters and stable descending sort.  
- **Transfers:** internal validation + cutoff; ACH validation + lifecycle; **limits decisioning** with idempotent decision keys; **ACH L3** consent checks.  
- **Statements:** list per account; download PDFs; resilient error handling.  
- **Messages:** list, compose, mark read; notifications carry threadId.  
- **Notifications:** risk alert templates; push setup endpoints (mobile).  
- **Limits:** retrieve active LimitTier(s) and LimitAssignment(s) prior to validation; cache decisions briefly (e.g., 30s) per subject; re‑check at commit to avoid inconsistencies.  

---

## 17. Acceptance Criteria Index (Quick Reference)
Summarizes AC for: Auth/Session; Workspaces; Accounts; Account Details; Internal Transfers; ACH; Statements; Messaging/Notifications; Profile/Security Center; **Limits & Approvals**.
