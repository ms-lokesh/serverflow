import { Dish, Employee, KitchenTicket, Order, Table, AppNotification } from '../types';

export const RESTAURANT_INFO = {
  name: 'Spice House Restaurant',
  tagline: 'Authentic Indian Cuisine & Grill',
  address: '42 MG Road, Indiranagar, Bengaluru - 560038',
  phone: '+91 80 2558 9123',
  gstin: '29ABCDE1234F1Z5',
  fssai: '11223344001289',
  upiId: 'spicehouse@upi',
  upiMerchantName: 'SPICE HOUSE RESTAURANT',
  defaultGstPercent: 5, // 2.5% CGST + 2.5% SGST
};

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'dish-1',
    name: 'Chicken Biryani',
    category: 'Main Course',
    price: 220,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: false,
    popular: true,
    description: 'Fragrant basmati rice slow-cooked with tender chicken and aromatic spices.',
  },
  {
    id: 'dish-2',
    name: 'Chicken 65',
    category: 'Starters',
    price: 220,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: false,
    popular: true,
    description: 'Crispy fried spicy chicken bites tempered with curry leaves and green chilies.',
  },
  {
    id: 'dish-3',
    name: 'Mutton Biryani',
    category: 'Main Course',
    price: 280,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: false,
    popular: true,
    description: 'Traditional slow dum mutton biryani with caramelized onions and saffron.',
  },
  {
    id: 'dish-4',
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    price: 240,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Cottage cheese cubes simmered in a rich tomato, butter, and cashew gravy.',
  },
  {
    id: 'dish-5',
    name: 'Veg Fried Rice',
    category: 'Rice',
    price: 180,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: false,
    description: 'Wok-tossed basmati rice with crunchy seasonal vegetables and light soy.',
  },
  {
    id: 'dish-6',
    name: 'Chicken Fried Rice',
    category: 'Rice',
    price: 210,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: false,
    popular: true,
    description: 'Classic Indo-Chinese fried rice with diced chicken, egg, and spring onions.',
  },
  {
    id: 'dish-7',
    name: 'Chicken Tikka',
    category: 'Starters',
    price: 250,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: false,
    popular: true,
    description: 'Char-grilled boneless chicken marinated in tandoori yogurt and spices.',
  },
  {
    id: 'dish-8',
    name: 'Gobi Manchurian',
    category: 'Starters',
    price: 160,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: false,
    description: 'Crispy cauliflower florets tossed in tangy ginger-garlic manchurian glaze.',
  },
  {
    id: 'dish-9',
    name: 'Parotta',
    category: 'Breads',
    price: 40,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Flaky layered South Indian flatbread grilled on iron tawa.',
  },
  {
    id: 'dish-10',
    name: 'Butter Naan',
    category: 'Breads',
    price: 45,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Leavened clay oven bread brushed with fresh melted butter.',
  },
  {
    id: 'dish-11',
    name: 'Tandoori Roti',
    category: 'Breads',
    price: 30,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: false,
    description: 'Whole wheat flatbread baked crisp in traditional clay tandoor.',
  },
  {
    id: 'dish-12',
    name: 'Coke',
    category: 'Beverages',
    price: 35,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Chilled 300ml can.',
  },
  {
    id: 'dish-13',
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 60,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Refreshing sparkling soda with fresh squeezed lime juice and mint.',
  },
  {
    id: 'dish-14',
    name: 'Mango Lassi',
    category: 'Beverages',
    price: 75,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: false,
    description: 'Creamy blended yogurt drink with Alphonso mango pulp and cardamom.',
  },
  {
    id: 'dish-15',
    name: 'Ice Cream',
    category: 'Desserts',
    price: 90,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: true,
    description: 'Double scoop gourmet vanilla or Belgian chocolate with nuts.',
  },
  {
    id: 'dish-16',
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 70,
    gstPercentage: 5,
    isAvailable: true,
    isVeg: true,
    popular: false,
    description: 'Two warm golden khoya dumplings soaked in saffron rose syrup.',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Admin Manager',
    role: 'admin',
    status: 'active',
    phone: '+91 98765 43214',
    expectedCollection: 0,
    verifiedCollection: 0,
  },
  {
    id: 'emp-2',
    name: 'Arun Kumar',
    role: 'dining',
    status: 'active',
    phone: '+91 98765 11111',
    expectedCollection: 0,
    verifiedCollection: 0,
  },
  {
    id: 'emp-3',
    name: 'Chef Suresh',
    role: 'kitchen',
    status: 'active',
    phone: '+91 98765 22222',
    expectedCollection: 0,
    verifiedCollection: 0,
  },
  {
    id: 'emp-4',
    name: 'Manoj',
    role: 'takeaway',
    status: 'active',
    phone: '+91 98765 33333',
    expectedCollection: 0,
    verifiedCollection: 0,
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => {
  const tableNum = (i + 1).toString().padStart(2, '0');
  return {
    id: `tbl_${tableNum}`,
    number: tableNum,
    capacity: (i + 1) <= 4 ? 2 : (i + 1) <= 8 ? 4 : 6,
    status: 'available',
    currentTotal: 0,
    currentOrderId: undefined,
    activeEmployee: undefined,
    updatedAt: 'Just now',
  };
});

export const INITIAL_KITCHEN_TICKETS: KitchenTicket[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_SUMMARY: {
  todaySales: number;
  openTables: number;
  pendingPayments: number;
  totalOrders: number;
  diningSales: number;
  takeawaySales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  taxableSales: number;
  cgst: number;
  sgst: number;
  totalGst: number;
} = {
  todaySales: 0,
  openTables: 0,
  pendingPayments: 0,
  totalOrders: 0,
  diningSales: 0,
  takeawaySales: 0,
  cashSales: 0,
  upiSales: 0,
  cardSales: 0,
  taxableSales: 0,
  cgst: 0,
  sgst: 0,
  totalGst: 0,
};
