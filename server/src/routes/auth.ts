import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { loginUser, refreshTokens, logoutUser } from '../services/authService'
import { validateBody } from '../middleware/validateBody'
import { authLimiter } from '../middleware/rateLimiter'
import { env } from '../config/env'

const router = Router()

const REFRESH_COOKIE = 'refreshToken'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const loginSchema = z.object({
  identifier: z.union([z.string(), z.number()]).transform((v) => (v != null ? String(v).trim() : '')),
  password: z.union([z.string(), z.number()]).transform((v) => (v != null ? String(v) : '')),
}).refine((d) => d.identifier.length > 0 && d.password.length > 0, {
  message: 'Email or username and password are required',
  path: ['identifier'],
})

router.post(
  '/login',
  authLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be JSON with identifier and password', code: 'BAD_REQUEST' })
    }
    next()
  },
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, password } = req.body
      const { accessToken, refreshToken, expiresAt } = await loginUser(identifier, password)

      res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
      res.json({ accessToken, expiresAt })
    } catch (err) {
      next(err)
    }
  },
)

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE]
    if (!rawRefreshToken) {
      return res.status(401).json({ error: 'No refresh token', code: 'UNAUTHORIZED' })
    }

    const { accessToken, refreshToken, expiresAt } = await refreshTokens(rawRefreshToken)
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken, expiresAt })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE]
    if (rawRefreshToken) await logoutUser(rawRefreshToken)

    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      sameSite: 'strict',
      secure: env.NODE_ENV === 'production',
    })
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
})

// MFA placeholder
router.post('/mfa/verify', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'MFA not yet implemented', code: 'NOT_IMPLEMENTED' })
})

export default router
