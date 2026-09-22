import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, pool } from './pool';
import { hashPassword } from '../utils/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('[Migration] Starting ServeFlow Database Migration...');

  // 1. Run Schema DDL
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await query(schemaSql);
  console.log('[Migration] Schema tables created successfully.');

  // 2. Seed Permissions
  const permissionsList = [
    // Dashboard & Admin
    { name: 'dashboard.view', desc: 'View admin overview dashboard' },
    { name: 'reports.view', desc: 'View financial and tax sales reports' },
    { name: 'settings.manage', desc: 'Manage restaurant configuration and tax settings' },
    { name: 'audit.view', desc: 'View security and employee audit logs' },
    { name: 'daily_closing.manage', desc: 'Manage daily EOD closing' },

    // Tables
    { name: 'tables.view', desc: 'View dining tables layout and status' },
    { name: 'tables.manage', desc: 'Manage table floor configuration' },

    // Orders
    { name: 'orders.view', desc: 'View all restaurant orders' },
    { name: 'orders.create', desc: 'Create new dining orders' },
    { name: 'orders.update', desc: 'Update order details' },
    { name: 'orders.add_items', desc: 'Append additional items to existing orders' },
    { name: 'orders.request_bill', desc: 'Request bill print and settlement' },

    // Kitchen
    { name: 'kitchen.view', desc: 'View live Kitchen Display System (KDS)' },
    { name: 'kitchen.update_status', desc: 'Update KOT ticket status (preparing, ready, served)' },
    { name: 'kitchen.view_order', desc: 'View order details from kitchen' },

    // Takeaway
    { name: 'takeaway.view', desc: 'View takeaway counter screen' },
    { name: 'takeaway.create_order', desc: 'Create takeaway orders' },
    { name: 'takeaway.update_order', desc: 'Update takeaway orders' },

    // Payments
    { name: 'payments.view', desc: 'View payment statuses' },
    { name: 'payments.submit', desc: 'Collect and submit payment for verification' },
    { name: 'payments.verify', desc: 'Verify and reconcile payments' },

    // Menu
    { name: 'menu.view', desc: 'View menu catalog' },
    { name: 'menu.create', desc: 'Add new menu items' },
    { name: 'menu.update', desc: 'Update menu prices, GST and availability' },
    { name: 'menu.delete', desc: 'Remove menu items' },

    // Employees
    { name: 'employees.view', desc: 'View employee directory' },
    { name: 'employees.create', desc: 'Create employee accounts' },
    { name: 'employees.update', desc: 'Update employee details and roles' },
    { name: 'employees.deactivate', desc: 'Deactivate / reactivate employee accounts' },
    { name: 'employees.reset_password', desc: 'Reset employee passwords' },
  ];

  for (const p of permissionsList) {
    await query(
      `INSERT INTO permissions (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [`perm_${p.name}`, p.name, p.desc]
    );
  }

  // Map Role Permissions
  const rolePermMap: Record<string, string[]> = {
    ADMIN: permissionsList.map((p) => p.name),
    DINING: [
      'tables.view',
      'orders.view',
      'orders.create',
      'orders.add_items',
      'orders.request_bill',
      'payments.submit',
      'takeaway.view',
      'menu.view',
    ],
    KITCHEN: [
      'kitchen.view',
      'kitchen.update_status',
      'kitchen.view_order',
      'menu.view',
    ],
    TAKEAWAY: [
      'takeaway.view',
      'takeaway.create_order',
      'takeaway.update_order',
      'orders.view',
      'payments.submit',
      'menu.view',
    ],
  };

  for (const [role, perms] of Object.entries(rolePermMap)) {
    for (const perm of perms) {
      await query(
        `INSERT INTO role_permissions (role, permission_name)
         VALUES ($1, $2)
         ON CONFLICT (role, permission_name) DO NOTHING`,
        [role, perm]
      );
    }
  }
  console.log('[Migration] Permissions and Role Mappings seeded.');

  // 3. Seed Default Restaurant
  const restaurantId = 'rest_spice_house_01';
  await query(
    `INSERT INTO restaurants (id, name, tagline, address, phone, gstin, fssai, upi_id, gst_percent, is_gst_enabled, service_charge_percent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [
      restaurantId,
      'Spice House Restaurant',
      'Authentic Flavors & Warm Hospitality',
      '124 Gourmet Boulevard, Indiranagar, Bengaluru, KA 560038',
      '+91 80 4123 4567',
      '29AAAAA0000A1Z5',
      '11223344000123',
      'spicehouse@upi',
      5.0,
      true,
      0.0,
    ]
  );
  console.log('[Migration] Restaurant seeded: Spice House Restaurant');

  // 4. Seed Users with Argon2id Password Hashing
  const defaultUsers = [
    {
      id: 'usr_admin_01',
      employeeId: 'ADM-001',
      name: 'Admin Manager',
      email: 'admin@serveflow.com',
      phone: '+91 98765 43214',
      role: 'ADMIN',
      password: 'admin123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: 'usr_dining_01',
      employeeId: 'DIN-001',
      name: 'Arun Kumar',
      email: 'arun@serveflow.com',
      phone: '+91 98765 11111',
      role: 'DINING',
      password: 'dining123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: 'usr_kitchen_01',
      employeeId: 'KIT-001',
      name: 'Chef Suresh',
      email: 'suresh@serveflow.com',
      phone: '+91 98765 22222',
      role: 'KITCHEN',
      password: 'kitchen123',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      id: 'usr_takeaway_01',
      employeeId: 'TAK-001',
      name: 'Manoj',
      email: 'manoj@serveflow.com',
      phone: '+91 98765 33333',
      role: 'TAKEAWAY',
      password: 'takeaway123',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    },
  ];

  for (const u of defaultUsers) {
    const passwordHash = await hashPassword(u.password);
    await query(
      `INSERT INTO users (id, restaurant_id, employee_id, name, email, phone, password_hash, role, status, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $9)
       ON CONFLICT (restaurant_id, employee_id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         status = 'ACTIVE'`,
      [u.id, restaurantId, u.employeeId, u.name, u.email, u.phone, passwordHash, u.role, u.avatar]
    );
    console.log(`[Migration] User seeded: ${u.employeeId} (${u.role}) -> Argon2id password hash stored.`);
  }

  // 5. Seed Tables (1 to 12)
  for (let i = 1; i <= 12; i++) {
    const tableNumber = i < 10 ? `0${i}` : `${i}`;
    const capacity = i <= 4 ? 2 : i <= 8 ? 4 : 6;
    await query(
      `INSERT INTO tables (id, restaurant_id, number, capacity, status)
       VALUES ($1, $2, $3, $4, 'available')
       ON CONFLICT (restaurant_id, number) DO NOTHING`,
      [`tbl_${tableNumber}`, restaurantId, tableNumber, capacity]
    );
  }
  console.log('[Migration] Tables 01 to 12 initialized.');

  // 6. Seed Dishes
  const dishes = [
    { id: 'dish_1', name: 'Paneer Tikka', category: 'Starters', price: 280, isVeg: true, popular: true },
    { id: 'dish_2', name: 'Chicken Seekh Kebab', category: 'Starters', price: 340, isVeg: false, popular: true },
    { id: 'dish_3', name: 'Crispy Corn', category: 'Starters', price: 210, isVeg: true, popular: false },
    { id: 'dish_4', name: 'Butter Chicken', category: 'Main Course', price: 380, isVeg: false, popular: true },
    { id: 'dish_5', name: 'Paneer Butter Masala', category: 'Main Course', price: 310, isVeg: true, popular: true },
    { id: 'dish_6', name: 'Dal Makhani', category: 'Main Course', price: 260, isVeg: true, popular: true },
    { id: 'dish_7', name: 'Garlic Naan', category: 'Breads', price: 65, isVeg: true, popular: false },
    { id: 'dish_8', name: 'Butter Roti', category: 'Breads', price: 35, isVeg: true, popular: false },
    { id: 'dish_9', name: 'Hyderabadi Chicken Biryani', category: 'Biryani', price: 360, isVeg: false, popular: true },
    { id: 'dish_10', name: 'Veg Dum Biryani', category: 'Biryani', price: 290, isVeg: true, popular: false },
    { id: 'dish_11', name: 'Fresh Lime Soda', category: 'Beverages', price: 90, isVeg: true, popular: false },
    { id: 'dish_12', name: 'Mango Lassi', category: 'Beverages', price: 130, isVeg: true, popular: true },
    { id: 'dish_13', name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 110, isVeg: true, popular: true },
    { id: 'dish_14', name: 'Rasmalai', category: 'Desserts', price: 140, isVeg: true, popular: true },
  ];

  for (const d of dishes) {
    await query(
      `INSERT INTO dishes (id, restaurant_id, name, category, price, gst_percentage, is_available, is_veg, popular)
       VALUES ($1, $2, $3, $4, $5, 5.0, true, $6, $7)
       ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, name = EXCLUDED.name`,
      [d.id, restaurantId, d.name, d.category, d.price, d.isVeg, d.popular]
    );
  }
  console.log(`[Migration] ${dishes.length} menu dishes seeded.`);

  // 7. Seed Initial Audit Log
  await query(
    `INSERT INTO audit_logs (id, restaurant_id, actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, 'SYSTEM_INITIALIZATION', 'SYSTEM', 'rest_spice_house_01', '{"version": "2.4.0", "status": "READY"}')`,
    [`aud_init_${Date.now()}`, restaurantId, 'usr_admin_01']
  );

  console.log('[Migration] Completed successfully!');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[Migration Failed]:', err);
  process.exit(1);
});
