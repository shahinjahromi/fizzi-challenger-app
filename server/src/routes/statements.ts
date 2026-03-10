import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as statementService from '../services/statementService.js';

const router = Router();

const accountParamsSchema = z.object({
  accountId: z.string().uuid(),
});

const statementParamsSchema = z.object({
  statementId: z.string().uuid(),
});

router.get(
  '/:accountId/statements',
  requireAuth,
  validateRequest({ params: accountParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const statements = await statementService.listStatements(
      req.user.id,
      req.params['accountId']
    );
    res.json({ data: statements });
  })
);

export { statementParamsSchema };
export default router;
