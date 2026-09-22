import { Router, Response } from 'express';
import { query, withTransaction } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastToRestaurant, broadcastToRole } from '../websocket';
import { logAudit } from '../services/audit';

const router = Router();
router.use(authenticateToken);

/**
 * Helper to calculate GST and Grand Total
 */
function calculateTotals(items: { price: number; quantity: number }[], gstRate: number = 5.0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const taxableAmount = subtotal - discount;
  const totalGst = (taxableAmount * gstRate) / 100;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const grandTotalBeforeRound = taxableAmount + totalGst;
  const grandTotal = Math.round(grandTotalBeforeRound);
  const roundOff = parseFloat((grandTotal - grandTotalBeforeRound).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount,
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    totalGst: parseFloat(totalGst.toFixed(2)),
    roundOff,
    grandTotal,
  };
}

function buildTimeline(status: string, createdAt: string) {
  const stages = [
    { id: 't-1', title: 'Order Created', key: 'created' },
    { id: 't-2', title: 'Sent to Kitchen', key: 'sent_to_kitchen' },
    { id: 't-3', title: 'Preparing', key: 'preparing' },
    { id: 't-4', title: 'Ready', key: 'ready' },
    { id: 't-5', title: 'Served', key: 'served' },
    { id: 't-6', title: 'Bill Requested', key: 'bill_requested' },
    { id: 't-7', title: 'Payment Submitted', key: 'payment_submitted' },
    { id: 't-8', title: 'Closed', key: 'closed' },
  ];

  const statusOrder: Record<string, number> = {
    created: 0,
    sent_to_kitchen: 1,
    preparing: 2,
    ready: 3,
    served: 4,
    bill_requested: 5,
    payment_submitted: 6,
    payment_verified: 7,
    closed: 7,
  };

  const currentIdx = statusOrder[status] ?? 0;
  const isClosed = status === 'closed' || status === 'payment_verified';

  return stages.map((s, idx) => ({
    id: s.id,
    title: s.title,
    time:
      idx === 0 && createdAt
        ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : idx <= currentIdx
        ? 'Done'
        : 'Pending',
    completed: idx < currentIdx || (idx === currentIdx && isClosed),
    current: idx === currentIdx && !isClosed,
    subtitle: idx === currentIdx && status === 'payment_submitted' ? 'Waiting for Admin Verification' : undefined,
  }));
}

/**
 * GET /api/orders
 * List orders with items and payment details
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { status, type, limit = 50 } = req.query;

    let sql = `
      SELECT o.*, u.name as employee_name, u.role as employee_role,
             p.payment_method, p.payment_amount, p.received_amount, p.change,
             p.ref_number, p.payment_status, p.payment_submitted_at,
             p.payment_verified_at,
             p.payment_employee_name
      FROM orders o
      JOIN users u ON o.employee_id = u.id
      LEFT JOIN LATERAL (
        SELECT p.method as payment_method, p.amount as payment_amount, p.received_amount, p.change,
               p.ref_number, p.status as payment_status, p.submitted_at as payment_submitted_at,
               p.verified_at as payment_verified_at,
               pu.name as payment_employee_name
        FROM payments p
        LEFT JOIN users pu ON p.submitted_by_id = pu.id
        WHERE p.order_id = o.id
        ORDER BY p.submitted_at DESC
        LIMIT 1
      ) p ON TRUE
      WHERE o.restaurant_id = $1
    `;
    const params: any[] = [restaurantId];

    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      sql += ` AND o.order_type = $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const ordersRes = await query(sql, params);

    // Fetch items for these orders
    const orderIds = ordersRes.rows.map((r) => r.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const itemsRes = await query(
        `SELECT id, order_id, dish_id, name, price, quantity, category, is_veg, is_addition, batch_id, notes
         FROM order_items
         WHERE order_id = ANY($1)
         ORDER BY batch_id, created_at ASC`,
        [orderIds]
      );

      for (const it of itemsRes.rows) {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push({
          id: it.id,
          dishId: it.dish_id,
          name: it.name,
          price: parseFloat(it.price),
          quantity: it.quantity,
          category: it.category,
          isVeg: it.is_veg,
          isAddition: it.is_addition,
          batchId: it.batch_id,
          notes: it.notes,
        });
      }
    }

    const orders = ordersRes.rows.map((r) => ({
      id: r.id,
      tableNumber: r.table_number,
      orderType: r.order_type,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      pickupTime: r.pickup_time,
      notes: r.notes,
      status: r.status,
      employeeName: r.employee_name,
      employeeRole: r.employee_role?.toLowerCase(),
      createdAt: r.created_at,
      subtotal: parseFloat(r.subtotal),
      discount: parseFloat(r.discount),
      taxableAmount: parseFloat(r.taxable_amount),
      cgst: parseFloat(r.cgst),
      sgst: parseFloat(r.sgst),
      totalGst: parseFloat(r.total_gst),
      roundOff: parseFloat(r.round_off),
      grandTotal: parseFloat(r.grand_total),
      billNumber: r.bill_number,
      batchesCount: r.batches_count,
      items: itemsMap[r.id] || [],
      timeline: buildTimeline(r.status, r.created_at),
      payment: r.payment_method
        ? {
            method: r.payment_method,
            amount: parseFloat(r.payment_amount),
            receivedAmount: r.received_amount ? parseFloat(r.received_amount) : undefined,
            change: r.change ? parseFloat(r.change) : undefined,
            refNumber: r.ref_number,
            status: r.payment_status,
            submittedAt: r.payment_submitted_at,
            employeeName: r.payment_employee_name || r.employee_name,
            verifiedAt: r.payment_verified_at,
          }
        : undefined,
    }));

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('[Get Orders Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_ORDERS' });
  }
});

/**
 * POST /api/orders
 * Atomic PostgreSQL Transaction:
 * Creates Order + Order Items + KOT + KOT Items + Table update ('occupied') + Audit Log + WebSocket Broadcast
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { tableNumber, orderType, customerName, customerPhone, pickupTime, notes, items } = req.body;

    if (!orderType || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'INVALID_ORDER_ITEMS' });
      return;
    }

    // Check if any ordered dish is currently marked Stock Out (86)
    const dishIds = items.map((i: any) => i.dish?.id).filter(Boolean);
    if (dishIds.length > 0) {
      const outOfStock = await query(
        `SELECT id, name FROM dishes WHERE id = ANY($1) AND restaurant_id = $2 AND is_available = FALSE`,
        [dishIds, restaurantId]
      );
      if (outOfStock.rows.length > 0) {
        const names = outOfStock.rows.map((r) => r.name).join(', ');
        res.status(400).json({
          success: false,
          error: 'DISH_STOCK_OUT',
          message: `Cannot place order: "${names}" is marked Stock Out (86).`
        });
        return;
      }
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const kotId = `KOT-${Date.now().toString().slice(-4)}`;
    const billNumber = `SF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const totals = calculateTotals(
      items.map((i: any) => ({ price: parseFloat(i.dish.price), quantity: i.quantity })),
      5.0
    );

    // Execute atomic PostgreSQL transaction
    await withTransaction(async (client) => {
      // 1. Insert Order
      await client.query(
        `INSERT INTO orders (
           id, restaurant_id, table_number, order_type, customer_name, customer_phone,
           pickup_time, notes, status, employee_id, subtotal, discount, taxable_amount,
           cgst, sgst, total_gst, round_off, grand_total, bill_number, batches_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent_to_kitchen', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 1)`,
        [
          orderId,
          restaurantId,
          tableNumber || null,
          orderType,
          customerName || null,
          customerPhone || null,
          pickupTime || null,
          notes || null,
          req.user!.id,
          totals.subtotal,
          totals.discount,
          totals.taxableAmount,
          totals.cgst,
          totals.sgst,
          totals.totalGst,
          totals.roundOff,
          totals.grandTotal,
          billNumber,
        ]
      );

      // 2. Insert Order Items
      for (const it of items) {
        const itemId = `itm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO order_items (id, order_id, dish_id, name, price, quantity, category, is_veg, is_addition, batch_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, 1, $9)`,
          [
            itemId,
            orderId,
            it.dish.id,
            it.dish.name,
            it.dish.price,
            it.quantity,
            it.dish.category,
            it.dish.isVeg ?? true,
            it.notes || null,
          ]
        );
      }

      // 3. Insert KOT
      await client.query(
        `INSERT INTO kot_tickets (id, restaurant_id, order_id, table_number, order_type, customer_name, status, is_addition, batch_number)
         VALUES ($1, $2, $3, $4, $5, $6, 'new', FALSE, 1)`,
        [kotId, restaurantId, orderId, tableNumber || null, orderType, customerName || null]
      );

      // 4. Insert KOT Items
      for (const it of items) {
        const kotItemId = `koti_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO kot_ticket_items (id, kot_id, dish_id, name, quantity, notes, is_veg)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [kotItemId, kotId, it.dish.id, it.dish.name, it.quantity, it.notes || null, it.dish.isVeg ?? true]
        );
      }

      // 5. Update Table to 'occupied'
      if (orderType === 'dining' && tableNumber) {
        await client.query(
          `UPDATE tables
           SET status = 'occupied',
               current_order_id = $1,
               current_total = $2,
               active_employee_id = $3,
               updated_at = NOW()
           WHERE restaurant_id = $4 AND number = $5`,
          [orderId, totals.grandTotal, req.user!.id, restaurantId, tableNumber]
        );
      }

      // 6. Insert in-app notification
      const notifId = `notif_${Date.now()}`;
      await client.query(
        `INSERT INTO notifications (id, restaurant_id, title, message, type, order_id, table_number)
         VALUES ($1, $2, $3, $4, 'kitchen', $5, $6)`,
        [
          notifId,
          restaurantId,
          `New KOT #${kotId}`,
          orderType === 'dining' ? `Table #${tableNumber} - ${items.length} dishes` : `Takeaway - ${items.length} dishes`,
          orderId,
          tableNumber || null,
        ]
      );
    });

    // 7. Real-Time Broadcasts
    broadcastToRestaurant(restaurantId, 'NEW_KOT', {
      kotId,
      orderId,
      tableNumber,
      orderType,
      customerName,
      status: 'new',
      isAddition: false,
      batchNumber: 1,
      createdAt: new Date().toISOString(),
      items: items.map((i: any) => ({
        dishId: i.dish.id,
        name: i.dish.name,
        quantity: i.quantity,
        notes: i.notes,
        isVeg: i.dish.isVeg,
      })),
    });

    if (orderType === 'dining' && tableNumber) {
      broadcastToRestaurant(restaurantId, 'TABLE_STATUS_CHANGED', {
        tableNumber,
        status: 'occupied',
        currentOrderId: orderId,
        currentTotal: totals.grandTotal,
      });
    }

    broadcastToRestaurant(restaurantId, 'ORDER_CREATED', { orderId, tableNumber, totals });

    res.status(201).json({
      success: true,
      data: { orderId, kotId, totals },
      message: 'Order placed and KOT dispatched to kitchen.',
    });
  } catch (err) {
    console.error('[Create Order Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_CREATE_ORDER' });
  }
});

/**
 * POST /api/orders/:id/items
 * Atomic PostgreSQL Transaction:
 * Append additional items to existing order + generate addition KOT with ONLY the new items
 */
router.post('/:id/items', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id: orderId } = req.params;
    const { additionalItems } = req.body;

    if (!additionalItems || !Array.isArray(additionalItems) || additionalItems.length === 0) {
      res.status(400).json({ success: false, error: 'INVALID_ADDITIONAL_ITEMS' });
      return;
    }

    // Check if any additional items are marked Stock Out (86)
    const addDishIds = additionalItems.map((i: any) => i.dish?.id).filter(Boolean);
    if (addDishIds.length > 0) {
      const outOfStock = await query(
        `SELECT id, name FROM dishes WHERE id = ANY($1) AND restaurant_id = $2 AND is_available = FALSE`,
        [addDishIds, restaurantId]
      );
      if (outOfStock.rows.length > 0) {
        const names = outOfStock.rows.map((r) => r.name).join(', ');
        res.status(400).json({
          success: false,
          error: 'DISH_STOCK_OUT',
          message: `Cannot add item: "${names}" is marked Stock Out (86).`
        });
        return;
      }
    }

    const kotId = `KOT-${Date.now().toString().slice(-4)}`;

    await withTransaction(async (client) => {
      // Fetch existing order
      const orderRes = await client.query(
        `SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2 FOR UPDATE`,
        [orderId, restaurantId]
      );

      if (orderRes.rows.length === 0) {
        throw new Error('ORDER_NOT_FOUND');
      }

      const order = orderRes.rows[0];
      const nextBatchNumber = (order.batches_count || 1) + 1;

      // 1. Insert New Order Items
      for (const it of additionalItems) {
        const itemId = `itm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO order_items (id, order_id, dish_id, name, price, quantity, category, is_veg, is_addition, batch_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10)`,
          [
            itemId,
            orderId,
            it.dish.id,
            it.dish.name,
            it.dish.price,
            it.quantity,
            it.dish.category,
            it.dish.isVeg ?? true,
            nextBatchNumber,
            it.notes || null,
          ]
        );
      }

      // 2. Fetch all items to recalculate total
      const allItemsRes = await client.query(
        `SELECT price, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      const totals = calculateTotals(
        allItemsRes.rows.map((r) => ({ price: parseFloat(r.price), quantity: r.quantity })),
        5.0
      );

      // 3. Update Order
      await client.query(
        `UPDATE orders
         SET subtotal = $1, taxable_amount = $2, cgst = $3, sgst = $4, total_gst = $5,
             round_off = $6, grand_total = $7, batches_count = $8, status = 'sent_to_kitchen', updated_at = NOW()
         WHERE id = $9`,
        [
          totals.subtotal,
          totals.taxableAmount,
          totals.cgst,
          totals.sgst,
          totals.totalGst,
          totals.roundOff,
          totals.grandTotal,
          nextBatchNumber,
          orderId,
        ]
      );

      // 4. Create Addition KOT (Contains ONLY the added items)
      await client.query(
        `INSERT INTO kot_tickets (id, restaurant_id, order_id, table_number, order_type, status, is_addition, batch_number)
         VALUES ($1, $2, $3, $4, $5, 'new', TRUE, $6)`,
        [kotId, restaurantId, orderId, order.table_number, order.order_type, nextBatchNumber]
      );

      // 5. Insert KOT Items
      for (const it of additionalItems) {
        const kotItemId = `koti_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO kot_ticket_items (id, kot_id, dish_id, name, quantity, notes, is_veg)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [kotItemId, kotId, it.dish.id, it.dish.name, it.quantity, it.notes || null, it.dish.isVeg ?? true]
        );
      }

      // 6. Update Table Total
      if (order.table_number) {
        await client.query(
          `UPDATE tables SET current_total = $1, updated_at = NOW()
           WHERE restaurant_id = $2 AND number = $3`,
          [totals.grandTotal, restaurantId, order.table_number]
        );
      }
    });

    // 7. Realtime WebSocket Broadcast
    broadcastToRestaurant(restaurantId, 'NEW_KOT', {
      kotId,
      orderId,
      status: 'new',
      isAddition: true,
      createdAt: new Date().toISOString(),
      items: additionalItems.map((i: any) => ({
        dishId: i.dish.id,
        name: i.dish.name,
        quantity: i.quantity,
        notes: i.notes,
        isVeg: i.dish.isVeg,
      })),
    });

    broadcastToRestaurant(restaurantId, 'ORDER_UPDATED', { orderId });

    res.json({ success: true, message: 'Addition KOT sent to kitchen.' });
  } catch (err: any) {
    console.error('[Add Items Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'FAILED_TO_ADD_ITEMS' });
  }
});

/**
 * POST /api/orders/:id/request-bill
 * Request bill settlement and change status to 'bill_requested'
 */
router.post('/:id/request-bill', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id: orderId } = req.params;

    const orderRes = await query(
      `UPDATE orders SET status = 'bill_requested', updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING table_number`,
      [orderId, restaurantId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' });
      return;
    }

    const tableNumber = orderRes.rows[0].table_number;
    if (tableNumber) {
      await query(
        `UPDATE tables SET status = 'bill_requested', updated_at = NOW()
         WHERE restaurant_id = $1 AND number = $2`,
        [restaurantId, tableNumber]
      );
      broadcastToRestaurant(restaurantId, 'TABLE_STATUS_CHANGED', { tableNumber, status: 'bill_requested' });
    }

    broadcastToRestaurant(restaurantId, 'ORDER_UPDATED', { orderId, status: 'bill_requested' });
    res.json({ success: true, message: 'Bill requested.' });
  } catch (err) {
    console.error('[Request Bill Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_REQUEST_BILL' });
  }
});

/**
 * POST /api/orders/:id/payment
 * Staff submits payment for review
 */
router.post('/:id/payment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id: orderId } = req.params;
    const { method, amount, receivedAmount, change, refNumber } = req.body;

    const paymentId = `pay_${Date.now()}`;

    await withTransaction(async (client) => {
      // 1. Insert Payment
      await client.query(
        `INSERT INTO payments (id, restaurant_id, order_id, method, amount, received_amount, change, ref_number, status, submitted_by_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)`,
        [paymentId, restaurantId, orderId, method, amount, receivedAmount || null, change || null, refNumber || null, req.user!.id]
      );

      // 2. Update Order status
      const ordRes = await client.query(
        `UPDATE orders SET status = 'payment_submitted', updated_at = NOW()
         WHERE id = $1 AND restaurant_id = $2
         RETURNING table_number`,
        [orderId, restaurantId]
      );

      const tableNumber = ordRes.rows[0]?.table_number;
      if (tableNumber) {
        await client.query(
          `UPDATE tables SET status = 'payment_pending', updated_at = NOW()
           WHERE restaurant_id = $1 AND number = $2`,
          [restaurantId, tableNumber]
        );
      }
    });

    broadcastToRestaurant(restaurantId, 'PAYMENT_SUBMITTED', { orderId, method, amount });
    res.json({ success: true, message: 'Payment submitted for verification.' });
  } catch (err) {
    console.error('[Submit Payment Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_SUBMIT_PAYMENT' });
  }
});

/**
 * POST /api/orders/:id/verify-payment
 * Admin-Only Atomic PostgreSQL Transaction:
 * Verify payment + insert sale record + close order + release table to 'available' + audit log
 */
router.post('/:id/verify-payment', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id: orderId } = req.params;

    let orderInfo: any = null;

    await withTransaction(async (client) => {
      // 1. Update Payment status to 'verified'
      await client.query(
        `UPDATE payments
         SET status = 'verified', verified_at = NOW(), verified_by_id = $1
         WHERE order_id = $2 AND restaurant_id = $3`,
        [req.user!.id, orderId, restaurantId]
      );

      // 2. Update Order to 'closed' / 'payment_verified'
      const ordRes = await client.query(
        `UPDATE orders
         SET status = 'closed', updated_at = NOW()
         WHERE id = $1 AND restaurant_id = $2
         RETURNING *`,
        [orderId, restaurantId]
      );

      if (ordRes.rows.length === 0) {
        throw new Error('ORDER_NOT_FOUND');
      }
      orderInfo = ordRes.rows[0];

      // 3. Create Permanent Sale Record
      const saleId = `sale_${Date.now()}`;
      await client.query(
        `INSERT INTO sales (
           id, restaurant_id, order_id, bill_number, order_type,
           subtotal, discount, taxable_amount, cgst, sgst, total_gst, round_off,
           grand_total, payment_method, sale_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'VERIFIED', CURRENT_DATE)
         ON CONFLICT (order_id) DO NOTHING`,
        [
          saleId,
          restaurantId,
          orderId,
          orderInfo.bill_number,
          orderInfo.order_type,
          orderInfo.subtotal,
          orderInfo.discount,
          orderInfo.taxable_amount,
          orderInfo.cgst,
          orderInfo.sgst,
          orderInfo.total_gst,
          orderInfo.round_off,
          orderInfo.grand_total,
        ]
      );

      // 4. Release Table to 'available'
      if (orderInfo.table_number) {
        await client.query(
          `UPDATE tables
           SET status = 'available', current_order_id = NULL, current_total = 0.00, active_employee_id = NULL, updated_at = NOW()
           WHERE restaurant_id = $1 AND number = $2`,
          [restaurantId, orderInfo.table_number]
        );
      }

      // 5. Audit Log
      const auditId = `aud_${Date.now()}`;
      await client.query(
        `INSERT INTO audit_logs (id, restaurant_id, actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, 'PAYMENT_VERIFIED', 'ORDER', $4, $5)`,
        [
          auditId,
          restaurantId,
          req.user!.id,
          orderId,
          JSON.stringify({ billNumber: orderInfo.bill_number, grandTotal: orderInfo.grand_total }),
        ]
      );
    });

    // 6. Realtime WebSocket Broadcast
    broadcastToRestaurant(restaurantId, 'PAYMENT_VERIFIED', {
      orderId,
      billNumber: orderInfo.bill_number,
      grandTotal: orderInfo.grand_total,
    });

    if (orderInfo.table_number) {
      broadcastToRestaurant(restaurantId, 'TABLE_STATUS_CHANGED', {
        tableNumber: orderInfo.table_number,
        status: 'available',
      });
    }

    res.json({ success: true, message: 'Payment verified and table closed.' });
  } catch (err: any) {
    console.error('[Verify Payment Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'FAILED_TO_VERIFY_PAYMENT' });
  }
});

export default router;
