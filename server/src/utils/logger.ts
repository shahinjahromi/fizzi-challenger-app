import winston from 'winston';
import { redactPII } from './maskUtils.js';

export { redactPII };

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

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
