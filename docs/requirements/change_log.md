# Change log

Requirements changes follow a **PRD-first workflow**: edit `docs/Fizzi_Challenger_PRD.md` first, then add an entry here and propagate to `docs/requirements/*` and `docs/traceability/traceability_matrix.csv`. See `docs/requirements/REQUIREMENTS_UPDATE_CHECKLIST.md`.

---

## 2026-03-10  (Design linkage expansion)
- Expanded approved Figma-to-requirement linkage coverage in design traceability artifacts.
- Added concrete approved design anchors for Login, Loan Dashboard, Account Detail, Home, Privacy Statement, and Security Center.
- Added debit-card management lock-card mappings (single and multiple card flows) as approved design references for future requirement linkage.
- Updated `docs/design/figma_index.md` and `docs/traceability/design_requirement_links.csv` to include concrete node IDs and approved Figma URLs.

Impacted requirement IDs: None (traceability/documentation mapping update only; no requirement statement changes).

---

## 2026-03-09  (External systems: Transmit, Nymbus, Mastercard Finicity)
- Documented that identity, password, and session management are implemented via Transmit Security Mosaic, with flows orchestrated through Transmit’s APIs and journeys.
- Documented that core banking (accounts, balances, transactions, limits) is implemented on Nymbus Core, with data sourced from Nymbus APIs.
- Clarified that external account linking and aggregation use Mastercard Finicity Open Finance APIs, updating the ACH external-account linking requirement to reference Mastercard Finicity explicitly.

Impacted requirement IDs: Auth/Session; Accounts/Transactions; ACH External Account Linking; API/Integration NFRs. Propagate to `functional_requirements.md`, `non_functional_requirements.md`, `acceptance_tests.md`, and the traceability matrix when syncing.

---

## 2026-03-09  (Auth & Accounts clarifications)
- **Login V2 / MFA:** Clarified that MFA is delivered via mobile OTP against verified mobile number on file when required.
- **Secure Account Recovery (Forgot Password):** Added DRyVE requirement: reset link to email on file; flow verifies username, clears MFA, then allows new password; use on next login.
- **Acceptance Criteria:** Added AC that a successful forgot-password flow allows login with the new password and then prompts for MFA before authenticating the session.
- **Accounts Overview:** Minor wording change to closed-accounts AC (“if shown” → “if any”).

Impacted requirement IDs: Auth/Session (e.g. FR-001 and related login/MFA/forgot-password); Accounts Overview AC. Propagate to `functional_requirements.md`, `acceptance_tests.md`, and traceability matrix when syncing.

---

## 2026-03-09  (Phases & Platforms tagging)
- Added a Phases & Platforms section to the PRD, defining `[P1]`, `[P2]`, `[P3]` and `[Web]`, `[Android]`, `[iOS]`.
- Clarified that, unless otherwise specified, all existing requirements apply across `[P1–P3][Web][Android][iOS]`.

Impacted requirement IDs: None (scope/tagging metadata only).

---

## 2026-03-09
- Renamed PRD from `Sixert_PRD.md` to `Fizzi_Challenger_PRD.md`; updated document title to "Fizzi Challenger".
- Updated references in `change_log.md` and `REQUIREMENTS_UPDATE_CHECKLIST.md`.

Impacted requirement IDs: None (document rename only).

---

## 2026-02-26 17:53 America/Los_Angeles
- Exported unified requirements set from provided PRD and SRS (Phase 1 Web Angular).
- Normalized DRyVE (ZiFi) labeled items into functional requirements.
- Added explicit requirements artifacts for data contracts, API contracts, UI contracts, acceptance tests, decisions, glossary.

Impacted requirement IDs:
- FR-001..FR-088
- NFR-001..NFR-021

New assumptions:
- Treat "good standing" as an input signal available at limit decisioning time.
- Treat consumer vs business account classification as available to ACH submission flows.
- Use idempotency keys for money movement and limits decision endpoints.
