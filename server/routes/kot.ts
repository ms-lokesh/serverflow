import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastToRestaurant } from '../websocket';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/kot
 * Get all active KOT tickets with line items for Kitchen Display System (KDS)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const ticketsRes = await query(
      `SELECT id, order_id, table_number, order_type, customer_name, status, is_addition,
              batch_number, created_at, accepted_at, ready_at, served_at
       FROM kot_tickets
       WHERE restaurant_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [restaurantId]
    );

    const ticketIds = ticketsRes.rows.map((r) => r.id);
    let itemsMap: Record<string, any[]> = {};

    if (ticketIds.length > 0) {
      const itemsRes = await query(
        `SELECT kot_id, dish_id, name, quantity, notes, is_veg
         FROM kot_ticket_items
         WHERE kot_id = ANY($1)`,
        [ticketIds]
      );

      for (const it of itemsRes.rows) {
        if (!itemsMap[it.kot_id]) itemsMap[it.kot_id] = [];
        itemsMap[it.kot_id].push({
          dishId: it.dish_id,
          name: it.name,
          quantity: it.quantity,
          notes: it.notes,
          isVeg: it.is_veg,
        });
      }
    }

    const tickets = ticketsRes.rows.map((t) => ({
      id: t.id,
      orderId: t.order_id,
      tableNumber: t.table_number,
      orderType: t.order_type,
      customerName: t.customer_name,
      status: t.status,
      isAddition: t.is_addition,
      batchNumber: t.batch_number,
      createdAt: t.created_at,
      acceptedAt: t.accepted_at,
      readyAt: t.ready_at,
      servedAt: t.served_at,
      items: itemsMap[t.id] || [],
    }));

    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('[Get KOTs Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_KOTS' });
  }
});

/**
 * PATCH /api/kot/:id/status
 * Kitchen staff transitions status: 'new' -> 'preparing' -> 'ready' -> 'served'
 */
router.patch('/:id/status', requireRole('KITCHEN', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'preparing', 'ready', 'served'].includes(status)) {
      res.status(400).json({ success: false, error: 'INVALID_STATUS' });
      return;
    }

    let timestampCol = '';
    if (status === 'preparing') timestampCol = ', accepted_at = NOW()';
    if (status === 'ready') timestampCol = ', ready_at = NOW()';
    if (status === 'served') timestampCol = ', served_at = NOW()';

    const result = await query(
      `UPDATE kot_tickets
       SET status = $1 ${timestampCol}
       WHERE id = $2 AND restaurant_id = $3
       RETURNING order_id, table_number, order_type`,
      [status, id, restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'KOT_NOT_FOUND' });
      return;
    }

    const ticket = result.rows[0];

    // 2. Synchronize parent order status based on kitchen activity
    const allKotsRes = await query(
      `SELECT status FROM kot_tickets WHERE order_id = $1 AND restaurant_id = $2`,
      [ticket.order_id, restaurantId]
    );

    const statuses = allKotsRes.rows.map((r) => r.status);
    let newOrderStatus: string = status;

    if (statuses.length > 0 && statuses.every((s) => s === 'served')) {
      newOrderStatus = 'served';
    } else if (statuses.length > 0 && statuses.every((s) => s === 'ready' || s === 'served')) {
      newOrderStatus = 'ready';
    } else if (statuses.some((s) => s === 'preparing' || s === 'ready' || s === 'served')) {
      newOrderStatus = 'preparing';
    } else {
      newOrderStatus = 'sent_to_kitchen';
    }

    await query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND restaurant_id = $3 AND status IN ('sent_to_kitchen', 'preparing', 'ready', 'served')`,
      [newOrderStatus, ticket.order_id, restaurantId]
    );

    // If marked ready, insert notification for Dining staff
    if (status === 'ready') {
      const notifId = `notif_${Date.now()}`;
      await query(
        `INSERT INTO notifications (id, restaurant_id, title, message, type, order_id, table_number)
         VALUES ($1, $2, $3, $4, 'kitchen', $5, $6)`,
        [
          notifId,
          restaurantId,
          `KOT #${id} Ready!`,
          ticket.table_number ? `Order for Table #${ticket.table_number} is ready to serve.` : `Takeaway order is ready for pickup.`,
          ticket.order_id,
          ticket.table_number,
        ]
      );
    }

    // Realtime broadcast to all connected devices
    broadcastToRestaurant(restaurantId, 'KOT_STATUS_UPDATED', {
      kotId: id,
      orderId: ticket.order_id,
      tableNumber: ticket.table_number,
      status,
      orderStatus: newOrderStatus,
      timestamp: new Date().toISOString(),
    });

    broadcastToRestaurant(restaurantId, 'ORDER_UPDATED', {
      orderId: ticket.order_id,
      status: newOrderStatus,
      tableNumber: ticket.table_number,
    });

    res.json({ success: true, message: `KOT #${id} marked as ${status}` });
  } catch (err) {
    console.error('[Update KOT Status Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_UPDATE_KOT_STATUS' });
  }
});

export default router;
