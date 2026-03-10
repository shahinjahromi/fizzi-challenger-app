import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as messageService from '../services/messageService.js';

const router = Router();

const workspaceQuerySchema = z.object({
  workspaceId: z.string().uuid(),
});

const threadParamsSchema = z.object({
  threadId: z.string().uuid(),
});

const sendMessageSchema = z.object({
  fromDisplay: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
});

const createThreadSchema = z.object({
  workspaceId: z.string().uuid(),
  subject: z.string().min(1).max(255),
});

router.get(
  '/threads',
  requireAuth,
  validateRequest({ query: workspaceQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const threads = await messageService.listThreads(
      req.user.id,
      req.query['workspaceId'] as string
    );
    res.json({ data: threads });
  })
);

router.post(
  '/threads',
  requireAuth,
  validateRequest({ body: createThreadSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const thread = await messageService.createThread(
      req.user.id,
      req.body.workspaceId as string,
      req.body.subject as string
    );
    res.status(201).json(thread);
  })
);

router.get(
  '/threads/:threadId',
  requireAuth,
  validateRequest({ params: threadParamsSchema, query: workspaceQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const thread = await messageService.getThread(
      req.user.id,
      req.query['workspaceId'] as string,
      req.params['threadId']
    );
    res.json(thread);
  })
);

router.post(
  '/threads/:threadId/messages',
  requireAuth,
  validateRequest({ params: threadParamsSchema, body: sendMessageSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const workspaceId = (req.query['workspaceId'] ?? req.body.workspaceId) as string;
    if (!workspaceId) throw createError('workspaceId is required.', 400, 'MISSING_WORKSPACE_ID');

    const message = await messageService.sendMessage(
      req.user.id,
      workspaceId,
      req.params['threadId'],
      req.body.fromDisplay as string,
      req.body.body as string
    );
    res.status(201).json(message);
  })
);

router.post(
  '/threads/:threadId/read',
  requireAuth,
  validateRequest({ params: threadParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const workspaceId = req.query['workspaceId'] as string;
    if (!workspaceId) throw createError('workspaceId is required.', 400, 'MISSING_WORKSPACE_ID');

    await messageService.markThreadRead(req.user.id, workspaceId, req.params['threadId']);
    res.json({ message: 'Thread marked as read.' });
  })
);

export default router;
