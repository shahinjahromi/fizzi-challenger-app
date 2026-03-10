import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { createError } from '../types/index.js';
import prisma from '../db.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return next(createError('Missing or invalid Authorization header.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Fetch current workspace memberships for the user
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: payload.sub },
      select: { workspaceId: true },
    });

    req.user = {
      id: payload.sub,
      role: payload.role,
      workspaceIds: memberships.map((m) => m.workspaceId),
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Step-up auth stub — in production this would validate a short-lived step-up token
 * issued by Transmit Security or similar. For now it simply requires a normal auth.
 */
export async function requireStepUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, next);
}
