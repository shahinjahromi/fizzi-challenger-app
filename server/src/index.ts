import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

import { correlationIdMiddleware } from './middleware/correlationId.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import authRouter from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import accountsRouter from './routes/accounts.js';
import transactionsRouter from './routes/transactions.js';
import transfersRouter from './routes/transfers.js';
import achRouter from './routes/ach.js';
import accountStatementsRouter from './routes/statements.js';
import statementsDownloadRouter from './routes/statementsDownload.js';
import messagesRouter from './routes/messages.js';
import limitsRouter from './routes/limits.js';
import profileRouter from './routes/profile.js';
import nymbusRouter from './routes/nymbus.js';

const app = express();

// Trust Azure App Service reverse proxy (X-Forwarded-For, X-Forwarded-Proto)
app.set('trust proxy', 1);

// ─── Security & Core Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env['CLIENT_URL'] ?? 'http://localhost:4201',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(correlationIdMiddleware);
app.use(generalRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// All routes are mounted under /api so the Angular client can call /api/*
// directly in production (without a dev-server proxy rewrite).
const api = express.Router();
api.use('/auth', authRouter);
api.use('/workspaces', workspacesRouter);
api.use('/accounts', accountsRouter);
api.use('/accounts', transactionsRouter);
api.use('/accounts', accountStatementsRouter);
api.use('/statements', statementsDownloadRouter);
api.use('/transfers', transfersRouter);
api.use('/ach', achRouter);
api.use('/messages', messagesRouter);
api.use('/limits', limitsRouter);
api.use('/profile', profileRouter);
api.use('/nymbus', nymbusRouter);

app.use('/api', api);

// Legacy: keep bare paths working for local dev / backwards compat
app.use('/auth', authRouter);
app.use('/workspaces', workspacesRouter);
app.use('/accounts', accountsRouter);
app.use('/accounts', transactionsRouter);
app.use('/accounts', accountStatementsRouter);
app.use('/statements', statementsDownloadRouter);
app.use('/transfers', transfersRouter);
app.use('/ach', achRouter);
app.use('/messages', messagesRouter);
app.use('/limits', limitsRouter);
app.use('/profile', profileRouter);
app.use('/nymbus', nymbusRouter);

// ─── Serve Angular SPA in production ──────────────────────────────────────────
if (process.env['NODE_ENV'] === 'production') {
  const clientDist = path.resolve(__dirname, '../public');
  app.use(express.static(clientDist));
  // SPA fallback — anything not matching /api or a static file → index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── 404 (API routes only) ────────────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env['PORT'] ?? '4001', 10);

app.listen(PORT, () => {
  logger.info(`Fizzi Challenger Bank server listening on port ${PORT}`, {
    nodeEnv: process.env['NODE_ENV'],
    port: PORT,
  });
});

export default app;
