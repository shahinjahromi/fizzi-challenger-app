# Requirements update checklist (PRD-first + change log)

Use this workflow when you revise requirements so that human-friendly PRD edits stay in sync with the structured artifacts and traceability.

---

## 1. Edit the PRD first

- **File:** `docs/Fizzi_Challenger_PRD.md`
- Revise in plain language: add, remove, or change sections, functional requirements, business rules, DRyVE items, and acceptance criteria.
- No need to mention requirement IDs (FR-xxx, NFR-xxx) in the PRD; those live in the derived artifacts.

---

## 2. Add a change log entry

- **File:** `docs/requirements/change_log.md`
- Add a new dated entry **before** or **right after** you (or the agent) propagate changes.
- Include:
  - **Date** (and timezone if useful).
  - **Summary** of what changed (e.g. “Added MFA requirement for login”, “Removed FR-040”, “Clarified ACH cutoff rules”).
  - **Impacted requirement IDs** (e.g. FR-009, FR-038; or “New: FR-090, FR-091”).
  - **Assumptions or decisions** (optional), if the change introduces new assumptions or affects other docs.

Use the template below when adding an entry.

---

## 3. Propagate PRD changes to requirements artifacts

Using the PRD and the latest change log entry as the source of truth:

- **`docs/requirements/functional_requirements.md`**  
  Add, remove, or update lines so each requirement has a single FR-xxx line; keep IDs stable unless you are intentionally renaming or retiring one.
- **`docs/requirements/non_functional_requirements.md`**  
  Same for NFR-xxx when the PRD changes non-functional or cross-cutting concerns.
- **`docs/requirements/acceptance_tests.md`**  
  Update scenario bullets to match new or changed acceptance criteria in the PRD.
- **Other artifacts** (e.g. `business_context.md`, `api_contracts.md`, `data_contracts.md`, `ui_contracts.md`, `glossary.md`, `decisions.md`)  
  Update only when the PRD change affects scope, contracts, or terminology.

---

## 4. Update the traceability matrix

- **File:** `docs/traceability/traceability_matrix.csv`
- For **new** requirement IDs: add a row with Requirement ID, Area, Requirement summary, Status (e.g. `Not started`), and leave Evidence/Gap/Next steps blank or filled as needed.
- For **removed** IDs: remove the corresponding row(s).
- For **changed** requirement text: update the “Requirement summary” column so it matches the updated wording in `functional_requirements.md` or `non_functional_requirements.md`.
- Leave Status/Evidence/Gap/Next steps as-is unless you are deliberately updating implementation status.

---

## Change log entry template

Copy this block into `change_log.md` when you add an entry:

```markdown
## YYYY-MM-DD [HH:MM] [Timezone]
- <One-line summary of the change.>
- <Optional: second bullet.>

Impacted requirement IDs:
- FR-xxx, FR-yyy (or "New: FR-090, FR-091" / "Removed: FR-040")

Assumptions / decisions (optional):
- <Any new assumption or decision that other docs or the agent should know.>
```

---

## Quick reference

| Step | Action |
|------|--------|
| 1 | Edit `docs/Fizzi_Challenger_PRD.md` (human-friendly language). |
| 2 | Add a dated entry in `docs/requirements/change_log.md` (summary + impacted IDs). |
| 3 | Update `functional_requirements.md` / `non_functional_requirements.md` / `acceptance_tests.md` (and other artifacts as needed) from the PRD. |
| 4 | Update `docs/traceability/traceability_matrix.csv` (add/remove/update rows for affected IDs). |

When using Cursor or Copilot, you can ask it to: *“Apply the latest change log entry to the requirements folder and traceability matrix.”*
