# Deploy Sixert Bank to Vercel

## What’s configured

- **Frontend**: Angular app is built and served from `client/dist/client/browser`.
- **Backend**: Express app runs as a Vercel serverless function; all `/api/*` requests are handled by it.
- **Build**: Root `npm run build` builds the server (with Prisma generate) then the client. Vercel runs `prisma generate` in `server` then this build.

## Deploy steps

1. **Connect the repo to Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New → Project.
   - Import **shahinjahromi/sixert_bank** from GitHub.
   - Leave “Override” unchecked so it uses the repo’s `vercel.json`.

2. **Set environment variables** (Project → Settings → Environment Variables)
   Add these for **Production** (and Preview if you want the same config):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | `postgresql://...` | Your production Postgres URL (e.g. Vercel Postgres, Neon, Railway). |
   | `JWT_ACCESS_SECRET` | (min 16 chars) | Same as local or a new secret. |
   | `JWT_REFRESH_SECRET` | (min 16 chars) | Same as local or a new secret. |
   | `CLIENT_URL` | `https://<your-app>.vercel.app` | Your Vercel frontend URL (no trailing slash). |
   | `NYMBUS_BASE_URL` | (optional) | Nymbus API URL if you use it. |
   | `STRIPE_SECRET_KEY` | (optional) | For Stripe payouts. |

   Do **not** set `PORT`; Vercel ignores it.

3. **Deploy**
   - Click Deploy. Vercel will run the build and deploy.
   - After deploy, set **CLIENT_URL** to the URL Vercel gives you (e.g. `https://sixert-bank-xxx.vercel.app`) and redeploy if you changed it.

4. **Database**
   - Use a hosted Postgres (Neon, Vercel Postgres, Railway, etc.) and set `DATABASE_URL`.
   - Run migrations against that DB (e.g. locally: `DATABASE_URL="your-prod-url" npm run db:migrate --workspace=server`).
   - Optionally seed: `DATABASE_URL="your-prod-url" npm run db:seed --workspace=server`.

## 404 NOT_FOUND on the root URL

If `https://your-app.vercel.app/` returns `{"error":"Not found","code":"NOT_FOUND"}` (your Express API’s 404), the request is hitting the API instead of the Angular app. Fix it as follows.

1. **Root Directory**  
   In Vercel: **Project → Settings → General → Root Directory**  
   - For **full stack** (client + API): leave **empty** (or `.`).  
   - If this is set to `client`, only the client is deployed and the repo’s `vercel.json` is ignored; the API then isn’t deployed and `/api` calls can 404. For full stack, clear Root Directory and redeploy.

2. **Output Directory**  
   In **Settings → Build & Development Settings**, leave **Output Directory** empty so the repo’s `vercel.json` is used (`client/dist/client/browser`). If you set a value here, it overrides `vercel.json` and can break static serving.

3. **Build logs**  
   In the latest deployment, open **Building** and confirm:
   - `npm run build` runs and the **client** build finishes (e.g. “Application bundle generation complete”).
   - There are no errors; the client output is under `client/dist/client/browser` (including `index.html`).

4. **Redeploy**  
   After changing Root Directory or Output Directory, trigger a new deployment (e.g. push a commit or **Redeploy** in the Vercel dashboard).

---

## Local test with Vercel CLI

```bash
npm i -g vercel
vercel login
vercel dev
```

This uses your `vercel.json` and runs the app in a Vercel-like way locally.
