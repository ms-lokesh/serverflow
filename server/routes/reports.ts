import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/reports/daily-summary
 * Aggregated sales and tax summary for the current business day
 */
router.get('/daily-summary', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    // Aggregate sales for today
    const salesRes = await query(
      `SELECT
         COUNT(id) as paid_orders,
         COALESCE(SUM(grand_total), 0) as total_sales,
         COALESCE(SUM(CASE WHEN order_type = 'dining' THEN grand_total ELSE 0 END), 0) as dining_sales,
         COALESCE(SUM(CASE WHEN order_type = 'takeaway' THEN grand_total ELSE 0 END), 0) as takeaway_sales,
         COALESCE(SUM(taxable_amount), 0) as taxable_sales,
         COALESCE(SUM(cgst), 0) as cgst,
         COALESCE(SUM(sgst), 0) as sgst,
         COALESCE(SUM(total_gst), 0) as total_gst
       FROM sales
       WHERE restaurant_id = $1 AND sale_date = CURRENT_DATE`,
      [restaurantId]
    );

    // Aggregate payment methods from payments table for today
    const payRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN method = 'CASH' AND status = 'verified' THEN amount ELSE 0 END), 0) as cash_coll,
         COALESCE(SUM(CASE WHEN method = 'UPI' AND status = 'verified' THEN amount ELSE 0 END), 0) as upi_coll,
         COALESCE(SUM(CASE WHEN method = 'CARD' AND status = 'verified' THEN amount ELSE 0 END), 0) as card_coll,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_coll
       FROM payments
       WHERE restaurant_id = $1 AND DATE(submitted_at) = CURRENT_DATE`,
      [restaurantId]
    );

    // Open orders count
    const openOrdersRes = await query(
      `SELECT COUNT(id) as open_orders FROM orders
       WHERE restaurant_id = $1 AND status NOT IN ('closed', 'payment_verified')`,
      [restaurantId]
    );

    const s = salesRes.rows[0];
    const p = payRes.rows[0];
    const paidCount = parseInt(s.paid_orders || '0', 10);
    const openCount = parseInt(openOrdersRes.rows[0].open_orders || '0', 10);

    const summary = {
      date: new Date().toISOString().split('T')[0],
      todaySales: parseFloat(s.total_sales || '0'),
      totalSales: parseFloat(s.total_sales || '0'),
      paidOrders: paidCount,
      openOrders: openCount,
      openTables: openCount,
      totalOrders: paidCount + openCount,
      diningSales: parseFloat(s.dining_sales || '0'),
      takeawaySales: parseFloat(s.takeaway_sales || '0'),
      cashSales: parseFloat(p.cash_coll || '0'),
      cashCollection: parseFloat(p.cash_coll || '0'),
      upiSales: parseFloat(p.upi_coll || '0'),
      upiCollection: parseFloat(p.upi_coll || '0'),
      cardSales: parseFloat(p.card_coll || '0'),
      cardCollection: parseFloat(p.card_coll || '0'),
      pendingPayments: parseFloat(p.pending_coll || '0'),
      pendingCollection: parseFloat(p.pending_coll || '0'),
      taxableSales: parseFloat(s.taxable_sales || '0'),
      cgst: parseFloat(s.cgst || '0'),
      sgst: parseFloat(s.sgst || '0'),
      totalGst: parseFloat(s.total_gst || '0'),
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('[Daily Summary Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_SUMMARY' });
  }
});

export default router;
