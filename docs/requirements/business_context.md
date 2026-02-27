# Business context

## Product purpose
Sixert Bank is building a small-business online banking experience to attract deposits for the parent bank by offering a competitive high-yield savings rate, competitive SMB loan rates, and competitive payment processing rates.

## Target customers
- SMBs in US states where the parent bank does not have physical presence (all states west of Colorado).
- Launch target segment: SMBs with under $1M annual revenue and teams under 10 people.
- Future expansion: larger SMBs.

## Scope (Phase 1)
This requirements export covers the web app experience (Angular) for:
- Authentication and session management
- Multi-entity workspaces
- Accounts overview
- Account details and activity
- Money movement (internal transfers and ACH)
- Statements and documents
- Messaging and notifications
- Profile and security center
- Limits and approvals (tiered by tenure and standing)

## Explicit out of scope (Phase 1)
- Full dual-approval workflows
- Wires
- Complex entitlements UI
- Banker desktop/back-office UIs, except where explicitly required for overrides

## Personas
- Primary Admin (Business Owner): full access across owned entities, initiates transfers/ACH, manages security.
- Authorized User (Bookkeeper): limited to assigned entities and money movement entitlements.
- Bank Ops/Risk (reference persona): configures limits, receives risk alerts, performs overrides.

## Success criteria
Primary business success metric is total deposits attracted for the parent bank.
