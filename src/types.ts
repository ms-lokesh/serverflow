export type Role = 'admin' | 'dining' | 'kitchen' | 'takeaway';

export type TableStatus = 'available' | 'occupied' | 'bill_requested' | 'payment_pending';

export type OrderStatus =
  | 'created'
  | 'sent_to_kitchen'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'bill_requested'
  | 'payment_submitted'
  | 'payment_verified'
  | 'closed'
  | 'payment_rejected';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface OrderItem {
  id: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  isVeg?: boolean;
  isAddition?: boolean;
  batchId: number;
  notes?: string;
}

export interface KitchenTicketItem {
  dishId: string;
  name: string;
  quantity: number;
  notes?: string;
  isVeg?: boolean;
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  tableNumber?: string;
  orderType: 'dining' | 'takeaway';
  customerName?: string;
  items: KitchenTicketItem[];
  status: 'new' | 'preparing' | 'ready' | 'served';
  isAddition: boolean;
  batchNumber: number;
  createdAt: string;
  acceptedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  change?: number;
  refNumber?: string;
  submittedAt: string;
  employeeName: string;
  status: PaymentStatus;
  rejectionReason?: string;
  rejectionNotes?: string;
  verifiedAt?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  current?: boolean;
  subtitle?: string;
}

export interface Order {
  id: string;
  tableNumber?: string;
  orderType: 'dining' | 'takeaway';
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string;
  notes?: string;
  items: OrderItem[];
  status: OrderStatus;
  employeeName: string;
  employeeRole: Role;
  createdAt: string;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  billNumber?: string;
  payment?: PaymentDetails;
  timeline: TimelineEvent[];
  batchesCount: number;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentTotal?: number;
  activeEmployee?: string;
  updatedAt: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  gstPercentage: number;
  isAvailable: boolean;
  isVeg: boolean;
  description?: string;
  popular?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  status: 'active' | 'inactive';
  phone: string;
  expectedCollection: number;
  verifiedCollection: number;
  avatar?: string;
  shift?: string;
  isActive?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'kitchen' | 'addition' | 'payment_sub' | 'payment_ver' | 'payment_rej' | 'alert' | 'printer';
  time: string;
  read: boolean;
  orderId?: string;
  tableNumber?: string;
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  upiId: string;
  gstPercent: number;
  isGstEnabled: boolean;
  serviceChargePercent: number;
}

export interface DailySalesSummary {
  date: string;
  totalOrders: number;
  paidOrders: number;
  openOrders: number;
  totalSales: number;
  diningSales: number;
  takeawaySales: number;
  cashCollection: number;
  upiCollection: number;
  cardCollection: number;
  pendingCollection: number;
  taxableSales: number;
  cgst: number;
  sgst: number;
  totalGst: number;
}
