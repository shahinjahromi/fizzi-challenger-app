import jwt, { SignOptions } from 'jsonwebtoken';
import { createError } from '../types/index.js';

export interface TokenPayload {
  sub: string;
  role: string;
  workspaceIds: string[];
  jti?: string;
  type: 'access' | 'refresh';
}

function getSecret(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export function signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  const opts: SignOptions = {
    expiresIn: (process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m') as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'access' }, getSecret('JWT_ACCESS_SECRET'), opts);
}

export function signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  const opts: SignOptions = {
    expiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'refresh' }, getSecret('JWT_REFRESH_SECRET'), opts);
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret('JWT_ACCESS_SECRET')) as TokenPayload;
    if (decoded.type !== 'access') throw createError('Invalid token type', 401, 'INVALID_TOKEN');
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw createError('Access token expired', 401, 'TOKEN_EXPIRED');
    if (err instanceof jwt.JsonWebTokenError) throw createError('Invalid access token', 401, 'INVALID_TOKEN');
    throw err;
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as TokenPayload;
    if (decoded.type !== 'refresh') throw createError('Invalid token type', 401, 'INVALID_TOKEN');
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw createError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    if (err instanceof jwt.JsonWebTokenError) throw createError('Invalid refresh token', 401, 'INVALID_TOKEN');
    throw err;
  }
}
