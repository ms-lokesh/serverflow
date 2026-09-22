import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/sync/pulse
 * High-speed sub-second synchronization endpoint
 * Aggregates current live restaurant state (tables, active orders, active KOTs, dish availability)
 * in a single atomic payload to guarantee 1-second multi-terminal consistency.
 */
router.get('/pulse', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const now = new Date().toISOString();

    // 1. Fetch tables
    const tablesRes = await query(
      `SELECT id, number, capacity, status, current_order_id as "currentOrderId", current_total as "currentTotal", active_employee_id as "activeEmployee"
       FROM tables
       WHERE restaurant_id = $1
       ORDER BY number ASC`,
      [restaurantId]
    );

    // 2. Fetch active orders (non-closed or recent)
    const ordersRes = await query(
      `SELECT o.*, u.name as employee_name, u.role as employee_role,
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
       WHERE o.restaurant_id = $1 AND (o.status != 'closed' OR o.created_at >= NOW() - INTERVAL '1 hour')
       ORDER BY o.created_at DESC LIMIT 60`,
      [restaurantId]
    );

    // Fetch items for active orders
    const orderIds = ordersRes.rows.map((r) => r.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const itemsRes = await query(
        `SELECT id, order_id, dish_id, name, price, quantity, category, is_veg, is_addition, batch_id, notes
         FROM order_items
         WHERE order_id = ANY($1)
         ORDER BY created_at ASC`,
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

    const orders = ordersRes.rows.map((r) => {
      const currentIdx = statusOrder[r.status] ?? 0;
      const isClosed = r.status === 'closed' || r.status === 'payment_verified';

      return {
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
        timeline: stages.map((s, idx) => ({
          id: s.id,
          title: s.title,
          time:
            idx === 0 && r.created_at
              ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : idx <= currentIdx
              ? 'Done'
              : 'Pending',
          completed: idx < currentIdx || (idx === currentIdx && isClosed),
          current: idx === currentIdx && !isClosed,
          subtitle: idx === currentIdx && r.status === 'payment_submitted' ? 'Waiting for Admin Verification' : undefined,
        })),
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
      };
    });

    // 3. Fetch active KOT tickets
    const kotRes = await query(
      `SELECT k.*, ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'dishId', ki.dish_id,
          'name', ki.name,
          'quantity', ki.quantity,
          'notes', ki.notes,
          'isVeg', ki.is_veg
        )
      ) as items
      FROM kot_tickets k
      LEFT JOIN kot_ticket_items ki ON k.id = ki.kot_id
      WHERE k.restaurant_id = $1 AND (k.status != 'served' OR k.created_at >= NOW() - INTERVAL '30 minutes')
      GROUP BY k.id
      ORDER BY k.created_at DESC`,
      [restaurantId]
    );

    const kitchenTickets = kotRes.rows.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      tableNumber: r.table_number,
      orderType: r.order_type,
      customerName: r.customer_name,
      status: r.status,
      isAddition: r.is_addition,
      batchNumber: r.batch_number,
      createdAt: r.created_at,
      acceptedAt: r.accepted_at,
      readyAt: r.ready_at,
      servedAt: r.served_at,
      items: r.items?.[0]?.dishId ? r.items : [],
    }));

    // 4. Fetch dish availability list (fast stock check)
    const dishesRes = await query(
      `SELECT id, name, category, price, gst_percentage, is_available, is_veg, description, popular
       FROM dishes
       WHERE restaurant_id = $1
       ORDER BY category, name ASC`,
      [restaurantId]
    );

    const dishes = dishesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: parseFloat(r.price),
      gstPercentage: parseFloat(r.gst_percentage || '5'),
      isAvailable: r.is_available,
      isVeg: r.is_veg,
      description: r.description,
      popular: r.popular,
    }));

    res.json({
      success: true,
      serverTime: now,
      data: {
        tables: tablesRes.rows.map((t) => ({
          id: t.id,
          number: t.number,
          capacity: t.capacity,
          status: t.status,
          currentOrderId: t.currentOrderId || undefined,
          currentTotal: parseFloat(t.currentTotal || '0'),
          activeEmployee: t.activeEmployee || undefined,
        })),
        orders,
        kitchenTickets,
        dishes,
      },
    });
  } catch (err) {
    console.error('[Sync Pulse Error]:', err);
    res.status(500).json({ success: false, error: 'SYNC_PULSE_FAILED' });
  }
});

export default router;
