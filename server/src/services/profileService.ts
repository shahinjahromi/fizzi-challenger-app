import prisma from '../db.js';
import { createError } from '../types/index.js';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, createdAt: true, tenureStartDate: true },
  });
  if (!user) throw createError('User not found.', 404, 'NOT_FOUND');
  return user;
}

export async function getSecurityCenter(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!user) throw createError('User not found.', 404, 'NOT_FOUND');

  return {
    username: user.username,
    passwordDisplay: '•'.repeat(16),
    twoStepVerificationMethods: [
      // STUB: In production pull from Transmit Security or MFA provider
      { type: 'sms', maskedDestination: '***-***-1234', enabled: true },
      { type: 'email', maskedDestination: 'a***@example.com', enabled: true },
    ],
    trustedDevicesCount: 1, // STUB: real device count from session store
  };
}
