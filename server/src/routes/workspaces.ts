import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as workspaceService from '../services/workspaceService.js';

const router = Router();

const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const workspaces = await workspaceService.listWorkspacesForUser(req.user.id);
    res.json({ data: workspaces });
  })
);

router.get(
  '/:workspaceId/accounts',
  requireAuth,
  validateRequest({ params: workspaceParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const accounts = await workspaceService.listAccountsForWorkspace(
      req.user.id,
      req.params['workspaceId']
    );
    res.json({ data: accounts });
  })
);

export default router;
