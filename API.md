# ServeFlow API & WebSocket Specification

Base URL: `/api` (and `/auth`)

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates any restaurant persona. Sets HttpOnly session cookies.
- **Request Body:**
  ```json
  {
    "identifier": "DIN-001",
    "password": "dining123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_dining_01",
        "restaurantId": "rest_spice_house_01",
        "employeeId": "DIN-001",
        "name": "Arun Kumar",
        "email": "arun@serveflow.com",
        "phone": "+91 98765 11111",
        "role": "DINING",
        "status": "ACTIVE",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "restaurantName": "Spice House Restaurant"
      },
      "permissions": ["orders.create", "orders.add_items", "tables.view", "..."],
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: `{"success": false, "error": "INVALID_CREDENTIALS", "message": "Invalid employee ID or password."}`
  - `403 Forbidden`: `{"success": false, "error": "INACTIVE_ACCOUNT", "message": "Your account is inactive. Please contact your administrator."}`

### `POST /auth/refresh`
Refreshes the short-lived access token using the HttpOnly refresh cookie.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "user": { ... },
      "permissions": [ ... ]
    }
  }
  ```

### `POST /auth/logout`
Clears session cookies and logs `LOGOUT` in `audit_logs`.
- **Response (200 OK):** `{"success": true, "message": "Logged out successfully"}`

### `GET /auth/me`
Retrieves current authenticated session.
- **Response (200 OK):** `{"success": true, "data": { "user": { ... }, "permissions": [ ... ] }}`

---

## 2. Employee Management Endpoints (Admin Only)

### `GET /api/employees`
Lists employees with optional query parameters (`?q=...&role=...&status=...`).
- **Response (200 OK):** `{"success": true, "data": [ { "id": "...", "employeeId": "DIN-001", "name": "...", "role": "DINING", "status": "ACTIVE" } ]}`

### `POST /api/employees`
Creates an employee. Password is automatically hashed with Argon2id.
- **Request Body:**
  ```json
  {
    "name": "Vikas Sharma",
    "role": "DINING",
    "email": "vikas@serveflow.com",
    "phone": "+91 98765 44444",
    "password": "temporarypassword",
    "confirmPassword": "temporarypassword"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": { "id": "usr_...", "employeeId": "DIN-002", "name": "Vikas Sharma", "role": "DINING", "status": "ACTIVE" },
    "message": "Employee created successfully. Employee ID: DIN-002"
  }
  ```

### `PUT /api/employees/:id`
Updates employee profile, role, or status.

### `POST /api/employees/:id/deactivate`
Soft-deactivates an employee account (`status = INACTIVE`).

### `POST /api/employees/:id/activate`
Reactivates an employee account (`status = ACTIVE`).

### `POST /api/employees/:id/reset-password`
Admin sets a new temporary password (Argon2id hashed).
- **Request Body:** `{"newPassword": "newSecretPassword123"}`

### `GET /api/employees/audit`
Returns audit history for employee creation, role changes, deactivations, and password resets.

---

## 3. Order & Dining Endpoints

### `GET /api/orders`
Lists restaurant orders with line items, payments, and timestamps.

### `POST /api/orders`
**Atomic PostgreSQL Transaction:**
1. Inserts into `orders`.
2. Inserts into `order_items`.
3. Inserts into `kot_tickets` (`status = 'new'`).
4. Inserts into `kot_ticket_items`.
5. Updates `tables` (`status = 'occupied'`, `current_order_id`, `current_total`, `active_employee_id`).
6. Broadcasts `NEW_KOT` and `TABLE_STATUS_CHANGED` via WebSocket.

### `POST /api/orders/:id/items`
**Atomic PostgreSQL Transaction:**
Appends additional items to an existing order, recalculates totals, and dispatches an addition KOT containing **only the added items**.

### `POST /api/orders/:id/request-bill`
Sets order and table status to `bill_requested` and broadcasts `TABLE_STATUS_CHANGED`.

### `POST /api/orders/:id/payment`
Staff submits payment for admin verification. Updates order to `payment_submitted` and table to `payment_pending`. Broadcasts `PAYMENT_SUBMITTED`.

### `POST /api/orders/:id/verify-payment`
**Admin-Only Atomic PostgreSQL Transaction:**
1. Updates `payments.status = 'verified'`.
2. Updates `orders.status = 'closed'`.
3. Inserts permanent record into `sales`.
4. Releases table to `available`.
5. Writes `PAYMENT_VERIFIED` to `audit_logs`.
6. Broadcasts `PAYMENT_VERIFIED` and `TABLE_STATUS_CHANGED` (`available`).

---

## 4. Kitchen Display System (KDS) Endpoints

### `GET /api/kot`
Fetches all active KOT tickets with their line items.

### `PATCH /api/kot/:id/status`
Transitions KOT ticket: `new` $\to$ `preparing` $\to$ `ready` $\to$ `served`.
Broadcasts `KOT_STATUS_UPDATED` to all dining and admin clients.

---

## 5. WebSocket Event Specifications

Connected to `/ws`. All events are scoped by `restaurantId`.

| Event | Direction | Payload |
| :--- | :--- | :--- |
| `NEW_KOT` | Server $\to$ Kitchen | `{ kotId, orderId, tableNumber, items: [...], isAddition, batchNumber }` |
| `KOT_STATUS_UPDATED` | Server $\to$ Dining / Admin | `{ kotId, orderId, tableNumber, status, timestamp }` |
| `TABLE_STATUS_CHANGED` | Server $\to$ All | `{ tableNumber, status, currentOrderId, currentTotal }` |
| `ORDER_CREATED` | Server $\to$ All | `{ orderId, tableNumber, totals }` |
| `ORDER_UPDATED` | Server $\to$ All | `{ orderId, status }` |
| `PAYMENT_SUBMITTED` | Server $\to$ Admin | `{ orderId, method, amount }` |
| `PAYMENT_VERIFIED` | Server $\to$ All | `{ orderId, billNumber, grandTotal }` |
