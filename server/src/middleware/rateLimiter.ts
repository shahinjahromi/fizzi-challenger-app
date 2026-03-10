import rateLimit from 'express-rate-limit';

function parseNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isDevelopment = process.env['NODE_ENV'] === 'development';
const windowMs = parseNumberEnv(process.env['RATE_LIMIT_WINDOW_MS'], 15 * 60 * 1000);
const generalMax = parseNumberEnv(process.env['GENERAL_RATE_LIMIT_MAX'], isDevelopment ? 500 : 100);
const authMax = parseNumberEnv(process.env['AUTH_RATE_LIMIT_MAX'], isDevelopment ? 100 : 10);
const strictMax = parseNumberEnv(process.env['STRICT_RATE_LIMIT_MAX'], isDevelopment ? 50 : 5);

export const generalRateLimiter = rateLimit({
  windowMs,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
});

export const authRateLimiter = rateLimit({
  windowMs,
  max: authMax,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' } },
});

export const strictRateLimiter = rateLimit({
  windowMs,
  max: strictMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again in 15 minutes.' } },
});
