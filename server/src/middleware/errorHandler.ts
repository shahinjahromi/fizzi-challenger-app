import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { AppError } from '../types/index.js';

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env['NODE_ENV'] === 'production';

  logger.error('Request error', {
    correlationId: req.correlationId,
    statusCode,
    code: err.code,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  const responseMessage =
    isProduction && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message;

  res.status(statusCode).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: responseMessage,
      correlationId: req.correlationId,
    },
  });
}
