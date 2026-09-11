import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  AppNotification,
  Dish,
  Employee,
  KitchenTicket,
  Order,
  OrderItem,
  PaymentDetails,
  PaymentMethod,
  RestaurantConfig,
  Role,
  Table,
  TableStatus,
} from '../types';
import {
  INITIAL_DISHES,
  INITIAL_EMPLOYEES,
  INITIAL_KITCHEN_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_SUMMARY,
  INITIAL_TABLES,
  RESTAURANT_INFO,
} from '../data/mockData';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface RestaurantContextType {
  // Authentication & Role
  currentUser: { name: string; role: Role; phone: string };
  isLoggedIn: boolean;
  login: (username: string, role: Role) => void;
  logout: () => void;
  switchRole: (role: Role, employeeName?: string) => void;

  // Data
  tables: Table[];
  orders: Order[];
  kitchenTickets: KitchenTicket[];
  dishes: Dish[];
  employees: Employee[];
  notifications: AppNotification[];
  summary: typeof INITIAL_SUMMARY;
  activeToast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  dismissToast: () => void;

  // Active Selected Context
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  receiptOrder: Order | null;
  setReceiptOrder: (order: Order | null) => void;

  // Workflows
  createDiningOrder: (tableNumber: string, items: { dish: Dish; quantity: number; notes?: string }[]) => Order;
  createTakeawayOrder: (
    customerName: string,
    customerPhone: string,
    pickupTime: string,
    notes: string,
    items: { dish: Dish; quantity: number; notes?: string }[]
  ) => Order;
  addItemsToExistingOrder: (orderId: string, additionalItems: { dish: Dish; quantity: number; notes?: string }[]) => void;
  requestBill: (orderId: string) => void;
  submitPayment: (
    orderId: string,
    method: PaymentMethod,
    amount: number,
    receivedAmount?: number,
    change?: number,
    refNumber?: string
  ) => void;
  verifyPayment: (orderId: string) => void;
  rejectPayment: (orderId: string, reason: string, notes?: string) => void;
  updateKitchenTicketStatus: (ticketId: string, status: 'new' | 'preparing' | 'ready' | 'served') => void;
  
  // Restaurant Configuration & Tax
  restaurantConfig: RestaurantConfig;
  updateGstPercent: (newPercent: number) => void;
  updateRestaurantConfig: (config: Partial<RestaurantConfig>) => void;
  
  // Admin Operations
  saveDish: (dish: Partial<Dish> & { name: string; price: number; category: string }) => void;
  addDish: (dish: Partial<Dish> & { name: string; price: number; category: string }) => void;
  updateDishPrice: (dishId: string, newPrice: number) => void;
  deleteDish: (dishId: string) => void;
  toggleDishAvailability: (dishId: string) => void;
  saveEmployee: (emp: Partial<Employee> & { name: string; role: Role; phone?: string }) => void;
  addEmployee: (emp: Partial<Employee> & { name: string; role: Role; phone?: string; shift?: string; isActive?: boolean }) => void;
  toggleEmployeeStatus: (empId: string) => void;
  printReceipt: (orderId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markNotificationRead: (notifId: string) => void;
  clearAllNotifications: () => void;
  resetMockData: () => void;
  
  // Helper Calculations
  getOrderById: (orderId: string) => Order | undefined;
  getTableByNumber: (tableNumber: string) => Table | undefined;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: Role; phone: string }>({
    name: 'Admin',
    role: 'admin',
    phone: '+91 98765 43214',
  });
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Restaurant Tax & Store Configuration
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig>({
    name: RESTAURANT_INFO.name,
    tagline: RESTAURANT_INFO.tagline,
    address: RESTAURANT_INFO.address,
    phone: RESTAURANT_INFO.phone,
    gstin: RESTAURANT_INFO.gstin,
    fssai: RESTAURANT_INFO.fssai,
    upiId: RESTAURANT_INFO.upiId,
    gstPercent: RESTAURANT_INFO.defaultGstPercent || 5,
    isGstEnabled: true,
    serviceChargePercent: 0,
  });

  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(INITIAL_KITCHEN_TICKETS);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setActiveToast({ id, message, type });
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id === id ? null : prev));
    }, 3800);
  };

  const dismissToast = () => setActiveToast(null);

  // Sync selectedTable and selectedOrder when lists update
  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find((t) => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const login = (username: string, role: Role) => {
    const emp = employees.find((e) => e.name.toLowerCase() === username.toLowerCase()) || {
      name: username || (role === 'admin' ? 'Admin' : role === 'dining' ? 'Arun' : role === 'kitchen' ? 'Suresh' : 'Manoj'),
      role,
      phone: '+91 98765 00000',
    };
    setCurrentUser({ name: emp.name, role, phone: emp.phone });
    setIsLoggedIn(true);
    showToast(`Logged in as ${emp.name} (${role.toUpperCase()})`, 'success');
  };

  const logout = () => {
    setIsLoggedIn(false);
    showToast('Logged out successfully', 'info');
  };

  const switchRole = (role: Role, empName?: string) => {
    let name = empName;
    if (!name) {
      if (role === 'admin') name = 'Admin';
      else if (role === 'dining') name = 'Arun';
      else if (role === 'kitchen') name = 'Suresh';
      else name = 'Manoj';
    }
    const emp = employees.find((e) => e.name === name) || {
      name,
      role,
      phone: '+91 98765 43210',
    };
    setCurrentUser({ name: emp.name, role, phone: emp.phone });
    showToast(`Switched role to ${role.toUpperCase()} (${emp.name})`, 'info');
  };

  const getCurrentTimeStr = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateOrderFinancials = (items: OrderItem[]) => {
    const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const discount = 0;
    const taxableAmount = subtotal - discount;
    const activeGstPercent = restaurantConfig.isGstEnabled ? restaurantConfig.gstPercent : 0;
    const cgst = Number(((taxableAmount * (activeGstPercent / 2)) / 100).toFixed(2));
    const sgst = Number(((taxableAmount * (activeGstPercent / 2)) / 100).toFixed(2));
    const totalGst = Number((cgst + sgst).toFixed(2));
    const rawTotal = taxableAmount + totalGst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));

    return { subtotal, discount, taxableAmount, cgst, sgst, totalGst, roundOff, grandTotal };
  };

  // 1. Create Dining Order
  const createDiningOrder = (
    tableNumber: string,
    itemsInput: { dish: Dish; quantity: number; notes?: string }[]
  ): Order => {
    const orderNum = 1000 + orders.length + 1;
    const orderId = `ORD-${orderNum}`;
    const timeStr = getCurrentTimeStr();

    const orderItems: OrderItem[] = itemsInput
      .filter((it) => it.quantity > 0)
      .map((it, idx) => ({
        id: `item-${orderId}-${idx + 1}`,
        dishId: it.dish.id,
        name: it.dish.name,
        price: it.dish.price,
        quantity: it.quantity,
        category: it.dish.category,
        isVeg: it.dish.isVeg,
        batchId: 1,
        notes: it.notes,
      }));

    const financials = calculateOrderFinancials(orderItems);

    const newOrder: Order = {
      id: orderId,
      tableNumber,
      orderType: 'dining',
      employeeName: currentUser.name,
      employeeRole: currentUser.role,
      createdAt: timeStr,
      status: 'sent_to_kitchen',
      batchesCount: 1,
      items: orderItems,
      ...financials,
      timeline: [
        { id: 't-1', title: 'Order Created', time: timeStr, completed: true },
        { id: 't-2', title: 'Sent to Kitchen', time: timeStr, completed: true, current: true, subtitle: 'Kitchen preparing order' },
        { id: 't-3', title: 'Preparing', time: 'Pending', completed: false },
        { id: 't-4', title: 'Ready', time: 'Pending', completed: false },
        { id: 't-5', title: 'Served', time: 'Pending', completed: false },
        { id: 't-6', title: 'Bill Requested', time: 'Pending', completed: false },
        { id: 't-7', title: 'Payment Submitted', time: 'Pending', completed: false },
        { id: 't-8', title: 'Payment Verified', time: 'Pending', completed: false },
        { id: 't-9', title: 'Closed', time: 'Pending', completed: false },
      ],
    };

    // Update Table
    setTables((prev) =>
      prev.map((t) =>
        t.number === tableNumber
          ? {
              ...t,
              status: 'occupied' as TableStatus,
              currentOrderId: orderId,
              currentTotal: financials.grandTotal,
              activeEmployee: currentUser.name,
              updatedAt: timeStr,
            }
          : t
      )
    );

    // Create Kitchen Ticket
    const kotId = `KOT-${100 + kitchenTickets.length + 1}`;
    const newKot: KitchenTicket = {
      id: kotId,
      orderId,
      tableNumber,
      orderType: 'dining',
      items: orderItems.map((it) => ({
        dishId: it.dishId,
        name: it.name,
        quantity: it.quantity,
        notes: it.notes,
        isVeg: it.isVeg,
      })),
      status: 'new',
      isAddition: false,
      batchNumber: 1,
      createdAt: timeStr,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setKitchenTickets((prev) => [newKot, ...prev]);

    // Add notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Kitchen Order',
      message: `Table ${tableNumber} created order ${orderId} with ${orderItems.length} items.`,
      type: 'kitchen',
      time: 'Just now',
      read: false,
      orderId,
      tableNumber,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Order ${orderId} sent to kitchen for Table ${tableNumber}!`, 'success');
    return newOrder;
  };

  // 2. Create Takeaway Order
  const createTakeawayOrder = (
    customerName: string,
    customerPhone: string,
    pickupTime: string,
    notes: string,
    itemsInput: { dish: Dish; quantity: number; notes?: string }[]
  ): Order => {
    const orderNum = 1000 + orders.length + 1;
    const orderId = `TAKE-${orderNum}`;
    const timeStr = getCurrentTimeStr();

    const orderItems: OrderItem[] = itemsInput
      .filter((it) => it.quantity > 0)
      .map((it, idx) => ({
        id: `titem-${orderId}-${idx + 1}`,
        dishId: it.dish.id,
        name: it.dish.name,
        price: it.dish.price,
        quantity: it.quantity,
        category: it.dish.category,
        isVeg: it.dish.isVeg,
        batchId: 1,
        notes: it.notes,
      }));

    const financials = calculateOrderFinancials(orderItems);

    const newOrder: Order = {
      id: orderId,
      orderType: 'takeaway',
      customerName,
      customerPhone,
      pickupTime: pickupTime || 'In 20 mins',
      notes,
      employeeName: currentUser.name,
      employeeRole: currentUser.role,
      createdAt: timeStr,
      status: 'sent_to_kitchen',
      batchesCount: 1,
      items: orderItems,
      ...financials,
      timeline: [
        { id: 't-1', title: 'Order Created', time: timeStr, completed: true },
        { id: 't-2', title: 'Sent to Kitchen', time: timeStr, completed: true, current: true, subtitle: 'Kitchen preparing takeaway' },
        { id: 't-3', title: 'Preparing', time: 'Pending', completed: false },
        { id: 't-4', title: 'Ready', time: 'Pending', completed: false },
      ],
    };

    const kotId = `KOT-${100 + kitchenTickets.length + 1}`;
    const newKot: KitchenTicket = {
      id: kotId,
      orderId,
      orderType: 'takeaway',
      customerName,
      items: orderItems.map((it) => ({
        dishId: it.dishId,
        name: it.name,
        quantity: it.quantity,
        notes: it.notes,
        isVeg: it.isVeg,
      })),
      status: 'new',
      isAddition: false,
      batchNumber: 1,
      createdAt: timeStr,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setKitchenTickets((prev) => [newKot, ...prev]);

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Takeaway Order',
      message: `Takeaway ${orderId} for ${customerName} sent to kitchen.`,
      type: 'kitchen',
      time: 'Just now',
      read: false,
      orderId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Takeaway order ${orderId} created!`, 'success');
    return newOrder;
  };

  // 3. CRITICAL: Add Additional Items to Existing Order (Keeps same Order ID!)
  const addItemsToExistingOrder = (
    orderId: string,
    additionalItemsInput: { dish: Dish; quantity: number; notes?: string }[]
  ) => {
    const existingOrder = orders.find((o) => o.id === orderId);
    if (!existingOrder) return;

    const timeStr = getCurrentTimeStr();
    const newBatchNumber = (existingOrder.batchesCount || 1) + 1;

    // Filter valid addition items
    const additionsToAdd = additionalItemsInput.filter((it) => it.quantity > 0);
    if (additionsToAdd.length === 0) return;

    const newOrderItems: OrderItem[] = additionsToAdd.map((it, idx) => ({
      id: `item-${orderId}-b${newBatchNumber}-${idx + 1}`,
      dishId: it.dish.id,
      name: it.dish.name,
      price: it.dish.price,
      quantity: it.quantity,
      category: it.dish.category,
      isVeg: it.dish.isVeg,
      isAddition: true,
      batchId: newBatchNumber,
      notes: it.notes,
    }));

    // Merge with existing items: Combine matching dish items for clean totals or keep individual batch items
    // Per spec: The main order total counts all items under ORD-1001
    const combinedItems: OrderItem[] = [...existingOrder.items];

    additionsToAdd.forEach((addItem) => {
      const matchIndex = combinedItems.findIndex((it) => it.dishId === addItem.dish.id);
      if (matchIndex >= 0) {
        combinedItems[matchIndex] = {
          ...combinedItems[matchIndex],
          quantity: combinedItems[matchIndex].quantity + addItem.quantity,
        };
      } else {
        combinedItems.push({
          id: `item-${orderId}-b${newBatchNumber}-${addItem.dish.id}`,
          dishId: addItem.dish.id,
          name: addItem.dish.name,
          price: addItem.dish.price,
          quantity: addItem.quantity,
          category: addItem.dish.category,
          isVeg: addItem.dish.isVeg,
          isAddition: true,
          batchId: newBatchNumber,
          notes: addItem.notes,
        });
      }
    });

    const financials = calculateOrderFinancials(combinedItems);

    // CRITICAL: Kitchen ticket receives ONLY the newly added items!
    const kotId = `KOT-${100 + kitchenTickets.length + 1}`;
    const additionKot: KitchenTicket = {
      id: kotId,
      orderId: existingOrder.id,
      tableNumber: existingOrder.tableNumber,
      orderType: existingOrder.orderType,
      customerName: existingOrder.customerName,
      items: additionsToAdd.map((it) => ({
        dishId: it.dish.id,
        name: it.dish.name,
        quantity: it.quantity,
        notes: it.notes,
        isVeg: it.dish.isVeg,
      })),
      status: 'new',
      isAddition: true, // Marked distinctly as addition!
      batchNumber: newBatchNumber,
      createdAt: timeStr,
    };

    // Update order
    const updatedOrder: Order = {
      ...existingOrder,
      items: combinedItems,
      batchesCount: newBatchNumber,
      ...financials,
      status: existingOrder.status === 'ready' || existingOrder.status === 'served' ? 'preparing' : existingOrder.status,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    setKitchenTickets((prev) => [additionKot, ...prev]);

    // Update table current total
    if (existingOrder.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === existingOrder.tableNumber
            ? { ...t, currentTotal: financials.grandTotal, updatedAt: timeStr }
            : t
        )
      );
    }

    // Add notification
    const addedSummary = additionsToAdd.map((it) => `${it.quantity}x ${it.dish.name}`).join(', ');
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Additional Items Added',
      message: `Table ${existingOrder.tableNumber || 'Takeaway'} added ${addedSummary} to ${existingOrder.id}.`,
      type: 'addition',
      time: 'Just now',
      read: false,
      orderId: existingOrder.id,
      tableNumber: existingOrder.tableNumber,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Added items sent to kitchen under ${existingOrder.id}!`, 'success');
  };

  // 4. Request Bill
  const requestBill = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const timeStr = getCurrentTimeStr();
    const billNumber = order.billNumber || `BILL-${order.id.replace(/[^0-9]/g, '')}`;

    const updatedTimeline = order.timeline.map((t) => {
      if (t.title === 'Bill Requested') return { ...t, time: timeStr, completed: true, current: true, subtitle: 'Waiting for payment' };
      if (t.title === 'Served' && !t.completed) return { ...t, time: timeStr, completed: true };
      return t;
    });

    const updatedOrder: Order = {
      ...order,
      billNumber,
      status: 'bill_requested',
      timeline: updatedTimeline,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    if (order.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === order.tableNumber
            ? { ...t, status: 'bill_requested' as TableStatus, updatedAt: timeStr }
            : t
        )
      );
    }

    showToast(`Bill ${billNumber} generated for ${order.id}. Table remains open!`, 'info');
  };

  // 5. Submit Payment (Employee action)
  const submitPayment = (
    orderId: string,
    method: PaymentMethod,
    amount: number,
    receivedAmount?: number,
    change?: number,
    refNumber?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const timeStr = getCurrentTimeStr();
    const paymentDetails: PaymentDetails = {
      method,
      amount,
      receivedAmount: receivedAmount || amount,
      change: change || 0,
      refNumber: refNumber || (method === 'UPI' ? `UPI/${Date.now().toString().slice(-8)}` : method === 'CARD' ? `TXN/${Date.now().toString().slice(-6)}` : undefined),
      submittedAt: timeStr,
      employeeName: currentUser.name,
      status: 'pending',
    };

    const updatedTimeline = order.timeline.map((t) => {
      if (t.title === 'Payment Submitted') {
        return {
          ...t,
          time: timeStr,
          completed: true,
          current: true,
          subtitle: `Waiting for Admin Verification (${method})`,
        };
      }
      if (t.title === 'Bill Requested' && !t.completed) return { ...t, time: timeStr, completed: true };
      return t;
    });

    const updatedOrder: Order = {
      ...order,
      status: 'payment_submitted',
      payment: paymentDetails,
      timeline: updatedTimeline,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // CRITICAL: Table does NOT become available! Stays 'payment_pending'
    if (order.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === order.tableNumber
            ? { ...t, status: 'payment_pending' as TableStatus, updatedAt: timeStr }
            : t
        )
      );
    }

    // Add Admin Notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Payment Submitted',
      message: `${currentUser.name} submitted ₹${amount} (${method}) for ${order.tableNumber ? `Table ${order.tableNumber}` : order.id}. Awaiting verification.`,
      type: 'payment_sub',
      time: 'Just now',
      read: false,
      orderId: order.id,
      tableNumber: order.tableNumber,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Payment of ₹${amount} submitted! Waiting for Admin verification.`, 'success');
  };

  // 6. Admin Verify & Close (The ONLY action that closes table & updates confirmed sales!)
  const verifyPayment = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.payment) return;

    const timeStr = getCurrentTimeStr();

    const updatedPayment: PaymentDetails = {
      ...order.payment,
      status: 'verified',
      verifiedAt: timeStr,
    };

    const updatedTimeline = order.timeline.map((t) => {
      if (t.title === 'Payment Submitted') return { ...t, completed: true, current: false };
      if (t.title === 'Payment Verified') return { ...t, time: timeStr, completed: true };
      if (t.title === 'Closed') return { ...t, time: timeStr, completed: true, current: true, subtitle: 'Order closed & table released' };
      return t;
    });

    const updatedOrder: Order = {
      ...order,
      status: 'closed',
      payment: updatedPayment,
      timeline: updatedTimeline,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // CRITICAL: Table now becomes AVAILABLE!
    if (order.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === order.tableNumber
            ? {
                ...t,
                status: 'available' as TableStatus,
                currentOrderId: undefined,
                currentTotal: undefined,
                activeEmployee: undefined,
                updatedAt: timeStr,
              }
            : t
        )
      );
    }

    // Update Summary Sales Metrics
    const verifiedAmount = order.grandTotal;
    setSummary((prev) => {
      const isDining = order.orderType === 'dining';
      return {
        ...prev,
        todaySales: prev.todaySales + verifiedAmount,
        diningSales: isDining ? prev.diningSales + verifiedAmount : prev.diningSales,
        takeawaySales: !isDining ? prev.takeawaySales + verifiedAmount : prev.takeawaySales,
        cashSales: order.payment?.method === 'CASH' ? prev.cashSales + verifiedAmount : prev.cashSales,
        upiSales: order.payment?.method === 'UPI' ? prev.upiSales + verifiedAmount : prev.upiSales,
        cardSales: order.payment?.method === 'CARD' ? prev.cardSales + verifiedAmount : prev.cardSales,
        pendingCollection: Math.max(0, prev.pendingCollection - verifiedAmount),
        taxableSales: prev.taxableSales + order.taxableAmount,
        cgst: prev.cgst + order.cgst,
        sgst: prev.sgst + order.sgst,
        totalGst: prev.totalGst + order.totalGst,
      };
    });

    // Update Employee Verified Collection
    if (order.payment.employeeName) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.name === order.payment?.employeeName
            ? { ...emp, verifiedCollection: emp.verifiedCollection + verifiedAmount }
            : emp
        )
      );
    }

    // Add Notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Payment Verified & Order Closed',
      message: `Admin verified ₹${verifiedAmount} (${order.payment.method}) for ${order.tableNumber ? `Table ${order.tableNumber}` : order.id}. Table is now available.`,
      type: 'payment_ver',
      time: 'Just now',
      read: false,
      orderId: order.id,
      tableNumber: order.tableNumber,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Celebrate verification!
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#C94B4B', '#10B981', '#3B82F6', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    showToast(`Payment Verified! Order ${order.id} closed and Table released.`, 'success');
  };

  // 7. Admin Reject Payment
  const rejectPayment = (orderId: string, reason: string, notes?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.payment) return;

    const timeStr = getCurrentTimeStr();

    const updatedPayment: PaymentDetails = {
      ...order.payment,
      status: 'rejected',
      rejectionReason: reason,
      rejectionNotes: notes,
    };

    const updatedTimeline = order.timeline.map((t) => {
      if (t.title === 'Payment Submitted') {
        return {
          ...t,
          completed: false,
          current: true,
          subtitle: `Rejected by Admin: ${reason}`,
        };
      }
      return t;
    });

    const updatedOrder: Order = {
      ...order,
      status: 'payment_rejected',
      payment: updatedPayment,
      timeline: updatedTimeline,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // Table remains payment_pending / bill_requested
    if (order.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === order.tableNumber
            ? { ...t, status: 'payment_pending' as TableStatus, updatedAt: timeStr }
            : t
        )
      );
    }

    // Add alert notification for staff
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Payment Rejected by Admin',
      message: `Payment for ${order.tableNumber ? `Table ${order.tableNumber}` : order.id} was rejected (${reason}). Please re-collect.`,
      type: 'payment_rej',
      time: 'Just now',
      read: false,
      orderId: order.id,
      tableNumber: order.tableNumber,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Payment rejected: ${reason}. Order marked for correction.`, 'error');
  };

  // 8. Kitchen Ticket Status transitions
  const updateKitchenTicketStatus = (ticketId: string, newStatus: 'new' | 'preparing' | 'ready' | 'served') => {
    const ticket = kitchenTickets.find((k) => k.id === ticketId);
    if (!ticket) return;

    const timeStr = getCurrentTimeStr();

    setKitchenTickets((prev) =>
      prev.map((k) =>
        k.id === ticketId
          ? {
              ...k,
              status: newStatus,
              acceptedAt: newStatus === 'preparing' ? timeStr : k.acceptedAt,
              readyAt: newStatus === 'ready' ? timeStr : k.readyAt,
              servedAt: newStatus === 'served' ? timeStr : k.servedAt,
            }
          : k
      )
    );

    // Update parent order timeline if applicable
    const relatedOrder = orders.find((o) => o.id === ticket.orderId);
    if (relatedOrder) {
      const updatedTimeline = relatedOrder.timeline.map((t) => {
        if (newStatus === 'preparing' && t.title === 'Preparing') {
          return { ...t, time: timeStr, completed: true, current: true, subtitle: 'Kitchen is cooking' };
        }
        if (newStatus === 'ready' && t.title === 'Ready') {
          return { ...t, time: timeStr, completed: true, current: true, subtitle: 'Ready for pickup / serving' };
        }
        if (newStatus === 'served' && t.title === 'Served') {
          return { ...t, time: timeStr, completed: true, current: true, subtitle: 'Items delivered to table' };
        }
        return t;
      });

      const nextOrderStatus =
        newStatus === 'preparing'
          ? 'preparing'
          : newStatus === 'ready'
          ? 'ready'
          : newStatus === 'served'
          ? 'served'
          : relatedOrder.status;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === ticket.orderId
            ? { ...o, status: nextOrderStatus, timeline: updatedTimeline }
            : o
        )
      );
    }

    const actionLabel =
      newStatus === 'preparing' ? 'Accepted & Preparing' : newStatus === 'ready' ? 'Marked Ready' : 'Marked Served';
    showToast(`Ticket ${ticketId} ${actionLabel}!`, 'success');
  };

  // 9. Menu & Dish operations (Admin Only for Add/Price/Edit/Delete)
  const saveDish = (dishInput: Partial<Dish> & { name: string; price: number; category: string }) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can add or edit menu dishes.', 'error');
      return;
    }

    if (dishInput.id) {
      setDishes((prev) =>
        prev.map((d) => (d.id === dishInput.id ? ({ ...d, ...dishInput } as Dish) : d))
      );
      showToast(`Dish "${dishInput.name}" updated!`, 'success');
    } else {
      const newDish: Dish = {
        id: `dish-${Date.now()}`,
        name: dishInput.name,
        category: dishInput.category,
        price: Number(dishInput.price),
        gstPercentage: dishInput.gstPercentage || restaurantConfig.gstPercent || 5,
        isAvailable: dishInput.isAvailable ?? true,
        isVeg: dishInput.isVeg ?? true,
        description: dishInput.description || '',
      };
      setDishes((prev) => [newDish, ...prev]);
      showToast(`New dish "${newDish.name}" added to menu!`, 'success');
    }
  };

  const addDish = (dishInput: Partial<Dish> & { name: string; price: number; category: string }) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin has permission to add dishes.', 'error');
      return;
    }
    saveDish(dishInput);
  };

  const updateDishPrice = (dishId: string, newPrice: number) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can modify dish prices.', 'error');
      return;
    }
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          return { ...d, price: newPrice };
        }
        return d;
      })
    );
    showToast(`Price updated to ₹${newPrice}`, 'success');
  };

  const deleteDish = (dishId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can delete dishes from the menu.', 'error');
      return;
    }
    const target = dishes.find((d) => d.id === dishId);
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    showToast(`Dish "${target?.name || dishId}" removed from menu`, 'info');
  };

  // Availability toggle (Accessible by both Admin and Kitchen Staff for ingredient 86ing)
  const toggleDishAvailability = (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const next = !d.isAvailable;
          showToast(`"${d.name}" is now ${next ? 'In Stock (Available)' : '86 Out of Stock'}`, 'info');
          return { ...d, isAvailable: next };
        }
        return d;
      })
    );
  };

  // 10. GST and Tax Configuration (Admin Only)
  const updateGstPercent = (newPercent: number) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can configure GST percentage.', 'error');
      return;
    }
    const cleanPercent = Math.max(0, Number(newPercent));
    setRestaurantConfig((prev) => ({
      ...prev,
      gstPercent: cleanPercent,
      isGstEnabled: cleanPercent > 0,
    }));
    showToast(
      `GST rate updated to ${cleanPercent}% (${(cleanPercent / 2).toFixed(1)}% CGST + ${(cleanPercent / 2).toFixed(1)}% SGST)`,
      'success'
    );
  };

  const updateRestaurantConfig = (config: Partial<RestaurantConfig>) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can modify restaurant and tax settings.', 'error');
      return;
    }
    setRestaurantConfig((prev) => ({ ...prev, ...config }));
    showToast('Restaurant configuration updated', 'success');
  };

  // 11. Employee operations (Admin Only)
  const saveEmployee = (empInput: Partial<Employee> & { name: string; role: Role; phone?: string; shift?: string; isActive?: boolean }) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can manage staff.', 'error');
      return;
    }

    if (empInput.id) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === empInput.id ? ({ ...e, ...empInput } as Employee) : e))
      );
      showToast(`Employee "${empInput.name}" updated!`, 'success');
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: empInput.name,
        role: empInput.role,
        phone: empInput.phone || '',
        status: empInput.isActive !== undefined ? (empInput.isActive ? 'active' : 'inactive') : (empInput.status || 'active'),
        shift: empInput.shift || 'Full Shift',
        expectedCollection: 0,
        verifiedCollection: 0,
      };
      setEmployees((prev) => [...prev, newEmp]);
      showToast(`Added employee "${newEmp.name}" (${newEmp.role})`, 'success');
    }
  };

  const addEmployee = (empInput: Partial<Employee> & { name: string; role: Role; phone?: string; shift?: string; isActive?: boolean }) => {
    saveEmployee(empInput);
  };

  const toggleEmployeeStatus = (empId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Access Denied: Only Admin can toggle employee status.', 'error');
      return;
    }
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === empId) {
          const next = e.status === 'active' ? 'inactive' : 'active';
          showToast(`Employee "${e.name}" is now ${next}`, 'info');
          return { ...e, status: next };
        }
        return e;
      })
    );
  };

  // 12. Thermal Receipt Print simulation
  const printReceipt = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setReceiptOrder(order);
    showToast(`Receipt sent to 80mm thermal printer for ${order.id}.`, 'info');
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  };

  const markNotificationRead = (notifId: string) => {
    markNotificationAsRead(notifId);
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const resetMockData = () => {
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setKitchenTickets(INITIAL_KITCHEN_TICKETS);
    setDishes(INITIAL_DISHES);
    setEmployees(INITIAL_EMPLOYEES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSummary(INITIAL_SUMMARY);
    setRestaurantConfig({
      name: RESTAURANT_INFO.name,
      tagline: RESTAURANT_INFO.tagline,
      address: RESTAURANT_INFO.address,
      phone: RESTAURANT_INFO.phone,
      gstin: RESTAURANT_INFO.gstin,
      fssai: RESTAURANT_INFO.fssai,
      upiId: RESTAURANT_INFO.upiId,
      gstPercent: RESTAURANT_INFO.defaultGstPercent || 5,
      isGstEnabled: true,
      serviceChargePercent: 0,
    });
    setSelectedTable(null);
    setSelectedOrder(null);
    setReceiptOrder(null);
    showToast('Demo data reset to initial state', 'info');
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);
  const getTableByNumber = (tableNumber: string) => tables.find((t) => t.number === tableNumber);

  return (
    <RestaurantContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        login,
        logout,
        switchRole,
        tables,
        orders,
        kitchenTickets,
        dishes,
        employees,
        notifications,
        summary,
        activeToast,
        showToast,
        dismissToast,
        selectedTable,
        setSelectedTable,
        selectedOrder,
        setSelectedOrder,
        receiptOrder,
        setReceiptOrder,
        createDiningOrder,
        createTakeawayOrder,
        addItemsToExistingOrder,
        requestBill,
        submitPayment,
        verifyPayment,
        rejectPayment,
        updateKitchenTicketStatus,
        restaurantConfig,
        updateGstPercent,
        updateRestaurantConfig,
        saveDish,
        addDish,
        updateDishPrice,
        deleteDish,
        toggleDishAvailability,
        saveEmployee,
        addEmployee,
        toggleEmployeeStatus,
        printReceipt,
        markNotificationAsRead,
        markNotificationRead,
        clearAllNotifications,
        resetMockData,
        getOrderById,
        getTableByNumber,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
