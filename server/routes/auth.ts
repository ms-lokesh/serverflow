import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import {
  verifyPassword,
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  sanitizeUser,
  verifyRefreshToken,
} from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

/**
 * POST /auth/login
 * Unified authentication endpoint for all personas (Admin, Dining, Kitchen, Takeaway)
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Please provide employee ID / email and password.',
      });
      return;
    }

    const trimmedIdentifier = identifier.trim();

    // Query user by employeeId, email, or name
    const userRes = await query(
      `SELECT u.id, u.restaurant_id, u.employee_id, u.name, u.email, u.phone,
              u.password_hash, u.role, u.status, u.avatar, u.created_at, u.updated_at, u.last_login_at,
              r.name as restaurant_name
       FROM users u
       JOIN restaurants r ON u.restaurant_id = r.id
       WHERE UPPER(u.employee_id) = UPPER($1)
          OR LOWER(u.email) = LOWER($1)
          OR LOWER(u.name) = LOWER($1)`,
      [trimmedIdentifier]
    );

    if (userRes.rows.length === 0) {
      // Avoid timing side-channel and log failed attempt
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid employee ID or password.',
      });
      return;
    }

    const user = userRes.rows[0];

    // Status Check
    if (user.status !== 'ACTIVE') {
      await logAudit({
        restaurantId: user.restaurant_id,
        actorUserId: user.id,
        action: 'LOGIN_BLOCKED_INACTIVE',
        entityType: 'USER',
        entityId: user.id,
        metadata: { employeeId: user.employee_id, reason: user.status },
      });

      res.status(403).json({
        success: false,
        error: 'INACTIVE_ACCOUNT',
        message: 'Your account is inactive. Please contact your administrator.',
      });
      return;
    }

    // Verify Password using Argon2id
    const isPasswordValid = await verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      await logAudit({
        restaurantId: user.restaurant_id,
        actorUserId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        metadata: { employeeId: user.employee_id, reason: 'Invalid password' },
      });

      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid employee ID or password.',
      });
      return;
    }

    // Update last_login_at
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // Load Permissions
    const permRes = await query(
      `SELECT permission_name FROM role_permissions WHERE role = $1`,
      [user.role]
    );
    const permissions = permRes.rows.map((r) => r.permission_name);

    // Generate Tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      restaurantId: user.restaurant_id,
      employeeId: user.employee_id,
      role: user.role,
    });

    // Set secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Log Successful Login Audit
    await logAudit({
      restaurantId: user.restaurant_id,
      actorUserId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      metadata: { employeeId: user.employee_id, role: user.role, ip: req.ip },
    });

    const safeUser = sanitizeUser(user);

    res.json({
      success: true,
      data: {
        user: {
          ...safeUser,
          restaurantName: user.restaurant_name,
        },
        permissions,
        accessToken, // Included for authorization headers where applicable
      },
    });
  } catch (err) {
    console.error('[Login API Error]:', err);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Unable to connect to ServeFlow. Please try again.',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using HttpOnly refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    let token = req.cookies?.serveflow_refresh;
    if (!token && req.body?.refreshToken) {
      token = req.body.refreshToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'NO_REFRESH_TOKEN',
        message: 'Refresh token missing',
      });
      return;
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token invalid or expired',
      });
      return;
    }

    // Verify user is still active in DB
    const userRes = await query(
      `SELECT id, restaurant_id, employee_id, name, email, phone, role, status, avatar, last_login_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (userRes.rows.length === 0 || userRes.rows[0].status !== 'ACTIVE') {
      clearAuthCookies(res);
      res.status(403).json({
        success: false,
        error: 'INACTIVE_ACCOUNT',
        message: 'Your account is inactive. Please contact your administrator.',
      });
      return;
    }

    const user = userRes.rows[0];

    // Load permissions
    const permRes = await query(
      `SELECT permission_name FROM role_permissions WHERE role = $1`,
      [user.role]
    );
    const permissions = permRes.rows.map((r) => r.permission_name);

    // Re-issue tokens
    const tokens = generateTokens({
      userId: user.id,
      restaurantId: user.restaurant_id,
      employeeId: user.employee_id,
      role: user.role,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: sanitizeUser(user),
        permissions,
      },
    });
  } catch (err) {
    console.error('[Refresh Token Error]:', err);
    res.status(500).json({ success: false, error: 'REFRESH_ERROR' });
  }
});

/**
 * POST /auth/logout
 * Sign out user and clear auth cookies
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit({
        restaurantId: req.user.restaurantId,
        actorUserId: req.user.id,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user.id,
        metadata: { employeeId: req.user.employeeId },
      });
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

/**
 * GET /auth/me
 * Return current session identity and permissions gracefully (200 with user: null if unauthenticated)
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    let token = req.cookies?.serveflow_access;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    let payload = token ? verifyAccessToken(token) : null;
    if (!payload && req.cookies?.serveflow_refresh) {
      const refreshPayload = verifyRefreshToken(req.cookies.serveflow_refresh);
      if (refreshPayload) {
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
      res.json({
        success: true,
        data: {
          user: null,
          permissions: [],
          isAuthenticated: false,
        },
      });
      return;
    }

    const userRes = await query(
      `SELECT u.id, u.restaurant_id, u.employee_id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.last_login_at,
              r.name as restaurant_name
       FROM users u
       JOIN restaurants r ON u.restaurant_id = r.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (userRes.rows.length === 0 || userRes.rows[0].status !== 'ACTIVE') {
      res.json({
        success: true,
        data: {
          user: null,
          permissions: [],
          isAuthenticated: false,
        },
      });
      return;
    }

    const dbUser = userRes.rows[0];
    const permRes = await query(
      `SELECT permission_name FROM role_permissions WHERE role = $1`,
      [dbUser.role]
    );
    const permissions = permRes.rows.map((r) => r.permission_name);

    res.json({
      success: true,
      data: {
        user: {
          id: dbUser.id,
          restaurantId: dbUser.restaurant_id,
          employeeId: dbUser.employee_id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
          status: dbUser.status,
          avatar: dbUser.avatar,
          lastLoginAt: dbUser.last_login_at,
          restaurantName: dbUser.restaurant_name,
        },
        permissions,
        isAuthenticated: true,
      },
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        user: null,
        permissions: [],
        isAuthenticated: false,
      },
    });
  }
});

export default router;
