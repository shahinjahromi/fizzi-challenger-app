# Change log

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
