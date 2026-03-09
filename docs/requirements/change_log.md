# Change log

Requirements changes follow a **PRD-first workflow**: edit `docs/Fizzi_Challenger_PRD.md` first, then add an entry here and propagate to `docs/requirements/*` and `docs/traceability/traceability_matrix.csv`. See `docs/requirements/REQUIREMENTS_UPDATE_CHECKLIST.md`.

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
