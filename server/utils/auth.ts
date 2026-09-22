import { hash, verify, Algorithm } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  restaurantId: string;
  employeeId: string;
  role: string;
}

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
  });
}

/**
 * Verify password against Argon2id hash
 */
export async function verifyPassword(hashString: string, plainText: string): Promise<boolean> {
  try {
    return await verify(hashString, plainText);
  } catch (err) {
    return false;
  }
}

/**
 * Generate short-lived access token (15m) and long-lived refresh token (7d)
 */
export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Set HttpOnly, Secure, SameSite cookies on Express response
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('serveflow_access', accessToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  res.cookie('serveflow_refresh', refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Clear auth cookies on logout
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie('serveflow_access', { path: '/' });
  res.clearCookie('serveflow_refresh', { path: '/' });
}

/**
 * Sanitize user object to never return password hash or sensitive internals
 */
export function sanitizeUser(user: any) {
  if (!user) return null;
  const { password_hash, passwordHash, ...safe } = user;
  return {
    id: safe.id,
    restaurantId: safe.restaurant_id || safe.restaurantId,
    employeeId: safe.employee_id || safe.employeeId,
    name: safe.name,
    email: safe.email,
    phone: safe.phone,
    role: safe.role,
    status: safe.status,
    avatar: safe.avatar,
    createdAt: safe.created_at || safe.createdAt,
    updatedAt: safe.updated_at || safe.updatedAt,
    lastLoginAt: safe.last_login_at || safe.lastLoginAt,
  };
}
