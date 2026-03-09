# Data contracts

## Conceptual entities
These contracts describe the fields needed to satisfy product and engineering behaviors. Field names are illustrative and can be adapted to the codebase naming conventions.

## User
- id
- role (PrimaryAdmin | AuthorizedUser)
- workspaces[] (list of Workspace references)
- lastLoginAt

## Workspace
- id
- name

## Account
- id
- workspaceId
- name
- last4
- type
- availableBalance
- currentBalance
- routingLast4 (optional, for masked display)
- interestRate (optional)
- interestEarned (optional)
- isMoveMoneyEligible
- status (Open | Closed)

## Transaction
- id
- accountId
- createdAt
- postedAt (optional)
- amount
- currency
- direction (Debit | Credit)
- status (Pending | Posted | Failed | OnHold)
- description
- counterpart (optional)
- referenceId (optional)

## Message
- id
- threadId
- createdAt
- fromDisplay
- subject
- body
- isRead
- draftState (optional)

## Statement
- id
- accountId
- month (YYYY-MM)
- downloadUrl or downloadToken

## ExternalAccount (linked)
- id
- displayName
- maskedAccount (last4)
- routingLast4 (optional)
- provider (Mastercard Finicity Open Finance)
- status (Linked | Error | Pending)

## Consent (ACH Level-3 for consumer debit)
- id
- userId
- externalAccountId
- consentedAt
- consentIp
- disclosuresVersion
- artifacts (optional attachment references)

## Limits
### LimitTier
- id
- name (internal)
- rules
  - perTxnMax
  - dailyCreditMax
  - dailyDebitMax
  - monthlyCreditMax
  - monthlyDebitMax
  - velocity (optional)
  - sameDayACHMax (optional)

### LimitAssignment
- id
- subjectType (User | Account)
- subjectId
- tierId
- effectiveFrom
- effectiveTo (optional)
- overrideReason (optional)
- assignedBy (banker user reference)
- createdAt

### LimitDecision (captured on transfer submission)
- id
- subjectUserId
- subjectAccountId (optional)
- appliedTierIds[]
- appliedThresholdsSnapshot
- evaluatedAt
- outcome (Allowed | Blocked)
- blockReason (optional)

## Notes
- Customer-facing UI must not display internal limit tier names.
- Auditability requires that LimitDecision captures the thresholds used at decision time.
