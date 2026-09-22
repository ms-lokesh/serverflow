/**
 * Automated Verification Suite for ServeFlow
 * Tests Authentication, RBAC, Inactive Account Handling, Admin Employee Management,
 * and the End-to-End Dining -> KOT -> Kitchen -> Addition -> Billing -> Payment Verification Flow.
 */

const BASE_URL = 'http://localhost:4000';

async function req(url: string, options: any = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING SERVEFLOW AUTOMATED INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail || ''}`);
      failed++;
    }
  }

  // 1. Admin Login
  console.log('\n--- Test Group 1: Authentication & Personas ---');
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'ADM-001', password: 'admin123' }),
  });
  assert(adminLogin.status === 200 && adminLogin.data.success, 'Admin Login (ADM-001)');
  assert(!adminLogin.data.data.user.password_hash && !adminLogin.data.data.user.password, 'No passwordHash in response');
  const adminToken = adminLogin.data.data.accessToken;

  // 2. Dining Staff Login
  const diningLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'DIN-001', password: 'dining123' }),
  });
  assert(diningLogin.status === 200 && diningLogin.data.data.user.role === 'DINING', 'Dining Login (DIN-001)');
  const diningToken = diningLogin.data.data.accessToken;

  // 3. Kitchen Staff Login
  const kitchenLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'KIT-001', password: 'kitchen123' }),
  });
  assert(kitchenLogin.status === 200 && kitchenLogin.data.data.user.role === 'KITCHEN', 'Kitchen Login (KIT-001)');
  const kitchenToken = kitchenLogin.data.data.accessToken;

  // 4. Takeaway Staff Login
  const takeawayLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'TAK-001', password: 'takeaway123' }),
  });
  assert(takeawayLogin.status === 200 && takeawayLogin.data.data.user.role === 'TAKEAWAY', 'Takeaway Login (TAK-001)');

  // 5. Invalid Credentials Handling
  const invalidLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'ADM-001', password: 'wrongpassword' }),
  });
  assert(invalidLogin.status === 401 && invalidLogin.data.error === 'INVALID_CREDENTIALS', 'Invalid Password Rejection (401)');

  // 6. RBAC Protection
  console.log('\n--- Test Group 2: RBAC Enforcement ---');
  const diningAccessAdmin = await req('/api/employees', {
    headers: { Authorization: `Bearer ${diningToken}` },
  });
  assert(diningAccessAdmin.status === 403, 'Dining blocked from /api/employees (403 Forbidden)');

  const kitchenAccessReports = await req('/api/reports/daily-summary', {
    headers: { Authorization: `Bearer ${kitchenToken}` },
  });
  assert(kitchenAccessReports.status === 403, 'Kitchen blocked from /api/reports/daily-summary (403 Forbidden)');

  // 7. Admin Employee Management: Create Employee
  console.log('\n--- Test Group 3: Admin Employee Lifecycle ---');
  const createEmp = await req('/api/employees', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Test Dining Staff',
      role: 'DINING',
      email: 'testdining@serveflow.com',
      phone: '+91 99999 88888',
      password: 'temporarypassword',
      confirmPassword: 'temporarypassword',
    }),
  });
  assert(createEmp.status === 201 && createEmp.data.data.employeeId, `Admin creates employee (${createEmp.data.data?.employeeId})`);
  const newEmpId = createEmp.data.data?.id;
  const newEmpEmployeeId = createEmp.data.data?.employeeId;

  // 8. Login as New Employee
  const newEmpLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: newEmpEmployeeId, password: 'temporarypassword' }),
  });
  assert(newEmpLogin.status === 200 && newEmpLogin.data.data.user.employeeId === newEmpEmployeeId, 'New employee logs in successfully');

  // 9. Admin Changes Role: DINING -> KITCHEN
  const updateRole = await req(`/api/employees/${newEmpId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'KITCHEN' }),
  });
  assert(updateRole.status === 200 && updateRole.data.data.role === 'KITCHEN', 'Admin changes role to KITCHEN');

  // 10. Re-login reflects new KITCHEN role
  const reLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: newEmpEmployeeId, password: 'temporarypassword' }),
  });
  assert(reLogin.status === 200 && reLogin.data.data.user.role === 'KITCHEN', 'Re-login reflects KITCHEN role permissions');

  // 11. Admin Deactivates Employee
  const deactivate = await req(`/api/employees/${newEmpId}/deactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(deactivate.status === 200, 'Admin deactivates employee account');

  // 12. Deactivated Employee Login Attempt
  const inactiveLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: newEmpEmployeeId, password: 'temporarypassword' }),
  });
  assert(
    inactiveLogin.status === 403 &&
    inactiveLogin.data.message === 'Your account is inactive. Please contact your administrator.',
    'Inactive account blocked with exact message'
  );

  // 13. Admin Reactivates Employee
  const reactivate = await req(`/api/employees/${newEmpId}/activate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(reactivate.status === 200, 'Admin reactivates employee');

  // 14. Admin Resets Password
  const resetPass = await req(`/api/employees/${newEmpId}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ newPassword: 'newSecretPassword123' }),
  });
  assert(resetPass.status === 200, 'Admin resets employee password');

  // 15. Login with New Password
  const loginWithNewPass = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: newEmpEmployeeId, password: 'newSecretPassword123' }),
  });
  assert(loginWithNewPass.status === 200, 'Login with new reset password succeeds');

  // 16. End-to-End Order Flow
  console.log('\n--- Test Group 4: Real Order-to-Payment Lifecycle ---');
  // Dining places order for Table 05
  const createOrder = await req('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${diningToken}` },
    body: JSON.stringify({
      tableNumber: '05',
      orderType: 'dining',
      items: [
        { dish: { id: 'dish_1', name: 'Paneer Tikka', price: 280, category: 'Starters', isVeg: true }, quantity: 2 },
        { dish: { id: 'dish_7', name: 'Garlic Naan', price: 65, category: 'Breads', isVeg: true }, quantity: 4 },
      ],
    }),
  });
  assert(createOrder.status === 201 && createOrder.data.data.orderId, `Dining places order (ID: ${createOrder.data.data?.orderId})`);
  const orderId = createOrder.data.data?.orderId;
  const kotId = createOrder.data.data?.kotId;

  // Check Table 05 is now 'occupied'
  const tablesAfterOrder = await req('/api/tables', {
    headers: { Authorization: `Bearer ${diningToken}` },
  });
  const table05 = tablesAfterOrder.data.data?.find((t: any) => t.number === '05');
  assert(table05?.status === 'occupied' && table05?.currentOrderId === orderId, 'Table 05 status atomically updated to OCCUPIED');

  // Kitchen marks KOT preparing then ready
  const kotPrep = await req(`/api/kot/${kotId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${kitchenToken}` },
    body: JSON.stringify({ status: 'preparing' }),
  });
  assert(kotPrep.status === 200, 'Kitchen accepts & starts preparing KOT');

  const kotReady = await req(`/api/kot/${kotId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${kitchenToken}` },
    body: JSON.stringify({ status: 'ready' }),
  });
  assert(kotReady.status === 200, 'Kitchen marks KOT READY');

  // Dining adds item (Addition KOT)
  const addItems = await req(`/api/orders/${orderId}/items`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${diningToken}` },
    body: JSON.stringify({
      additionalItems: [
        { dish: { id: 'dish_12', name: 'Mango Lassi', price: 130, category: 'Beverages', isVeg: true }, quantity: 2 },
      ],
    }),
  });
  assert(addItems.status === 200, 'Dining appends additional items to same order');

  // Dining requests bill
  const reqBill = await req(`/api/orders/${orderId}/request-bill`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${diningToken}` },
  });
  assert(reqBill.status === 200, 'Dining requests bill');

  // Dining submits payment
  const submitPay = await req(`/api/orders/${orderId}/payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${diningToken}` },
    body: JSON.stringify({
      method: 'CASH',
      amount: 1134,
      receivedAmount: 1200,
      change: 66,
    }),
  });
  assert(submitPay.status === 200, 'Dining submits CASH payment for verification');

  // Admin verifies payment
  const verifyPay = await req(`/api/orders/${orderId}/verify-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(verifyPay.status === 200, 'Admin verifies payment atomically');

  // Check Table 05 released to 'available'
  const tablesAfterPay = await req('/api/tables', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const table05After = tablesAfterPay.data.data?.find((t: any) => t.number === '05');
  assert(table05After?.status === 'available' && !table05After?.currentOrderId, 'Table 05 atomically released to AVAILABLE');

  // Admin checks reports
  const dailyReport = await req('/api/reports/daily-summary', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(dailyReport.status === 200 && dailyReport.data.data?.paidOrders > 0, 'Admin reports reflect verified sale');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
