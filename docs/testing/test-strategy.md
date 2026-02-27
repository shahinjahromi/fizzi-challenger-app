# Test strategy

## Goals
- Ensure core functional requirements behave correctly.
- Prevent regressions in money movement (especially cutoff, insufficient funds, and same-account validation).
- Verify non-functional constraints like masking and no-PII in notification payloads.

## Test layers
### Unit
- Services:
	- `limitService`: tenure defaulting, most-restrictive selection, daily max enforcement.
	- `transferService`: same-account block, insufficient funds block, cutoff behavior.
- Utils:
	- date utilities (cutoff comparisons).

### Integration
- API routes using an ephemeral Postgres (or test container):
	- `/api/auth/login` happy/invalid.
	- `/api/transfers/internal` validation and lifecycle.
	- `/api/transfers/ach` validation and same-day cutoff.

### End-to-end
- Angular flows:
	- Login: loading state + error messaging.
	- Move money: Form → Review → Confirmation.
	- Workspace switch cache invalidation (as implemented).

## Security testing
- Rate limit verification on auth endpoints.
- Ensure error messages do not leak user existence.
- Confirm no sensitive fields are returned from API responses.
