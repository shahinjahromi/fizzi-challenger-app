import { Router } from 'express';
import { asyncHandler, createError } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import * as profileService from '../services/profileService.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const profile = await profileService.getProfile(req.user.id);
    res.json(profile);
  })
);

router.get(
  '/security',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const security = await profileService.getSecurityCenter(req.user.id);
    res.json(security);
  })
);

export default router;
