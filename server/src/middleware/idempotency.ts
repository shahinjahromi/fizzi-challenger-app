import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'
import { prisma } from '../config/prisma'

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function idempotency(scope: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('Idempotency-Key')
    if (!key) return next()

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    }

    const userId = req.user.userId
    const requestHash = sha256(JSON.stringify(req.body ?? {}))

    const existing = await prisma.idempotencyKey.findUnique({
      where: { userId_scope_key: { userId, scope, key } },
    })

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(409).json({
          error: 'Idempotency-Key conflict',
          code: 'IDEMPOTENCY_CONFLICT',
        })
      }
      return res.status(existing.statusCode).json(existing.responseBody)
    }

    const originalJson = res.json.bind(res)
    res.json = (body: any) => {
      // fire-and-forget persistence to avoid complicating request lifecycle
      prisma.idempotencyKey.create({
        data: {
          userId,
          scope,
          key,
          requestHash,
          responseBody: body,
          statusCode: res.statusCode,
        },
      }).catch(() => {})

      return originalJson(body)
    }

    next()
  }
}
