import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationTargets {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validateRequest(schemas: ValidationTargets) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        mergeZodErrors(errors, result.error, 'body');
      } else {
        req.body = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        mergeZodErrors(errors, result.error, 'params');
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        mergeZodErrors(errors, result.error, 'query');
      } else {
        req.query = result.data as Record<string, string>;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          fields: errors,
        },
      });
      return;
    }

    next();
  };
}

function mergeZodErrors(
  target: Record<string, string[]>,
  zodError: ZodError,
  prefix: string
): void {
  for (const issue of zodError.issues) {
    const path = [prefix, ...issue.path.map(String)].join('.');
    if (!target[path]) target[path] = [];
    target[path].push(issue.message);
  }
}
