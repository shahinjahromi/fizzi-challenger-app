import { prisma } from '../config/prisma'
import { verifyPassword, hashPassword } from '../utils/password'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { UnauthorizedError, NotFoundError } from '../utils/errors'
import { ensureNymbusAccountAndLedger } from './nymbusProvision'
import bcrypt from 'bcryptjs'
import { addDays } from '../utils/dateUtils'

export async function loginUser(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized) throw new UnauthorizedError('Invalid credentials')

  // Support login by email or username (case-insensitive)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized },
        { username: { equals: normalized, mode: 'insensitive' } },
      ],
    },
  })
  if (!user) throw new UnauthorizedError('Invalid credentials')

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new UnauthorizedError('Invalid credentials')

  // Ensure user has account and ledger on Nymbus Core API (no-op if not configured)
  ensureNymbusAccountAndLedger(user.id).catch((err) =>
    console.warn('Nymbus provision failed on login:', err),
  )

  return issueTokens(user.id, user.email)
}

export async function refreshTokens(rawRefreshToken: string) {
  let payload: { userId: string; tokenId: string }
  try {
    payload = verifyRefreshToken(rawRefreshToken)
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  const dbToken = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } })

  if (!dbToken || dbToken.revokedAt || new Date() > dbToken.expiresAt) {
    if (dbToken) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    throw new UnauthorizedError('Refresh token reuse detected or expired')
  }

  await prisma.refreshToken.update({
    where: { id: dbToken.id },
    data: { revokedAt: new Date() },
  })

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) throw new NotFoundError('User')

  return issueTokens(user.id, user.email)
}

export async function logoutUser(rawRefreshToken: string) {
  try {
    const payload = verifyRefreshToken(rawRefreshToken)
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Silently ignore invalid tokens on logout
  }
}

async function issueTokens(userId: string, email: string) {
  const expiresAt = addDays(new Date(), 7)

  const dbToken = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: 'pending',
      expiresAt,
    },
  })

  const refreshToken = signRefreshToken({ userId, tokenId: dbToken.id })
  const tokenHash = await bcrypt.hash(refreshToken, 10)

  await prisma.refreshToken.update({
    where: { id: dbToken.id },
    data: { tokenHash },
  })

  const accessToken = signAccessToken({ userId, email })

  return { accessToken, refreshToken, expiresAt }
}
