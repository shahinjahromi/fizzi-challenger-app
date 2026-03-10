import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { createError } from '../types/index.js';
import { createAuditEvent } from './auditService.js';
import { AuditEventType } from '@prisma/client';
import logger from '../utils/logger.js';

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    workspaces: Array<{ id: string; name: string; role: string }>;
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const { usernameOrEmail, password } = input;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
      ],
    },
    include: {
      workspaceMemberships: { include: { workspace: true } },
    },
  });

  if (!user) {
    throw createError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw createError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const workspaceIds = user.workspaceMemberships.map((m) => m.workspaceId);

  const tokenPayload = { sub: user.id, role: user.role, workspaceIds };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ ...tokenPayload, jti: uuidv4() });

  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshExpiry,
    },
  });

  await createAuditEvent({
    userId: user.id,
    eventType: AuditEventType.LOGIN,
    metadata: {},
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    correlationId: input.correlationId,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      workspaces: user.workspaceMemberships.map((m) => ({
        id: m.workspaceId,
        name: m.workspace.name,
        role: m.role,
      })),
    },
  };
}

export async function refreshTokens(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(token);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw createError('Refresh token is invalid or expired.', 401, 'INVALID_REFRESH_TOKEN');
  }

  await prisma.refreshToken.delete({ where: { token } });

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: payload.sub },
    select: { workspaceId: true },
  });

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const tokenPayload = { sub: payload.sub, role: payload.role, workspaceIds };

  const newAccessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken({ ...tokenPayload, jti: uuidv4() });

  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: payload.sub, token: newRefreshToken, expiresAt: refreshExpiry },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string, userId: string, correlationId?: string): Promise<void> {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (stored) {
    await prisma.refreshToken.delete({ where: { token } });
  }

  await createAuditEvent({
    userId,
    eventType: AuditEventType.LOGOUT,
    metadata: {},
    correlationId,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  // STUB: In production this would send a reset email via Transmit Security or similar.
  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    const resetToken = uuidv4();
    logger.info('Password reset requested', { resetToken: '[generated]', userId: user.id });
    // TODO: Send reset email via email provider
    await createAuditEvent({
      userId: user.id,
      eventType: AuditEventType.PASSWORD_RESET_REQUEST,
      metadata: { note: 'stub' },
    });
  }
  // Always return success to prevent user enumeration
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  // STUB: In production validate the reset token from a secure store
  logger.info('Password reset attempt', { resetToken: '[received]' });
  void resetToken;
  void newPassword;
  throw createError('Password reset via token is not yet implemented.', 501, 'NOT_IMPLEMENTED');
}

export async function forgotUsername(email: string): Promise<void> {
  // STUB: In production send username via email
  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    logger.info('Username recovery requested', { userId: user.id });
    await createAuditEvent({
      userId: user.id,
      eventType: AuditEventType.USERNAME_RECOVERY_REQUEST,
      metadata: { note: 'stub' },
    });
  }
}

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspaceMemberships: { include: { workspace: true } },
    },
  });

  if (!user) throw createError('User not found.', 404, 'USER_NOT_FOUND');

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    tenureStartDate: user.tenureStartDate,
    workspaces: user.workspaceMemberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      role: m.role,
    })),
  };
}
