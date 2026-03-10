import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const REDACTED = '[REDACTED]';

const PII_FIELDS = new Set([
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'email', 'ssn', 'taxId', 'accountNumber', 'routingNumber',
  'cardNumber', 'cvv', 'pin', 'secret',
]);

export function redactPII(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(redactPII);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = PII_FIELDS.has(key.toLowerCase()) ? REDACTED : redactPII(value);
    }
    return result;
  }
  return obj;
}

const isDev = process.env['NODE_ENV'] !== 'production';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    isDev
      ? combine(colorize(), simple())
      : json()
  ),
  transports: [new winston.transports.Console()],
});

export function withCorrelation(correlationId: string) {
  return logger.child({ correlationId });
}

export default logger;
