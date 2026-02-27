# API contracts

## Principles
- APIs must be scoped by workspace/entity.
- All money movement submissions must support idempotency.
- Lifecycle status must be consistent across internal transfers and ACH.
- Notifications must not leak PII.

## Auth
### POST /auth/login
Request:
- identifier (username or email)
- password
- mfa (optional, when required)

Response:
- accessToken
- user profile including entitled workspaces

### GET /me
Response:
- user profile
- workspaces
- lastLoginAt

### Account recovery
- Forgot password flow that returns to clean state on completion.
- Forgot username flow that does not display username in-app and delivers via verified channel.

## Workspaces
### GET /workspaces
Response:
- list of workspaces user is entitled to

## Accounts
### GET /workspaces/{workspaceId}/accounts
Response:
- accounts list with balances and eligibility flags

### GET /accounts/{accountId}
Response:
- account details including masked routing/account display fields where applicable

## Transactions
### GET /accounts/{accountId}/transactions
Query params:
- status (optional)
- cursor/page
- sort=desc (default)

Response:
- list of transactions with stable sorting and lifecycle fields

## Internal transfers
### POST /transfers/internal
Headers:
- Idempotency-Key

Request:
- workspaceId
- fromAccountId
- toAccountId
- amount
- memo (optional)
- requestedExecutionDate (optional, business-day constrained)

Behavior:
- Validate eligibility, same-account, sufficient funds.
- Apply cutoff (1:00 PM ET) and business-day posting rules.
- Create paired ledger entries.
- Attach limit decision snapshot.

Response:
- transferId
- status (Pending)
- referenceId
- effectiveDate
- createdAt

## ACH
### POST /ach/transfers
Headers:
- Idempotency-Key

Request:
- workspaceId
- direction (Inbound | Outbound)
- from (internal account reference)
- to (external account reference or ad hoc routing/account)
- amount
- requestedExecutionDate (optional)
- isConsumerDebit (boolean)
- consentId (required when isConsumerDebit is true)

Behavior:
- Validate routing/account.
- Enforce lifecycle and cutoff.
- Enforce consent requirement for consumer debit.
- Attach limit decision snapshot.

Response:
- achTransferId
- status
- referenceId
- effectiveDate
- createdAt

## Statements
### GET /accounts/{accountId}/statements
Response:
- list of available statement months only

### GET /statements/{statementId}/download
Response:
- PDF payload (non-empty)

## Messaging
### GET /messages/threads
### GET /messages/threads/{threadId}
### POST /messages/threads/{threadId}/messages
### POST /messages/threads/{threadId}/read

Behavior:
- Threads ordered chronologically.
- Draft persistence must be supported (implementation-specific).

## Notifications
- Notifications must contain threadId for message deep links.
- Notifications must not contain message body or PII.

## Limits
### GET /limits/tiers
### GET /limits/assignments
Query params:
- subjectType
- subjectId

### POST /limits/decide
Headers:
- Idempotency-Key

Request:
- workspaceId
- userId
- accountId (optional)
- transferType (Internal | ACH)
- amount
- executionDate
- sameDayAch (optional)

Response:
- decision (Allowed | Blocked)
- friendlyReason (when blocked)
- appliedTierSummary (non-sensitive)
- thresholdsSnapshot

Notes:
- Decisioning should be briefly cacheable (e.g., 30 seconds) but must be re-checked at commit time to avoid inconsistencies.
