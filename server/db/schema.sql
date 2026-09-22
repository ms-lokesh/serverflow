-- ServeFlow PostgreSQL Relational Schema
-- Supports multi-tenant (single restaurant ready), RBAC, atomic order/KOT transactions, and audit logging.

CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    gstin VARCHAR(50),
    fssai VARCHAR(50),
    upi_id VARCHAR(100),
    gst_percent NUMERIC(5, 2) DEFAULT 5.00,
    is_gst_enabled BOOLEAN DEFAULT TRUE,
    service_charge_percent NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DINING', 'KITCHEN', 'TAKEAWAY')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT uq_restaurant_employee_id UNIQUE (restaurant_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(20) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (role, permission_name)
);

CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'bill_requested', 'payment_pending')),
    current_order_id VARCHAR(64),
    current_total NUMERIC(10, 2) DEFAULT 0.00,
    active_employee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_restaurant_table_number UNIQUE (restaurant_id, number)
);

CREATE TABLE IF NOT EXISTS dishes (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    gst_percentage NUMERIC(5, 2) DEFAULT 5.00,
    is_available BOOLEAN DEFAULT TRUE,
    is_veg BOOLEAN DEFAULT TRUE,
    description TEXT,
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dining', 'takeaway')),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    pickup_time VARCHAR(50),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN (
        'created', 'sent_to_kitchen', 'preparing', 'ready', 'served',
        'bill_requested', 'payment_submitted', 'payment_verified', 'closed', 'payment_rejected'
    )),
    employee_id VARCHAR(64) NOT NULL REFERENCES users(id),
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(10, 2) DEFAULT 0.00,
    cgst NUMERIC(10, 2) DEFAULT 0.00,
    sgst NUMERIC(10, 2) DEFAULT 0.00,
    total_gst NUMERIC(10, 2) DEFAULT 0.00,
    round_off NUMERIC(10, 2) DEFAULT 0.00,
    grand_total NUMERIC(10, 2) DEFAULT 0.00,
    bill_number VARCHAR(50),
    batches_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    category VARCHAR(100),
    is_veg BOOLEAN DEFAULT TRUE,
    is_addition BOOLEAN DEFAULT FALSE,
    batch_id INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kot_tickets (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_number VARCHAR(20),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dining', 'takeaway')),
    customer_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'served')),
    is_addition BOOLEAN DEFAULT FALSE,
    batch_number INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kot_status ON kot_tickets(status);

CREATE TABLE IF NOT EXISTS kot_ticket_items (
    id VARCHAR(64) PRIMARY KEY,
    kot_id VARCHAR(64) NOT NULL REFERENCES kot_tickets(id) ON DELETE CASCADE,
    dish_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,
    is_veg BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'UPI', 'CARD')),
    amount NUMERIC(10, 2) NOT NULL,
    received_amount NUMERIC(10, 2),
    change NUMERIC(10, 2),
    ref_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason VARCHAR(255),
    rejection_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) NOT NULL,
    taxable_amount NUMERIC(10, 2) NOT NULL,
    cgst NUMERIC(10, 2) NOT NULL,
    sgst NUMERIC(10, 2) NOT NULL,
    total_gst NUMERIC(10, 2) NOT NULL,
    round_off NUMERIC(10, 2) NOT NULL,
    grand_total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    actor_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    restaurant_id VARCHAR(64) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    order_id VARCHAR(64),
    table_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
