import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as accountService from '../services/accountService.js';

const router = Router();

const accountParamsSchema = z.object({
  accountId: z.string().uuid(),
});

router.get(
  '/:accountId',
  requireAuth,
  validateRequest({ params: accountParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const account = await accountService.getAccountDetails(req.user.id, req.params['accountId']);
    res.json(account);
  })
);

export default router;
