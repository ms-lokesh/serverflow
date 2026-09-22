import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { hashPassword, sanitizeUser } from '../utils/auth';
import { logAudit } from '../services/audit';

const router = Router();

// All employee management routes require authentication
router.use(authenticateToken);

/**
 * Generate safe, sequence-based unique Employee ID per restaurant
 * e.g. DIN-001, KIT-001, TAK-001, ADM-001
 */
async function generateEmployeeId(restaurantId: string, role: string): Promise<string> {
  const prefixMap: Record<string, string> = {
    DINING: 'DIN',
    KITCHEN: 'KIT',
    TAKEAWAY: 'TAK',
    ADMIN: 'ADM',
  };

  const prefix = prefixMap[role] || 'EMP';

  // Find current maximum sequence for this prefix
  const res = await query(
    `SELECT employee_id FROM users
     WHERE restaurant_id = $1 AND employee_id LIKE $2
     ORDER BY employee_id DESC`,
    [restaurantId, `${prefix}-%`]
  );

  let maxSeq = 0;
  for (const row of res.rows) {
    const parts = row.employee_id.split('-');
    if (parts.length >= 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = nextSeq.toString().padStart(3, '0');
  return `${prefix}-${padded}`;
}

/**
 * GET /api/employees
 * List all employees with search and role filter
 */
router.get('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { q, role, status } = req.query;

    let sql = `
      SELECT id, restaurant_id, employee_id, name, email, phone, role, status, avatar, created_at, updated_at, last_login_at
      FROM users
      WHERE restaurant_id = $1
    `;
    const params: any[] = [restaurantId];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (name ILIKE $${params.length} OR employee_id ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    if (role && role !== 'ALL') {
      params.push(role);
      sql += ` AND role = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    const employees = result.rows.map(sanitizeUser);

    res.json({ success: true, data: employees });
  } catch (err) {
    console.error('[Get Employees Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_EMPLOYEES' });
  }
});

/**
 * POST /api/employees
 * Admin creates a new employee with Argon2id password hash
 */
router.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { name, email, phone, role, password, confirmPassword, customEmployeeId } = req.body;

    if (!name || !role || !password) {
      res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, role, and password are required.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Password and Confirm Password do not match.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'DINING', 'KITCHEN', 'TAKEAWAY'].includes(normalizedRole)) {
      res.status(400).json({ success: false, error: 'INVALID_ROLE', message: 'Invalid role specified.' });
      return;
    }

    // Determine unique Employee ID
    let finalEmployeeId = customEmployeeId?.trim();
    if (!finalEmployeeId) {
      finalEmployeeId = await generateEmployeeId(restaurantId, normalizedRole);
    } else {
      // Verify uniqueness
      const checkRes = await query(
        `SELECT id FROM users WHERE restaurant_id = $1 AND UPPER(employee_id) = UPPER($2)`,
        [restaurantId, finalEmployeeId]
      );
      if (checkRes.rows.length > 0) {
        res.status(400).json({
          success: false,
          error: 'DUPLICATE_EMPLOYEE_ID',
          message: `Employee ID ${finalEmployeeId} already exists in this restaurant.`,
        });
        return;
      }
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `INSERT INTO users (id, restaurant_id, employee_id, name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')`,
      [userId, restaurantId, finalEmployeeId, name.trim(), email?.trim() || null, phone?.trim() || null, passwordHash, normalizedRole]
    );

    // Audit Log
    await logAudit({
      restaurantId,
      actorUserId: req.user!.id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'USER',
      entityId: userId,
      metadata: { employeeId: finalEmployeeId, name, role: normalizedRole },
    });

    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const createdUser = sanitizeUser(userRes.rows[0]);

    res.status(201).json({
      success: true,
      data: createdUser,
      message: `Employee created successfully. Employee ID: ${finalEmployeeId}`,
    });
  } catch (err) {
    console.error('[Create Employee Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_CREATE_EMPLOYEE' });
  }
});

/**
 * PUT /api/employees/:id
 * Edit employee details, role, status
 */
router.put('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { name, email, phone, role, status, avatar } = req.body;

    // Check employee exists
    const existingRes = await query(
      `SELECT * FROM users WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'EMPLOYEE_NOT_FOUND' });
      return;
    }

    const existing = existingRes.rows[0];
    const newRole = role ? role.toUpperCase() : existing.role;
    const newStatus = status ? status.toUpperCase() : existing.status;

    await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = $4,
           status = $5,
           avatar = COALESCE($6, avatar),
           updated_at = NOW()
       WHERE id = $7 AND restaurant_id = $8`,
      [
        name ? name.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        newRole,
        newStatus,
        avatar || null,
        id,
        restaurantId,
      ]
    );

    // Audit log
    const auditAction = existing.role !== newRole ? 'ROLE_CHANGED' : 'EMPLOYEE_UPDATED';
    await logAudit({
      restaurantId,
      actorUserId: req.user!.id,
      action: auditAction,
      entityType: 'USER',
      entityId: id,
      metadata: {
        employeeId: existing.employee_id,
        oldRole: existing.role,
        newRole,
        oldStatus: existing.status,
        newStatus,
      },
    });

    const updatedRes = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    res.json({ success: true, data: sanitizeUser(updatedRes.rows[0]) });
  } catch (err) {
    console.error('[Update Employee Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_UPDATE_EMPLOYEE' });
  }
});

/**
 * POST /api/employees/:id/deactivate
 * Soft deactivate employee (sets status = INACTIVE)
 */
router.post('/:id/deactivate', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    // Prevent self-deactivation
    if (req.user!.id === id) {
      res.status(400).json({
        success: false,
        error: 'CANNOT_DEACTIVATE_SELF',
        message: 'You cannot deactivate your own administrative account.',
      });
      return;
    }

    const userRes = await query(
      `SELECT employee_id, name, status FROM users WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'EMPLOYEE_NOT_FOUND' });
      return;
    }

    await query(
      `UPDATE users SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    await logAudit({
      restaurantId,
      actorUserId: req.user!.id,
      action: 'EMPLOYEE_DEACTIVATED',
      entityType: 'USER',
      entityId: id,
      metadata: { employeeId: userRes.rows[0].employee_id, name: userRes.rows[0].name },
    });

    res.json({ success: true, message: 'Employee deactivated successfully.' });
  } catch (err) {
    console.error('[Deactivate Employee Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_DEACTIVATE_EMPLOYEE' });
  }
});

/**
 * POST /api/employees/:id/activate
 * Reactivate employee account
 */
router.post('/:id/activate', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const userRes = await query(
      `SELECT employee_id, name FROM users WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'EMPLOYEE_NOT_FOUND' });
      return;
    }

    await query(
      `UPDATE users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    await logAudit({
      restaurantId,
      actorUserId: req.user!.id,
      action: 'EMPLOYEE_ACTIVATED',
      entityType: 'USER',
      entityId: id,
      metadata: { employeeId: userRes.rows[0].employee_id },
    });

    res.json({ success: true, message: 'Employee reactivated successfully.' });
  } catch (err) {
    console.error('[Activate Employee Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_ACTIVATE_EMPLOYEE' });
  }
});

/**
 * POST /api/employees/:id/reset-password
 * Admin sets temporary password (Argon2id hashed)
 */
router.post('/:id/reset-password', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const userRes = await query(
      `SELECT employee_id FROM users WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'EMPLOYEE_NOT_FOUND' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND restaurant_id = $3`,
      [passwordHash, id, restaurantId]
    );

    await logAudit({
      restaurantId,
      actorUserId: req.user!.id,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: id,
      metadata: { employeeId: userRes.rows[0].employee_id },
    });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_RESET_PASSWORD' });
  }
});

/**
 * GET /api/employees/audit
 * Get employee and auth audit logs
 */
router.get('/audit', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const resLogs = await query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
              u.name as actor_name, u.employee_id as actor_employee_id
       FROM audit_logs a
       LEFT JOIN users u ON a.actor_user_id = u.id
       WHERE a.restaurant_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [restaurantId]
    );

    res.json({ success: true, data: resLogs.rows });
  } catch (err) {
    console.error('[Audit Logs Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_AUDIT_LOGS' });
  }
});

export default router;
