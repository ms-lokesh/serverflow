import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { broadcastToRestaurant } from '../websocket';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/tables
 * List all tables for the restaurant
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const result = await query(
      `SELECT t.id, t.number, t.capacity, t.status, t.current_order_id, t.current_total,
              t.updated_at, u.name as active_employee_name
       FROM tables t
       LEFT JOIN users u ON t.active_employee_id = u.id
       WHERE t.restaurant_id = $1
       ORDER BY t.number ASC`,
      [restaurantId]
    );

    const tables = result.rows.map((r) => ({
      id: r.id,
      number: r.number,
      capacity: r.capacity,
      status: r.status,
      currentOrderId: r.current_order_id,
      currentTotal: parseFloat(r.current_total || '0'),
      activeEmployee: r.active_employee_name,
      updatedAt: r.updated_at,
    }));

    res.json({ success: true, data: tables });
  } catch (err) {
    console.error('[Get Tables Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_TABLES' });
  }
});

export default router;
