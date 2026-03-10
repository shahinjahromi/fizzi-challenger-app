# Deploy Fizzi Challenger Bank server to Render

This walks you through hosting the **Node/Express API** on Render (always-on). Use **Vercel** for the Angular client, or host the client on Render as a Static Site too.

---

## Part 1: Create a Render account and connect GitHub

1. Go to **[render.com](https://render.com)** and sign up (or log in).
2. Click **Dashboard** → **Connect account** (or **Add new** → **GitHub**).
3. Connect your GitHub account and allow Render to access your repos.
4. Choose **Only select repositories** and pick **shahinjahromi/fizzi_challenger_bank** (or your fork). Save.

---

## Part 2: Create a PostgreSQL database (optional but recommended)

1. In the Render dashboard, click **New +** → **PostgreSQL**.
2. Set:
   - **Name:** `fizzi-challenger-bank-db` (or any name).
   - **Region:** Pick one close to you (e.g. Oregon).
   - **Plan:** **Free** (expires after 90 days; then upgrade or migrate).
3. Click **Create Database**.
4. Wait until the DB is **Available**. Open it and copy the **Internal Database URL** (use this for the server; it’s only for services on Render). If the client runs elsewhere, you can use the **External Database URL** for running migrations from your machine.

---

## Part 3: Create the Web Service (API)

1. In the dashboard, click **New +** → **Web Service**.
2. **Connect repository:** Select **shahinjahromi/fizzi_challenger_bank** (or your repo). Click **Connect**.
3. **Configure:**
   - **Name:** `fizzi-challenger-bank-api` (or any name).
   - **Region:** Same as the DB (e.g. Oregon).
   - **Branch:** `main`.
   - **Root Directory:** Click **Add root directory** and enter **`server`**. (So Render only builds/deploys the `server` folder.)
   - **Runtime:** **Node**.
   - **Build Command:**  
     `npx prisma generate && npm run build`  
     (Generates Prisma client, then runs `tsc`.)
   - **Start Command:**  
     `npm start`  
     (Runs `node dist/index.js`.)
   - **Plan:** **Free** (spins down after ~15 min idle) or **Starter $7/mo** (always on).

4. **Environment variables** (click **Add Environment Variable** and add these):

   | Key | Value | Notes |
   |-----|--------|--------|
   | `NODE_ENV` | `production` | |
   | `DATABASE_URL` | *(from Postgres)* | In the DB’s page, copy **Internal Database URL** and paste here. Render can also auto-add it if you link the DB in the service (see below). |
   | `JWT_ACCESS_SECRET` | *(min 16 chars)* | Use a long random string (e.g. `openssl rand -base64 24`). |
   | `JWT_REFRESH_SECRET` | *(min 16 chars)* | Another long random string. |
   | `CLIENT_URL` | `https://your-app.vercel.app` | Your Angular app URL (Vercel URL), **no trailing slash**. |

   Optional:

   - `NYMBUS_BASE_URL` – Nymbus API URL if you use it.
   - `STRIPE_SECRET_KEY` – Stripe test/live key if you use it.

   **Linking the database (optional):** In the Web Service, go to **Environment** → **Add Environment Group** or **Link Resource** and link your Postgres DB. Render will inject `DATABASE_URL` for you so you don’t have to paste it.

5. **Do not** set `PORT`. Render sets `PORT` automatically; your app already uses `env.PORT`.

6. Click **Create Web Service**. Render will clone the repo, run the build, then start the server.

7. Wait for the first deploy to finish. The service URL will look like:  
   `https://fizzi-challenger-bank-api.onrender.com`

---

## Part 4: Run database migrations (one-time)

Your app expects the Prisma schema to be applied. Run migrations against the Render Postgres:

**Option A – From your machine (easiest)**  
Use the **External Database URL** from the Render Postgres page (only if the DB allows external connections; free tier sometimes does):

```bash
cd server
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require" npx prisma migrate deploy
```

**Option B – From Render shell**  
In the Web Service → **Shell** tab, run:

```bash
npx prisma migrate deploy
```

(Here `DATABASE_URL` is already set by Render.)

**Optional – Seed data:**

```bash
DATABASE_URL="..." npx prisma db seed
# or in Render Shell:
npx prisma db seed
```

---

## Part 5: Point the Angular app (Vercel) at the API

1. In **Vercel**, open your frontend project → **Settings** → **Environment Variables**.
2. Add:
   - **Key:** `VITE_API_URL` or `NG_APP_API_URL` (or whatever your Angular app reads).
   
   If your app currently calls **relative** `/api/...`, it will keep calling the same origin (Vercel). To call Render instead you have two options:

   **A) Use a single Vercel deployment (client + serverless API)**  
   Keep the current setup: client and API both on Vercel; no Render needed for the API.

   **B) Use Vercel for client only and Render for API**  
   - Deploy the **client** to Vercel with the API base URL set to your Render URL.
   - In Angular you need to use an environment variable for the API base (e.g. `https://fizzi-challenger-bank-api.onrender.com`) and send all `/api` requests there instead of relative. That usually means:
     - Add something like `apiUrl` in `environment.ts` (or env) and use it in your HTTP calls.
     - Set that in Vercel env (e.g. `NG_APP_API_URL=https://fizzi-challenger-bank-api.onrender.com`) and rebuild.

3. In **Render**, ensure **CLIENT_URL** is set to your Vercel URL (e.g. `https://fizzi-challenger-bank-client.vercel.app`) so CORS allows the frontend.

---

## Part 6: (Optional) Deploy the client on Render as a Static Site

If you prefer everything on Render:

1. **New +** → **Static Site**.
2. Connect the same repo, **Branch** `main`.
3. **Root Directory:** `client`.
4. **Build Command:** `npm install && npm run build`.
5. **Publish Directory:** `dist/client/browser` (Angular output).
6. Add env var for the API URL if your app uses it (e.g. for `environment.production.apiUrl`).
7. Create the site. After deploy, set the API’s **CLIENT_URL** to this static site’s URL.

---

## Summary

| What | Where | URL |
|------|--------|-----|
| API (Express) | Render Web Service | `https://fizzi-challenger-bank-api.onrender.com` |
| DB | Render Postgres | (internal URL only; use External for migrations) |
| Client (Angular) | Vercel or Render Static Site | Your choice |

**Free tier notes:**  
- Render free Web Service **spins down** after ~15 min idle; the first request after that can take 30–60 seconds (cold start).  
- For always-on, use **Starter ($7/mo)**.  
- Postgres free tier expires after 90 days; then upgrade or export data and move to another provider.
