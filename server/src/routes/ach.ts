import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as achService from '../services/achService.js';

const router = Router();

const achTransferSchema = z.object({
  workspaceId: z.string().uuid(),
  direction: z.enum(['Credit', 'Debit']),
  fromAccountId: z.string().uuid(),
  toExternalAccountId: z.string().uuid(),
  amount: z.number().positive(),
  isSameDay: z.boolean().optional(),
  isConsumerDebit: z.boolean().optional(),
  consentId: z.string().optional(),
});

const linkAccountSchema = z.object({
  workspaceId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  maskedAccount: z.string().min(4).max(20),
  routingLast4: z.string().length(4),
});

const consentSchema = z.object({
  externalAccountId: z.string().uuid(),
  consentIp: z.string().ip(),
  disclosuresVersion: z.string().min(1),
  artifacts: z.record(z.unknown()).optional(),
});

const externalAccountParamsSchema = z.object({
  id: z.string().uuid(),
});

const listQuerySchema = z.object({
  workspaceId: z.string().uuid(),
});

router.post(
  '/transfers',
  requireAuth,
  validateRequest({ body: achTransferSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (!idempotencyKey) throw createError('Idempotency-Key header is required.', 400, 'MISSING_IDEMPOTENCY_KEY');

    const result = await achService.createAchTransfer({
      userId: req.user.id,
      workspaceId: req.body.workspaceId as string,
      direction: req.body.direction as 'Credit' | 'Debit',
      fromAccountId: req.body.fromAccountId as string,
      toExternalAccountId: req.body.toExternalAccountId as string,
      amount: req.body.amount as number,
      isSameDay: req.body.isSameDay as boolean | undefined,
      isConsumerDebit: req.body.isConsumerDebit as boolean | undefined,
      consentId: req.body.consentId as string | undefined,
      idempotencyKey,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
    });

    res.status(201).json(result);
  })
);

router.get(
  '/external-accounts',
  requireAuth,
  validateRequest({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const accounts = await achService.listExternalAccounts(
      req.user.id,
      req.query['workspaceId'] as string
    );
    res.json({ data: accounts });
  })
);

router.post(
  '/external-accounts',
  requireAuth,
  validateRequest({ body: linkAccountSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const account = await achService.initiateExternalAccountLink({
      userId: req.user.id,
      workspaceId: req.body.workspaceId as string,
      displayName: req.body.displayName as string,
      maskedAccount: req.body.maskedAccount as string,
      routingLast4: req.body.routingLast4 as string,
    });
    res.status(201).json(account);
  })
);

router.post(
  '/consents',
  requireAuth,
  validateRequest({ body: consentSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await achService.captureConsent({
      userId: req.user.id,
      externalAccountId: req.body.externalAccountId as string,
      consentIp: (req.ip ?? req.body.consentIp) as string,
      disclosuresVersion: req.body.disclosuresVersion as string,
      artifacts: req.body.artifacts as Record<string, unknown> | undefined,
    });
    res.status(201).json(result);
  })
);

router.delete(
  '/external-accounts/:id',
  requireAuth,
  validateRequest({ params: externalAccountParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    await achService.unlinkExternalAccount(req.user.id, req.params['id']);
    res.status(204).send();
  })
);

export default router;
