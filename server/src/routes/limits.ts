import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as limitService from '../services/limitService.js';

const router = Router();

const decideSchema = z.object({
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  transferType: z.enum(['Internal', 'ACH']),
  isSameDay: z.boolean().optional(),
});

const assignmentsQuerySchema = z.object({
  subjectType: z.enum(['User', 'Account', 'Workspace']).optional(),
  subjectId: z.string().uuid().optional(),
});

router.get(
  '/tiers',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const tiers = await limitService.listTiers();
    res.json({ data: tiers });
  })
);

router.get(
  '/assignments',
  requireAuth,
  validateRequest({ query: assignmentsQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const assignments = await limitService.listAssignments(
      req.query['subjectType'] as string | undefined,
      req.query['subjectId'] as string | undefined
    );
    res.json({ data: assignments });
  })
);

router.post(
  '/decide',
  requireAuth,
  validateRequest({ body: decideSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const decision = await limitService.decideLimits({
      userId: req.body.userId as string,
      accountId: req.body.accountId as string,
      amount: req.body.amount as number,
      transferType: req.body.transferType as 'Internal' | 'ACH',
      isSameDay: req.body.isSameDay as boolean | undefined,
      correlationId: req.correlationId,
    });
    res.json({ decision });
  })
);

export default router;
