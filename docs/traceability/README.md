# Traceability

This folder maps Loki requirements (`docs/requirements/*`) to implementation evidence in this repo.

## Files
- `traceability_matrix.csv`: Requirement-by-requirement matrix.
- `design_requirement_links.csv`: Design-to-requirement mapping for approved Figma sources and root nodes.

## Status meanings
- **Met**: Implemented with clear evidence in code.
- **Partial**: Some behavior present, but missing required sub-behaviors or acceptance criteria.
- **Not started**: No implementation found.
- **Unknown**: Cannot confirm from the current code surface (often UI-only requirements).

## How to use
1. Start with **Not started** and **Partial** rows.
2. Implement gaps.
3. Add tests.
4. Update the matrix to “Met” with evidence links/paths.
5. When a requirement has a UI design source, update `design_requirement_links.csv` with the Figma file URL, root node, and mapped requirement section before opening a PR.

## Design linkage guidance
- Keep one row per approved design scope or Level 1 design section.
- Record both the **shared provenance node** (for example a Level 1 label or top-level design signpost) and the **concrete screen/frame nodes** used for implementation.
- Use the most stable Figma root node you have for that flow; add child-node references in PRs as implementation gets more specific.
- Link design rows to PRD sections, FR/NFR identifiers, UI contracts, and acceptance-test sections so reviewers can trace design intent to implementation work.
