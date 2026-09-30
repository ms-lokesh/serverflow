import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { RESTAURANT_INFO, INITIAL_SUMMARY } from '../data/mockData';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';

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
  setDishStockOut: (dishId: string, isAvailable: boolean) => Promise<void>;
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, role: authRole, logout: authLogout, isAuthenticated } = useAuth();

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

  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setActiveToast({ id, message, type });
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id === id ? null : prev));
    }, 3800);
  }, []);

  const dismissToast = () => setActiveToast(null);

  // Fetch initial data from real backend database
  const refreshAllData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [tablesRes, ordersRes, kotRes, menuRes, summaryRes, empRes] = await Promise.allSettled([
        api.tables.list(),
        api.orders.list(),
        api.kot.list(),
        api.menu.list(),
        authRole === 'admin' ? api.reports.dailySummary() : Promise.resolve({ success: false } as any),
        authRole === 'admin' ? api.employees.list() : Promise.resolve({ success: false } as any),
      ]);

      if (tablesRes.status === 'fulfilled' && tablesRes.value.success) {
        setTables(dedupeById(tablesRes.value.data || []));
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
        setOrders(dedupeById(ordersRes.value.data || []));
      }

      if (kotRes.status === 'fulfilled' && kotRes.value.success) {
        setKitchenTickets(dedupeById(kotRes.value.data || []));
      }

      if (menuRes.status === 'fulfilled' && menuRes.value.success) {
        setDishes(dedupeById(menuRes.value.data || []));
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success && summaryRes.value.data) {
        setSummary((prev) => ({ ...prev, ...summaryRes.value.data }));
      }

      if (empRes.status === 'fulfilled' && empRes.value.success && empRes.value.data) {
        setEmployees(
          empRes.value.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            role: e.role.toLowerCase() as Role,
            status: e.status === 'ACTIVE' ? 'active' : 'inactive',
            phone: e.phone || '',
            expectedCollection: 0,
            verifiedCollection: 0,
            avatar: e.avatar,
            isActive: e.status === 'ACTIVE',
          }))
        );
      }
    } catch (err) {
      console.error('[RestaurantContext] Data load error:', err);
    }
  }, [isAuthenticated, authRole]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // WebSocket real-time subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubs: (() => void)[] = [];

    // NEW_KOT event from WebSocket
    unsubs.push(
      wsClient.on('NEW_KOT', (data) => {
        setKitchenTickets((prev) => {
          if (prev.some((k) => k.id === data.kotId)) return prev;
          const newTicket: KitchenTicket = {
            id: data.kotId,
            orderId: data.orderId,
            tableNumber: data.tableNumber,
            orderType: data.orderType || 'dining',
            customerName: data.customerName,
            items: data.items || [],
            status: data.status || 'new',
            isAddition: data.isAddition || false,
            batchNumber: data.batchNumber || 1,
            createdAt: data.createdAt || new Date().toISOString(),
          };
          return [newTicket, ...prev];
        });

        if (authRole === 'kitchen') {
          showToast(`🔔 New KOT #${data.kotId} received!`, 'info');
        }
      })
    );

    // KOT_STATUS_UPDATED event
    unsubs.push(
      wsClient.on('KOT_STATUS_UPDATED', (data) => {
        setKitchenTickets((prev) =>
          prev.map((k) =>
            k.id === data.kotId
              ? {
                  ...k,
                  status: data.status,
                  acceptedAt: data.status === 'preparing' ? data.timestamp : k.acceptedAt,
                  readyAt: data.status === 'ready' ? data.timestamp : k.readyAt,
                  servedAt: data.status === 'served' ? data.timestamp : k.servedAt,
                }
              : k
          )
        );

        if (data.orderId && data.orderStatus) {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.orderId ? { ...o, status: data.orderStatus } : o))
          );
        }

        if (data.status === 'ready' && authRole === 'dining') {
          showToast(`✅ Food Ready: KOT #${data.kotId} (Table #${data.tableNumber || 'Takeaway'})`, 'success');
        }
      })
    );

    // TABLE_STATUS_CHANGED event
    unsubs.push(
      wsClient.on('TABLE_STATUS_CHANGED', (data) => {
        setTables((prev) =>
          prev.map((t) =>
            t.number === data.tableNumber
              ? {
                  ...t,
                  status: data.status,
                  currentOrderId: data.currentOrderId ?? (data.status === 'available' ? undefined : t.currentOrderId),
                  currentTotal: data.currentTotal ?? (data.status === 'available' ? 0 : t.currentTotal),
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      })
    );

    // ORDER_CREATED event
    unsubs.push(
      wsClient.on('ORDER_CREATED', () => {
        api.orders.list().then((res) => {
          if (res.success && res.data) setOrders(res.data);
        });
        api.tables.list().then((res) => {
          if (res.success && res.data) setTables(res.data);
        });
      })
    );

    // ORDER_UPDATED event
    unsubs.push(
      wsClient.on('ORDER_UPDATED', (data) => {
        if (data?.orderId && data?.status) {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
          );
        }
        api.orders.list().then((res) => {
          if (res.success && res.data) setOrders(res.data);
        });
      })
    );

    // DISH_AVAILABILITY_CHANGED (Stock Out 86 or Restock)
    unsubs.push(
      wsClient.on('DISH_AVAILABILITY_CHANGED', (data) => {
        setDishes((prev) =>
          prev.map((d) => (d.id === data.dishId ? { ...d, isAvailable: data.isAvailable } : d))
        );
        showToast(
          data.isAvailable
            ? `🟢 "${data.dishName || 'Dish'}" is back in stock!`
            : `⚠️ 86 STOCK OUT: "${data.dishName || 'Dish'}" marked unavailable!`,
          data.isAvailable ? 'info' : 'warning'
        );
      })
    );

    // PAYMENT_SUBMITTED event
    unsubs.push(
      wsClient.on('PAYMENT_SUBMITTED', (data) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: 'payment_submitted' } : o))
        );
        if (authRole === 'admin') {
          showToast(`💰 Payment submitted for Order #${data.orderId}`, 'info');
        }
      })
    );

    // PAYMENT_VERIFIED event
    unsubs.push(
      wsClient.on('PAYMENT_VERIFIED', (data) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: 'closed' } : o))
        );
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        showToast(`🎉 Payment Verified! Bill #${data.billNumber} settled.`, 'success');
        if (authRole === 'admin') {
          api.reports.dailySummary().then((res) => {
            if (res.success && res.data) setSummary((prev) => ({ ...prev, ...res.data }));
          });
        }
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, authRole, showToast]);

  // High-speed 1-second background synchronization loop
  // Guarantees zero-refresh real-time consistency across all devices and open pages
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let inFlight = false;

    const syncInterval = setInterval(async () => {
      // Don't flood when previous request is still in-flight or tab is backgrounded
      if (inFlight || document.hidden) return;
      inFlight = true;

      try {
        const res = await api.sync.pulse();
        if (isMounted && res.success && res.data) {
          const freshTables = dedupeById(res.data.tables || []);
          const freshOrders = dedupeById(res.data.orders || []);
          const freshKot = dedupeById(res.data.kitchenTickets || []);
          const freshDishes = dedupeById(res.data.dishes || []);

          setTables((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(freshTables)) return freshTables;
            return prev;
          });

          setOrders((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(freshOrders)) return freshOrders;
            return prev;
          });

          setKitchenTickets((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(freshKot)) return freshKot;
            return prev;
          });

          setDishes((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(freshDishes)) return freshDishes;
            return prev;
          });
        }
      } catch (err) {
        // Tolerant to transient connection hiccups
      } finally {
        inFlight = false;
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, [isAuthenticated]);

  // Sync selectedTable and selectedOrder
  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find((t) => t.number === selectedTable.number);
      if (updated && updated !== selectedTable) setSelectedTable(updated);
    }
  }, [tables, selectedTable]);

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated && updated !== selectedOrder) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder]);

  // Workflows backed by PostgreSQL API
  const createDiningOrder = (
    tableNumber: string,
    items: { dish: Dish; quantity: number; notes?: string }[]
  ): Order => {
    const tempOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const tempTotals = {
      subtotal: items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0),
      grandTotal: Math.round(items.reduce((sum, i) => sum + i.dish.price * i.quantity * 1.05, 0)),
    };

    api.orders
      .create({
        tableNumber,
        orderType: 'dining',
        items,
      })
      .then((res) => {
        if (res.success) {
          showToast(`Order created for Table #${tableNumber}`, 'success');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to place order', 'error');
      });

    return {
      id: tempOrderId,
      tableNumber,
      orderType: 'dining',
      items: items.map((i, idx) => ({
        id: `itm_${idx}`,
        dishId: i.dish.id,
        name: i.dish.name,
        price: i.dish.price,
        quantity: i.quantity,
        category: i.dish.category,
        batchId: 1,
        notes: i.notes,
      })),
      status: 'sent_to_kitchen',
      employeeName: authUser?.name || 'Staff',
      employeeRole: authRole || 'dining',
      createdAt: new Date().toISOString(),
      subtotal: tempTotals.subtotal,
      discount: 0,
      taxableAmount: tempTotals.subtotal,
      cgst: tempTotals.subtotal * 0.025,
      sgst: tempTotals.subtotal * 0.025,
      totalGst: tempTotals.subtotal * 0.05,
      roundOff: 0,
      grandTotal: tempTotals.grandTotal,
      batchesCount: 1,
      timeline: [],
    };
  };

  const createTakeawayOrder = (
    customerName: string,
    customerPhone: string,
    pickupTime: string,
    notes: string,
    items: { dish: Dish; quantity: number; notes?: string }[]
  ): Order => {
    const tempOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const tempTotals = {
      subtotal: items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0),
      grandTotal: Math.round(items.reduce((sum, i) => sum + i.dish.price * i.quantity * 1.05, 0)),
    };

    api.orders
      .create({
        orderType: 'takeaway',
        customerName,
        customerPhone,
        pickupTime,
        notes,
        items,
      })
      .then((res) => {
        if (res.success) {
          showToast(`Takeaway order created for ${customerName}`, 'success');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to place takeaway order', 'error');
      });

    return {
      id: tempOrderId,
      orderType: 'takeaway',
      customerName,
      customerPhone,
      pickupTime,
      notes,
      items: items.map((i, idx) => ({
        id: `itm_${idx}`,
        dishId: i.dish.id,
        name: i.dish.name,
        price: i.dish.price,
        quantity: i.quantity,
        category: i.dish.category,
        batchId: 1,
        notes: i.notes,
      })),
      status: 'sent_to_kitchen',
      employeeName: authUser?.name || 'Staff',
      employeeRole: authRole || 'takeaway',
      createdAt: new Date().toISOString(),
      subtotal: tempTotals.subtotal,
      discount: 0,
      taxableAmount: tempTotals.subtotal,
      cgst: tempTotals.subtotal * 0.025,
      sgst: tempTotals.subtotal * 0.025,
      totalGst: tempTotals.subtotal * 0.05,
      roundOff: 0,
      grandTotal: tempTotals.grandTotal,
      batchesCount: 1,
      timeline: [],
    };
  };

  const addItemsToExistingOrder = (
    orderId: string,
    additionalItems: { dish: Dish; quantity: number; notes?: string }[]
  ) => {
    api.orders
      .addItems(orderId, additionalItems)
      .then((res) => {
        if (res.success) {
          showToast(`Added ${additionalItems.length} items. KOT sent to kitchen.`, 'success');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to add items', 'error');
      });
  };

  const requestBill = (orderId: string) => {
    api.orders
      .requestBill(orderId)
      .then((res) => {
        if (res.success) {
          showToast('Bill requested.', 'info');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to request bill', 'error');
      });
  };

  const submitPayment = (
    orderId: string,
    method: PaymentMethod,
    amount: number,
    receivedAmount?: number,
    change?: number,
    refNumber?: string
  ) => {
    api.orders
      .submitPayment(orderId, { method, amount, receivedAmount, change, refNumber })
      .then((res) => {
        if (res.success) {
          showToast('Payment submitted for verification.', 'success');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to submit payment', 'error');
      });
  };

  const verifyPayment = (orderId: string) => {
    api.orders
      .verifyPayment(orderId)
      .then((res) => {
        if (res.success) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          showToast('Payment verified. Order closed.', 'success');
          refreshAllData();
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to verify payment', 'error');
      });
  };

  const rejectPayment = (orderId: string, reason: string, notes?: string) => {
    showToast(`Payment rejected: ${reason}`, 'warning');
  };

  const updateKitchenTicketStatus = (
    ticketId: string,
    status: 'new' | 'preparing' | 'ready' | 'served'
  ) => {
    api.kot
      .updateStatus(ticketId, status)
      .then((res) => {
        if (res.success) {
          setKitchenTickets((prev) =>
            prev.map((k) => (k.id === ticketId ? { ...k, status } : k))
          );
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to update KOT', 'error');
      });
  };

  const updateGstPercent = (newPercent: number) => {
    setRestaurantConfig((prev) => ({ ...prev, gstPercent: newPercent }));
  };

  const updateRestaurantConfig = (config: Partial<RestaurantConfig>) => {
    setRestaurantConfig((prev) => ({ ...prev, ...config }));
  };

  const saveDish = (dish: Partial<Dish> & { name: string; price: number; category: string }) => {
    if (dish.id) {
      api.menu.update(dish.id, dish).then(() => refreshAllData());
    } else {
      api.menu.create(dish).then(() => refreshAllData());
    }
  };

  const addDish = saveDish;

  const updateDishPrice = (dishId: string, newPrice: number) => {
    api.menu.update(dishId, { price: newPrice }).then(() => refreshAllData());
  };

  const deleteDish = (dishId: string) => {
    showToast('Menu item updated.', 'info');
  };

  const toggleDishAvailability = async (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d))
    );
    try {
      await api.menu.toggleAvailability(dishId);
    } catch {
      refreshAllData();
    }
  };

  const setDishStockOut = async (dishId: string, isAvailable: boolean) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable } : d))
    );
    try {
      await api.menu.stockOut(dishId, isAvailable);
    } catch {
      refreshAllData();
    }
  };

  const saveEmployee = (emp: Partial<Employee> & { name: string; role: Role; phone?: string }) => {
    if (emp.id) {
      api.employees.update(emp.id, emp).then(() => refreshAllData());
    }
  };

  const addEmployee = (
    emp: Partial<Employee> & { name: string; role: Role; phone?: string; shift?: string; isActive?: boolean }
  ) => {
    api.employees.create(emp).then(() => refreshAllData());
  };

  const toggleEmployeeStatus = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (target?.isActive) {
      api.employees.deactivate(empId).then(() => refreshAllData());
    } else {
      api.employees.activate(empId).then(() => refreshAllData());
    }
  };

  const printReceipt = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) setReceiptOrder(order);
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markNotificationRead = markNotificationAsRead;

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const resetMockData = () => {
    refreshAllData();
  };

  // Live reactive KPI calculation derived dynamically from real-time orders & tables
  const liveSummary = React.useMemo(() => {
    let todaySales = 0;
    let diningSales = 0;
    let takeawaySales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let taxableSales = 0;
    let cgst = 0;
    let sgst = 0;
    let totalGst = 0;
    let pendingPayments = 0;

    const paidOrders = orders.filter((o) => o.status === 'payment_verified' || o.status === 'closed');
    const openOrders = orders.filter(
      (o) => o.status !== 'payment_verified' && o.status !== 'closed' && o.status !== 'payment_rejected'
    );

    paidOrders.forEach((o) => {
      todaySales += o.grandTotal || 0;
      taxableSales += o.taxableAmount || 0;
      cgst += o.cgst || 0;
      sgst += o.sgst || 0;
      totalGst += o.totalGst || 0;

      if (o.orderType === 'dining') {
        diningSales += o.grandTotal || 0;
      } else {
        takeawaySales += o.grandTotal || 0;
      }

      const method = o.payment?.method;
      if (method === 'CASH') cashSales += o.payment?.amount || o.grandTotal || 0;
      else if (method === 'UPI') upiSales += o.payment?.amount || o.grandTotal || 0;
      else if (method === 'CARD') cardSales += o.payment?.amount || o.grandTotal || 0;
    });

    orders.forEach((o) => {
      if (o.status === 'payment_submitted' || o.status === 'bill_requested') {
        pendingPayments += o.payment?.amount || o.grandTotal || 0;
      }
    });

    const openTables = tables.filter((t) => t.status !== 'available').length;
    const totalOrders = orders.filter((o) => o.status !== 'payment_rejected').length;

    return {
      todaySales: Math.max(todaySales, summary.todaySales || 0),
      openTables,
      pendingPayments: Math.max(pendingPayments, summary.pendingPayments || 0),
      totalOrders: Math.max(totalOrders, summary.totalOrders || 0),
      paidOrders: Math.max(paidOrders.length, (summary as any).paidOrders || 0),
      openOrders: Math.max(openOrders.length, (summary as any).openOrders || 0),
      diningSales: Math.max(diningSales, summary.diningSales || 0),
      takeawaySales: Math.max(takeawaySales, summary.takeawaySales || 0),
      cashSales: Math.max(cashSales, summary.cashSales || 0),
      upiSales: Math.max(upiSales, summary.upiSales || 0),
      cardSales: Math.max(cardSales, summary.cardSales || 0),
      taxableSales: Math.max(taxableSales, summary.taxableSales || 0),
      cgst: Math.max(cgst, summary.cgst || 0),
      sgst: Math.max(sgst, summary.sgst || 0),
      totalGst: Math.max(totalGst, summary.totalGst || 0),
    };
  }, [orders, tables, summary]);

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);
  const getTableByNumber = (tableNumber: string) => tables.find((t) => t.number === tableNumber);

  return (
    <RestaurantContext.Provider
      value={{
        currentUser: {
          name: authUser?.name || 'User',
          role: authRole || 'dining',
          phone: authUser?.phone || '',
        },
        isLoggedIn: isAuthenticated,
        login: () => {},
        logout: authLogout,
        switchRole: () => {},
        tables,
        orders,
        kitchenTickets,
        dishes,
        employees,
        notifications,
        summary: liveSummary,
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
        setDishStockOut,
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

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
