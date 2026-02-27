# Sixert Bank — Architecture Overview

## Scope
This repository implements a web banking experience with a Node.js API and an Angular client.

The requirements source of truth is in `docs/requirements/*`.

## High-level architecture
- **Client**: Angular SPA (`client/`) that authenticates, selects workspaces, and renders account and money movement flows.
- **API**: Express + TypeScript (`server/`) providing authenticated endpoints.
- **Database**: Postgres via Prisma.
- **External providers (planned / partially stubbed)**:
	- **Stripe** for outbound payouts in some flows.
	- **Nymbus** provisioning hooks (best-effort on login).

## Module boundaries (server)
- `server/src/routes/*`: HTTP route handlers, request validation, auth middleware.
- `server/src/services/*`: Business logic, orchestration, and external provider calls.
- `server/src/middleware/*`: auth, validation, rate limiting, error handling.
- `server/prisma/*`: schema, migrations, seed.

## Key design principles (requirements-driven)
- Mask account identifiers in any customer-facing surface.
- Avoid PII in notifications.
- Money movement should be retry-safe and support idempotency keys.
- Lifecycle semantics must avoid premature success.

## Gaps / next hardening steps
- Add Idempotency-Key persistence for transfer submissions.
- Add audit log model + event emission for auth, transfers, limits, consents.
- Add cutoff + business-day calendar utilities (holiday support).
