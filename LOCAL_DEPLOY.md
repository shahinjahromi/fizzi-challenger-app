# Deploy Sixert Bank on your local dev box

Run the full stack (Angular client + Node API + PostgreSQL) on your machine.

## Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+ running locally (or in Docker)

## 1. Create the database

```bash
# If using local Postgres (macOS Homebrew example):
createdb sixert_bank

# Or with psql:
psql -U postgres -c "CREATE DATABASE sixert_bank;"
```

Use the same user/host/port in `DATABASE_URL` in the next step.

## 2. Clone and install

```bash
cd /path/to/sixert-bank
npm install
```

## 3. Server environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

- **DATABASE_URL** – e.g. `postgresql://YOUR_USER@localhost:5432/sixert_bank` (no password if local trust auth).
- **JWT_ACCESS_SECRET** / **JWT_REFRESH_SECRET** – set to at least 16 characters each.
- **CLIENT_URL** – set to `http://localhost:4201` (client port).
- **PORT** – `4001` (API port).
- **STRIPE_SECRET_KEY** (recommended for external transfers): use your Stripe test key (`sk_test_...`). Each workspace gets a Stripe Connect Express account; "Transfer to external bank" (DEBIT) creates a **Transfer** to that account so you can see it in **Stripe Dashboard → Connect → Transfers**. In test mode, add test balance (Dashboard → Balance → "Add test funds") so transfers can complete.
- Optional: **NYMBUS_BASE_URL** if you use the Nymbus mock.

## 4. Database migrations and Prisma client

From the **server** directory:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

(Use `npx prisma migrate dev` if you prefer and are doing schema changes.)

## 5. Seed (optional)

For demo users and data:

```bash
cd server
npm run db:seed
```

Seed creates demo users: **alice**, **bob**, **carol**, **dave** (password: **demo1234**). Use any of these to log in.

## 6. Start the app

From the **repo root**:

```bash
npm run dev
```

This starts:

- **API** at `http://localhost:4001`
- **Client** at `http://localhost:4201` (proxies `/api` to the server)

Open **http://localhost:4201** in your browser.

## One-time setup summary

```bash
createdb sixert_bank
cd /path/to/sixert-bank
npm install
cd server && cp .env.example .env
# Edit .env (DATABASE_URL, JWT secrets, CLIENT_URL=http://localhost:4201)
npx prisma generate && npx prisma migrate deploy
npm run db:seed   # optional
cd .. && npm run dev
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Could not resolve @prisma/client` | Run `npm install` then `npx prisma generate` from the **server** directory. |
| DB connection refused | Ensure Postgres is running and `DATABASE_URL` host/port/user match. |
| Client can’t reach API | Use `npm run dev` from the repo root so the client proxy is active; open http://localhost:4201. |
| Port in use | Change `PORT` in `server/.env` and/or the client port in `client/package.json` (`ng serve --port …`). |
