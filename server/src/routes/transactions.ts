import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as transactionService from '../services/transactionService.js';

const router = Router();

const accountParamsSchema = z.object({
  accountId: z.string().uuid(),
});

const txQuerySchema = z.object({
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

router.get(
  '/:accountId/transactions',
  requireAuth,
  validateRequest({ params: accountParamsSchema, query: txQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await transactionService.listTransactions(
      req.user.id,
      req.params['accountId'],
      {
        status: req.query['status'] as string | undefined,
        cursor: req.query['cursor'] as string | undefined,
        limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
        search: req.query['search'] as string | undefined,
      }
    );
    res.json(result);
  })
);

export default router;
