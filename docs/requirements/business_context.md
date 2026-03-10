# Business context

## Product purpose
Fizzi Challenger Bank is building a small-business online banking experience to attract deposits for the parent bank by offering a competitive high-yield savings rate, competitive SMB loan rates, and competitive payment processing rates.

## Target customers
- SMBs in US states where the parent bank does not have physical presence (all states west of Colorado).
- Launch target segment: SMBs with under $1M annual revenue and teams under 10 people.
- Future expansion: larger SMBs.

## Scope and phases
This requirements export primarily covers **Phase 1** of the Fizzi Challenger experience (Web app in Angular), with additional requirements tagged in the PRD for future **Phase 2 (Android app)** and **Phase 3 (iOS app)**. The Phase 1 scope includes:
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

## External systems and dependencies
- **Identity & Security:** Customer identity, username/password, MFA, and session management are provided by the Transmit Security Mosaic platform and its APIs/journeys.
- **Core banking:** Accounts, balances, transactions, and limits are sourced from **Nymbus Core** as the system of record, via Nymbus APIs.
- **External account linking:** External account linking and aggregation for ACH and related flows is implemented via **Mastercard Finicity Open Finance** APIs.

## Personas
- Primary Admin (Business Owner): full access across owned entities, initiates transfers/ACH, manages security.
- Authorized User (Bookkeeper): limited to assigned entities and money movement entitlements.
- Bank Ops/Risk (reference persona): configures limits, receives risk alerts, performs overrides.

## Success criteria
Primary business success metric is total deposits attracted for the parent bank.
