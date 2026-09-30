import { query, pool } from './pool';

async function cleanProduction() {
  console.log('[ServeFlow Onboarding] Resetting database to production-ready state...');

  try {
    // 1. Remove all test / demo transactions
    await query('DELETE FROM order_items');
    await query('DELETE FROM kot_ticket_items');
    await query('DELETE FROM kot_tickets');
    await query('DELETE FROM payments');
    await query('DELETE FROM sales');
    await query('DELETE FROM orders');
    await query('DELETE FROM notifications');

    // 2. Reset all tables to available with ₹0 balance
    await query(
      `UPDATE tables
       SET status = 'available',
           current_order_id = NULL,
           current_total = 0.00,
           active_employee_id = NULL,
           updated_at = NOW()`
    );

    // 3. Reset audit logs to a clean onboarding entry
    await query('DELETE FROM audit_logs');
    await query(
      `INSERT INTO audit_logs (id, restaurant_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `aud_onboard_${Date.now()}`,
        'rest_spice_house_01',
        'usr_admin_01',
        'CLIENT_ONBOARDING_READY',
        'SYSTEM',
        'rest_spice_house_01',
        JSON.stringify({
          status: 'PRODUCTION_READY',
          todaySales: 0,
          totalOrders: 0,
          activeTables: 0,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    console.log('✅ [ServeFlow Onboarding] All dummy transactions, orders, KOTs, and payments removed.');
    console.log('✅ [ServeFlow Onboarding] All dining tables reset to "available" with ₹0 current total.');
    console.log('✅ [ServeFlow Onboarding] Master menu and user roles preserved.');
    console.log('🚀 [ServeFlow Onboarding] Database is now 100% production-ready for client onboarding!');
  } catch (err) {
    console.error('❌ [Clean Production Error]:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanProduction();
