import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../types/index.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter, strictRateLimiter } from '../middleware/rateLimiter.js';
import * as authService from '../services/authService.js';

const router = Router();

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

const forgotUsernameSchema = z.object({
  email: z.string().email(),
});

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.login({
      usernameOrEmail: req.body.usernameOrEmail as string,
      password: req.body.password as string,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
    });
    res.json(result);
  })
);

router.post(
  '/refresh',
  validateRequest({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refreshTokens(req.body.refreshToken as string);
    res.json(tokens);
  })
);

router.post(
  '/logout',
  requireAuth,
  validateRequest({ body: logoutSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    await authService.logout(req.body.refreshToken as string, req.user.id, req.correlationId);
    res.json({ message: 'Logged out successfully.' });
  })
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email as string);
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  })
);

router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token as string, req.body.newPassword as string);
    res.json({ message: 'Password reset successfully.' });
  })
);

router.post(
  '/forgot-username',
  strictRateLimiter,
  validateRequest({ body: forgotUsernameSchema }),
  asyncHandler(async (req, res) => {
    // CAPTCHA placeholder: production would validate a CAPTCHA token here
    await authService.forgotUsername(req.body.email as string);
    res.json({ message: 'If an account with that email exists, the username has been sent.' });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    const profile = await authService.getMyProfile(req.user.id);
    res.json(profile);
  })
);

export default router;
