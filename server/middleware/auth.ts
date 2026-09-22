import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens, setAuthCookies, sanitizeUser } from '../utils/auth';
import { query } from '../db/pool';

export interface AuthenticatedUser {
  id: string;
  restaurantId: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'DINING' | 'KITCHEN' | 'TAKEAWAY';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.serveflow_access;

    // Fallback to Bearer authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    let payload = token ? verifyAccessToken(token) : null;

    // If access token expired, attempt refresh token from cookies
    if (!payload && req.cookies?.serveflow_refresh) {
      const refreshPayload = verifyRefreshToken(req.cookies.serveflow_refresh);
      if (refreshPayload) {
        // Issue fresh tokens
        const tokens = generateTokens({
          userId: refreshPayload.userId,
          restaurantId: refreshPayload.restaurantId,
          employeeId: refreshPayload.employeeId,
          role: refreshPayload.role,
        });
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        payload = refreshPayload;
      }
    }

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication session missing or expired. Please sign in.',
      });
      return;
    }

    // Load active user from database to ensure up-to-date role, status, and tenant
    const userRes = await query(
      `SELECT id, restaurant_id, employee_id, name, email, phone, role, status, avatar, created_at, updated_at, last_login_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.',
      });
      return;
    }

    const dbUser = userRes.rows[0];

    // Status check
    if (dbUser.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'INACTIVE_ACCOUNT',
        message: 'Your account is inactive. Please contact your administrator.',
      });
      return;
    }

    // Load permissions
    const permRes = await query(
      `SELECT permission_name FROM role_permissions WHERE role = $1`,
      [dbUser.role]
    );
    const permissions = permRes.rows.map((r) => r.permission_name);

    req.user = {
      id: dbUser.id,
      restaurantId: dbUser.restaurant_id,
      employeeId: dbUser.employee_id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      status: dbUser.status,
      permissions,
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Internal error during authentication verification.',
    });
  }
}

/**
 * Middleware to require one of the specified roles
 */
export function requireRole(...allowedRoles: ('ADMIN' | 'DINING' | 'KITCHEN' | 'TAKEAWAY')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Access denied. Role ${req.user.role} is not authorized for this resource.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require a specific fine-grained permission
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    if (req.user.role === 'ADMIN' || req.user.permissions.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `Access denied. Missing required permission: ${permission}`,
    });
  };
}
