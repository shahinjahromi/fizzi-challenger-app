import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as statementService from '../services/statementService.js';

const router = Router();

const statementParamsSchema = z.object({
  statementId: z.string().uuid(),
});

router.get(
  '/:statementId/download',
  requireAuth,
  validateRequest({ params: statementParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await statementService.downloadStatement(
      req.user.id,
      req.params['statementId']
    );
    res.json(result);
  })
);

export default router;
