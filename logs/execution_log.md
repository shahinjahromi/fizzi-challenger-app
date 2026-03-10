# Execution Log

## Date:

- [x] 2026-03-09: Initial repository setup with documentation and requirements
- [x] 2026-03-10: v0.1.0 — Initial implementation of server and client codebases

---

## 2026-03-10 — v0.1.0 Build Log

### Summary
First implementation build based on requirements snapshot `2026-03-10`. See `logs/requirements_version_log.md` for full requirements-to-code mapping.

### What was built
- **Server** (`server/`): Node.js + TypeScript + Express + Prisma + PostgreSQL
  - 19 Prisma models covering all data contract entities
  - Auth, Workspaces, Accounts, Transactions, Transfers, ACH, Statements, Messaging, Limits, Profile/Security routes
  - SOLID architecture: SRP services, OCP interfaces, DIP via function-level injection
  - Middleware: JWT auth, correlation ID, rate limiting, Zod validation, error handler
  - Seed data: alice, bob, carol, dave (password: demo1234)

- **Client** (`client/`): Angular 17 standalone-component SPA
  - Login, Workspace Selector, Dashboard, Account Detail, Move Money Hub
  - Internal Transfer (3-step Form → Review → Confirm)
  - Statements, Messaging (inbox + thread), Profile, Security Center
  - Auth interceptor (Bearer + 401 refresh), correlation ID interceptor
  - Auth guard, workspace guard

- **Infrastructure**
  - Root `package.json` with `npm run dev` (concurrently starts both)
  - `azure-pipelines.yml` — CI/CD for staging (develop branch) + production (main branch)
  - Updated `.gitignore` for Node/Angular artifacts

### Requirements coverage
- FR-001 to FR-088 scaffolded; see `logs/requirements_version_log.md` for status per FR
- NFR-001 to NFR-029 scaffolded; security, reliability, and observability foundations in place

### Local dev setup
```bash
cd server && cp .env.example .env
# Edit .env: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npx prisma migrate dev --name init
npm run db:seed
cd ..
npm install          # installs concurrently at root
npm run dev          # API on :4001, Client on :4201
```

---

### Template:
Use this document to track the execution of various builds and logs.