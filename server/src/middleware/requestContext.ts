import { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'

declare global {
  // eslint-disable-next-line no-var
  var __sixertRequestContext: unique symbol
}

declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const headerId = req.header('X-Correlation-Id')
  const correlationId = (headerId && headerId.trim().length > 0) ? headerId.trim() : randomUUID()
  req.correlationId = correlationId
  res.setHeader('X-Correlation-Id', correlationId)
  next()
}
