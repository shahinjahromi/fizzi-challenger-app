import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
  workspaceIds: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      correlationId?: string;
    }
  }
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function createError(message: string, statusCode: number, code?: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  err.isOperational = true;
  return err;
}
