# ServeFlow Authentication & RBAC Documentation

## 1. Overview

ServeFlow employs an authoritative, multi-persona authentication system backed by PostgreSQL, Argon2id cryptographic hashing, short-lived JWT access tokens, and long-lived refresh tokens stored in secure `HttpOnly`, `SameSite` cookies.

Local React state and localStorage are never the source of truth for identity, authentication, or permissions. All roles, statuses, and permissions are determined and enforced authoritatively on the backend.

---

## 2. Personas & Visual Identity

Each persona has a distinct visual identity using curated role colors while preserving ServeFlow's clean POS design:

| Role | Primary Color | Purpose | Landing Route |
| :--- | :--- | :--- | :--- |
| **ADMIN** | **Red** (`#C94B4B`) | Management, reporting, employee administration, payment verification | `/admin/dashboard` |
| **DINING** | **Blue** (`#2563EB`) | Floor tables, dining orders, additions, bill requests, payment collection | `/dining/tables` |
| **KITCHEN** | **Orange** (`#EA580C`) | Live KDS board, ticket status transitions (Accept, Prepare, Ready) | `/kitchen` |
| **TAKEAWAY** | **Green** (`#16A34A`) | Counter orders, takeaway tracking, bill collection | `/takeaway` |

Role colors are applied consistently to role badges, avatar initials, navigation indicators, card accents, and status labels.

---

## 3. Login Flow

1. The user visits `/login` (or root when unauthenticated).
2. The user inputs their **Employee ID**, **Email**, or **Username** along with their **Password**.
3. **No role selection is permitted on the login page.** The backend role is authoritative.
4. Client sends:
   ```json
   POST /auth/login
   {
     "identifier": "DIN-001",
     "password": "diningpassword"
   }
   ```
5. Backend:
   - Queries `users` matching employee ID, email, or name.
   - Checks account status: if `INACTIVE` or `SUSPENDED`, halts with `403 Forbidden` and message: `"Your account is inactive. Please contact your administrator."`
   - Verifies the password against the stored Argon2id hash using native `@node-rs/argon2`.
   - If invalid, halts with `401 Unauthorized`.
   - Generates JWT Access Token (15 min) and Refresh Token (7 days).
   - Sets secure `HttpOnly`, `SameSite: Lax` cookies on the response:
     - `serveflow_access` (15 minutes)
     - `serveflow_refresh` (7 days)
   - Updates `last_login_at = NOW()`.
   - Writes `LOGIN_SUCCESS` to the `audit_logs` table (guaranteeing zero passwords in logs).
   - Returns sanitized user object and permission array (never returns `password_hash`).
6. The frontend `AuthContext` initializes the session, establishes the authenticated WebSocket connection, and automatically redirects the user to their persona dashboard based on `user.role`.

---

## 4. Token & Session Management

- **Access Token**: Short-lived (15 minutes). Sent in HttpOnly cookie or `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived (7 days). Stored in an HttpOnly cookie.
- **Silent Refresh**: When the access token expires, `POST /auth/refresh` or the `authenticateToken` middleware automatically validates the refresh token and re-issues a new access token without interrupting user operations.
- **Logout**: `POST /auth/logout` clears both cookies, records a `LOGOUT` audit log, and closes the WebSocket connection.

---

## 5. Role-Based Access Control (RBAC) Permissions Matrix

| Permission | ADMIN | DINING | KITCHEN | TAKEAWAY |
| :--- | :---: | :---: | :---: | :---: |
| `dashboard.view` | ✅ | ❌ | ❌ | ❌ |
| `tables.view` | ✅ | ✅ | ❌ | ❌ |
| `tables.manage` | ✅ | ❌ | ❌ | ❌ |
| `orders.view` | ✅ | ✅ | ❌ | ✅ |
| `orders.create` | ✅ | ✅ | ❌ | ❌ |
| `orders.add_items` | ✅ | ✅ | ❌ | ❌ |
| `orders.request_bill` | ✅ | ✅ | ❌ | ❌ |
| `kitchen.view` | ✅ | ❌ | ✅ | ❌ |
| `kitchen.update_status` | ✅ | ❌ | ✅ | ❌ |
| `takeaway.view` | ✅ | ✅ | ❌ | ✅ |
| `takeaway.create_order` | ✅ | ❌ | ❌ | ✅ |
| `payments.view` | ✅ | ❌ | ❌ | ❌ |
| `payments.submit` | ✅ | ✅ | ❌ | ✅ |
| `payments.verify` | ✅ | ❌ | ❌ | ❌ |
| `menu.view` | ✅ | ✅ | ✅ | ✅ |
| `menu.create` / `update` | ✅ | ❌ | ❌ | ❌ |
| `employees.view` | ✅ | ❌ | ❌ | ❌ |
| `employees.create` | ✅ | ❌ | ❌ | ❌ |
| `employees.update` | ✅ | ❌ | ❌ | ❌ |
| `employees.deactivate` | ✅ | ❌ | ❌ | ❌ |
| `employees.reset_password`| ✅ | ❌ | ❌ | ❌ |
| `reports.view` | ✅ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ❌ | ❌ | ❌ |
| `daily_closing.manage` | ✅ | ❌ | ❌ | ❌ |

---

## 6. Route Protection

- Protected routes are guarded by client-side guards and reinforced by backend API middleware:
  - `/admin/*` requires `role === 'admin'`. Unauthorized access renders `Access Denied`.
  - `/dining/*` requires `role === 'dining'`. Unauthorized access renders `Access Denied`.
  - `/kitchen/*` requires `role === 'kitchen'`. Unauthorized access renders `Access Denied`.
  - `/takeaway/*` requires `role === 'takeaway'`. Unauthorized access renders `Access Denied`.
- Backend endpoints enforce `requireRole(...)` and `requirePermission(...)`, returning `403 Forbidden` if breached.

---

## 7. Employee Lifecycle & ID Generation

### Employee ID Generation
Employee IDs are unique per restaurant and generated by querying the max sequence for each role prefix:
- `DIN-001`, `DIN-002` for Dining
- `KIT-001`, `KIT-002` for Kitchen
- `TAK-001`, `TAK-002` for Takeaway
- `ADM-001` for Administrator

### Creation
- Admin specifies Name, Email, Phone, Role, Password, and Confirm Password.
- Password is encrypted using Argon2id (`memoryCost: 19456`, `timeCost: 2`, `outputLen: 32`).
- Password is never returned in the API response or displayed after creation.

### Editing & Role Change
- Admin can edit Name, Email, Phone, Role, Status, and Avatar.
- Upon role change (e.g. `DINING` $\to$ `KITCHEN`), the backend immediately updates permissions and logs a `ROLE_CHANGED` audit record.

### Deactivation vs Deletion
- Employees are **never hard-deleted** if they have historical activity.
- Setting `status = 'INACTIVE'` immediately blocks future logins while preserving historical orders, KOTs, payments, and audit logs.

### Password Reset
- Admin inputs a new temporary password.
- Backend hashes it with Argon2id and updates the database.
- Previous passwords cannot be retrieved.

---

## 8. WebSocket Authentication & Isolation

1. WebSocket connects to `/ws` with session cookie or query token.
2. Token is verified against `JWT_ACCESS_SECRET`.
3. Socket is bound to `userId`, `restaurantId`, and `role`.
4. All real-time event broadcasts (`NEW_KOT`, `KOT_STATUS_UPDATED`, `PAYMENT_SUBMITTED`, etc.) are filtered by `restaurantId` to guarantee tenant data isolation.
5. Heartbeat ping/pong runs every 25 seconds; disconnected clients automatically reconnect with exponential backoff and reconcile UI state.
