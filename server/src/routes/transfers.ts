import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as transferService from '../services/transferService.js';

const router = Router();

const internalTransferSchema = z.object({
  workspaceId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive.'),
  memo: z.string().max(255).optional(),
  requestedExecutionDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

const listQuerySchema = z.object({
  workspaceId: z.string().uuid(),
});

router.post(
  '/internal',
  requireAuth,
  validateRequest({ body: internalTransferSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      throw createError('Idempotency-Key header is required.', 400, 'MISSING_IDEMPOTENCY_KEY');
    }

    const result = await transferService.createInternalTransfer({
      userId: req.user.id,
      workspaceId: req.body.workspaceId as string,
      fromAccountId: req.body.fromAccountId as string,
      toAccountId: req.body.toAccountId as string,
      amount: req.body.amount as number,
      memo: req.body.memo as string | undefined,
      idempotencyKey,
      requestedExecutionDate: req.body.requestedExecutionDate as Date | undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
    });

    res.status(201).json(result);
  })
);

router.get(
  '/',
  requireAuth,
  validateRequest({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const transfers = await transferService.listTransfers(
      req.user.id,
      req.query['workspaceId'] as string
    );
    res.json({ data: transfers });
  })
);

export default router;
