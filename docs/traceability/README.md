# Traceability

This folder maps Loki requirements (`docs/requirements/*`) to implementation evidence in this repo.

## Files
- `traceability_matrix.csv`: Requirement-by-requirement matrix.

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
