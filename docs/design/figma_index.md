# Figma Level 1 design index

This file records the approved Figma design scopes that are allowed to drive UI implementation in this repo.

Use it together with `docs/traceability/design_requirement_links.csv`:

- `figma_index.md` explains the design scope in human-readable form.
- `design_requirement_links.csv` is the structured, PR-friendly mapping file.

## Current approved Figma source

- **File:** OMB Future State
- **URL:** https://www.figma.com/design/6frH5xNjfyojd27BK3E07a/OMB-Future-State?node-id=4331-50291&t=dmNyCWTOIxxgdIwM-1
- **Original user-provided provenance node:** `4331:50291`
- **Confirmed design label:** `Level 1`

## Provenance recovered from the shared Level 1 link

- The provided node `4331:50291` is a shared `Level 1` label, not an implementation frame by itself.
- A nearby confirmed frame in the same design area is `4331:50233` (`5404.4.2 - Manage Account - Lock Card - Multiple Cards Detail`).
- That nearby frame appears to belong to card-management flows and is **not currently linked** to the banking requirements in this repo.
- For repo linkage, the usable banking-specific implementation frames confirmed so far are on the `Move Money` canvas (`0:1`).

## Confirmed banking-specific frames on the Move Money canvas

| Purpose | Node ID | Notes |
|---|---|---|
| Move Money canvas | `0:1` | Banking-specific page/canvas used for money-movement flows. |
| Move Money hub container | `293:17749` | Hub with entry cards for Internal Transfer, External Transfer, and Send Money, plus Manage Linked Accounts CTA. |
| Internal transfer form | `228:14616` | Desktop frame containing the Internal Transfer data-entry form. |
| Internal transfer review | `293:20409` | Explicit review step frame (`OMB Move Money Step 4`). |
| External transfer form | `110:7409` | Desktop frame containing the External Transfer data-entry form. |
| Linked accounts card | `310:22432` | Concrete linked-accounts list card used inside the money-movement screen. |
| Linked accounts parent screen | `302:21650` | Larger Move Money screen containing the linked-accounts card and Manage Linked Accounts entry point. |

## Level 1 mappings currently linked

| Design scope | PRD section | Requirement linkage | Notes |
|---|---|---|---|
| Move Money landing hub | `§7. Money Movement – Internal Transfers` | `FR-039`; `docs/requirements/ui_contracts.md` → `Money movement > Move Money landing hub` | Use `293:17749` as the concrete hub frame. It contains Internal Transfer, External Transfer, Send Money, and the Manage Linked Accounts CTA. |
| Internal transfer form | `§7. Money Movement – Internal Transfers` | `FR-032`; `FR-033`; `FR-034`; `FR-035`; `FR-038`; `FR-040`; `docs/requirements/ui_contracts.md` → `Money movement > Internal transfer` | Use `228:14616` as the concrete data-entry frame for internal transfer implementation. |
| Internal transfer review | `§7. Money Movement – Internal Transfers` | `FR-035`; `FR-036`; `FR-037`; `FR-038`; `docs/requirements/acceptance_tests.md` → `Internal transfers` | Use `293:20409` as the explicit review-step frame. It is the strongest confirmed match for masked details and review confirmation behavior. |
| External transfer / ACH entry | `§8. Money Movement – ACH (Inbound/Outbound)` | `FR-041`; `FR-042`; `FR-043`; `FR-044`; `FR-045`; `docs/requirements/ui_contracts.md` → `Money movement > ACH`; `docs/requirements/acceptance_tests.md` → `ACH` | Use `110:7409` as the concrete external-transfer form frame. |
| Linked accounts management | `§8. Money Movement – ACH (Inbound/Outbound)` | `FR-046`; `docs/requirements/ui_contracts.md` → `Money movement > Move Money landing hub`; `docs/requirements/acceptance_tests.md` → `ACH` | Use `310:22432` for the linked-accounts list UI and `302:21650` as the larger parent screen containing the Manage Linked Accounts experience. |

## Working rules

1. Only link requirements to a Figma source once the file URL and root node are stable enough for reviewers to revisit.
2. Start with the highest-confidence Level 1 provenance node for a flow, but always capture the concrete screen/frame nodes actually used for implementation.
3. If a PR changes UI without a mapped design row, add the row here and in `docs/traceability/design_requirement_links.csv` before requesting review.
4. Do not force-link unrelated Level 1 areas to repo requirements; keep provenance-only nodes documented separately when they do not map cleanly to the PRD.
