import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Users,
  Utensils,
  ChevronRight,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Sparkles,
  Percent,
  ChefHat,
  Shield,
  UtensilsCrossed,
  UserCheck,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order } from '../types';

interface AdminDashboardProps {
  onNavigateToPayments: () => void;
  onNavigateToTables: () => void;
  onNavigateToOrders: () => void;
  onNavigateToReports: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToEmployees?: () => void;
  onReviewPayment: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToPayments,
  onNavigateToTables,
  onNavigateToOrders,
  onNavigateToReports,
  onNavigateToMenu,
  onNavigateToEmployees,
  onReviewPayment,
}) => {
  const { summary, orders, tables, currentUser, restaurantConfig } = useRestaurant();
  const [salesTimeframe, setSalesTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Pending payment orders for review
  const pendingOrders = orders.filter(
    (o) => o.status === 'payment_submitted' && o.payment?.status === 'pending'
  );

  const openTablesCount = tables.filter((t) => t.status !== 'available').length;

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Top selling mock metrics
  const topDishes = [
    { name: 'Chicken Biryani', count: 48, revenue: '₹10,560', change: '+18%' },
    { name: 'Chicken 65', count: 34, revenue: '₹7,480', change: '+12%' },
    { name: 'Chicken Fried Rice', count: 26, revenue: '₹5,460', change: '+8%' },
    { name: 'Coke', count: 42, revenue: '₹1,470', change: '+24%' },
  ];

  // Chart data simulation per timeframe
  const chartBars =
    salesTimeframe === 'today'
      ? [
          { label: '11am', value: 3200, height: '35%' },
          { label: '12pm', value: 7800, height: '70%' },
          { label: '1pm', value: 12400, height: '95%' },
          { label: '2pm', value: 9200, height: '80%' },
          { label: '3pm', value: 4500, height: '45%' },
          { label: 'Now', value: summary.todaySales, height: '100%', active: true },
        ]
      : salesTimeframe === 'week'
      ? [
          { label: 'Mon', value: 38000, height: '65%' },
          { label: 'Tue', value: 41000, height: '72%' },
          { label: 'Wed', value: 39500, height: '68%' },
          { label: 'Thu', value: 44200, height: '78%' },
          { label: 'Fri', value: 52000, height: '90%' },
          { label: 'Today', value: summary.todaySales, height: '85%', active: true },
        ]
      : [
          { label: 'W1', value: 245000, height: '70%' },
          { label: 'W2', value: 280000, height: '82%' },
          { label: 'W3', value: 310000, height: '92%' },
          { label: 'W4', value: 295000, height: '88%', active: true },
        ];

  return (
    <div className="pb-28 px-4 sm:px-6 lg:px-8 pt-4 space-y-5 w-full max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#E8E6E3] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold text-[#737373] uppercase tracking-wider">
              {todayDateStr}
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight mt-0.5">
              Good morning, {currentUser.name}
            </h2>
            <p className="text-[12.5px] font-medium text-[#C94B4B]">{restaurantConfig.name} • Admin Console</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FCE8E8] flex items-center justify-center text-[#A83B3B] border border-[#F4B4B4]/60 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* KPI Performance Cards Grid */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[12px] font-bold text-[#737373] uppercase tracking-wider">
            Live Performance
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live Sync
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Today's Sales */}
          <div
            onClick={onNavigateToReports}
            className="bg-gradient-to-br from-white to-[#FDFBFB] p-4 rounded-2xl border border-[#E8E6E3] shadow-xs hover:shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#737373] mb-1">
              <span className="text-[11.5px] font-semibold">Today's Sales</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight">
              ₹{summary.todaySales.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +14.2% vs yesterday
            </div>
          </div>

          {/* Open Tables */}
          <div
            onClick={onNavigateToTables}
            className="bg-white p-4 rounded-2xl border border-[#E8E6E3] shadow-xs hover:shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#737373] mb-1">
              <span className="text-[11.5px] font-semibold">Open Tables</span>
              <Utensils className="w-4 h-4 text-[#C94B4B]" />
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight">
              {openTablesCount} <span className="text-[12px] font-normal text-[#737373]">/ 20</span>
            </div>
            <div className="text-[10px] text-[#737373] font-medium mt-1">
              {20 - openTablesCount} available
            </div>
          </div>

          {/* Pending Payments */}
          <div
            onClick={onNavigateToPayments}
            className="bg-[#FFF9F5] p-4 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11.5px] font-bold">Pending Pay</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold text-amber-900 tracking-tight">
              ₹{summary.pendingPayments.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-700 font-bold mt-1">
              {pendingOrders.length} unverified
            </div>
          </div>

          {/* Orders */}
          <div
            onClick={onNavigateToOrders}
            className="bg-white p-4 rounded-2xl border border-[#E8E6E3] shadow-xs hover:shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[#737373] mb-1">
              <span className="text-[11.5px] font-semibold">Orders</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight">
              {summary.totalOrders}
            </div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1">
              Dining + Takeaway
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 space-y-5">
          {/* Sales Overview Chart */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[15px] text-[#242424]">Sales Overview</h3>
                <span className="text-[11px] text-[#737373]">Live revenue curve</span>
              </div>

              {/* Timeframe Segmented Control */}
              <div className="flex p-0.5 bg-[#F8F8F6] rounded-xl border border-[#E8E6E3] text-[11px] font-bold">
                <button
                  onClick={() => setSalesTimeframe('today')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    salesTimeframe === 'today'
                      ? 'bg-white text-[#C94B4B] shadow-xs'
                      : 'text-[#737373] hover:text-[#242424]'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSalesTimeframe('week')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    salesTimeframe === 'week'
                      ? 'bg-white text-[#C94B4B] shadow-xs'
                      : 'text-[#737373] hover:text-[#242424]'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setSalesTimeframe('month')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    salesTimeframe === 'month'
                      ? 'bg-white text-[#C94B4B] shadow-xs'
                      : 'text-[#737373] hover:text-[#242424]'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Compact Visual Chart */}
            <div className="h-32 flex items-end justify-between gap-2 pt-2 px-1 border-b border-[#F0EFEA] pb-2">
              {chartBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[9px] font-mono text-[#888] opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(bar.value / 1000).toFixed(1)}k
                  </div>
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                      bar.active
                        ? 'bg-[#C94B4B] shadow-sm shadow-[#C94B4B]/30'
                        : 'bg-[#F4B4B4]/60 hover:bg-[#C94B4B]/80'
                    }`}
                  />
                  <span className={`text-[10px] ${bar.active ? 'font-bold text-[#C94B4B]' : 'text-[#737373]'}`}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Breakdown chips */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-1 text-center">
              <div className="p-2 rounded-xl bg-[#F8F8F6]">
                <span className="text-[10px] text-[#737373] block">Dining</span>
                <strong className="text-[12.5px] text-[#242424]">₹{summary.diningSales.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-xl bg-[#F8F8F6]">
                <span className="text-[10px] text-[#737373] block">Takeaway</span>
                <strong className="text-[12.5px] text-[#242424]">₹{summary.takeawaySales.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-xl bg-[#F8F8F6]">
                <span className="text-[10px] text-[#737373] block">GST Total</span>
                <strong className="text-[12.5px] text-[#242424]">₹{summary.totalGst.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Admin Fast Tools: Menu, Price & Tax Management */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FCE8E8] text-[#A83B3B] flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[14.5px] text-[#242424]">Admin Operations</h3>
                  <span className="text-[11px] text-[#737373]">Single-Restaurant Master Controls</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#A83B3B] font-bold text-[10px]">
                Tax: {restaurantConfig.gstPercent}% GST
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <button
                onClick={onNavigateToMenu}
                id="btn-admin-manage-menu"
                className="p-3.5 rounded-2xl bg-[#F8F8F6] hover:bg-[#F5F5F3] border border-[#E8E6E3] text-left transition-all active:scale-95 space-y-1"
              >
                <div className="flex items-center justify-between text-[#C94B4B]">
                  <UtensilsCrossed className="w-4.5 h-4.5" />
                  <ChevronRight className="w-3.5 h-3.5 text-[#888]" />
                </div>
                <strong className="text-[13px] text-[#242424] block">Menu & Prices</strong>
                <span className="text-[10.5px] text-[#737373] block leading-tight">
                  Add dishes, edit item prices, GST rates
                </span>
              </button>

              <button
                onClick={onNavigateToReports}
                id="btn-admin-manage-reports"
                className="p-3.5 rounded-2xl bg-[#F8F8F6] hover:bg-[#F5F5F3] border border-[#E8E6E3] text-left transition-all active:scale-95 space-y-1"
              >
                <div className="flex items-center justify-between text-blue-600">
                  <BarChart3 className="w-4.5 h-4.5" />
                  <ChevronRight className="w-3.5 h-3.5 text-[#888]" />
                </div>
                <strong className="text-[13px] text-[#242424] block">Tax & Closing</strong>
                <span className="text-[10.5px] text-[#737373] block leading-tight">
                  Daily sales, CGST/SGST, EOD closing
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols */}
        <div className="lg:col-span-5 space-y-5">
          {/* Payment Verification Section */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[15px] text-[#242424]">Payment Verification</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#A83B3B] font-bold text-[10px]">
                  {pendingOrders.length} Pending
                </span>
              </div>
              <button
                onClick={onNavigateToPayments}
                className="text-[12px] font-bold text-[#C94B4B] flex items-center gap-0.5 hover:underline"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-6 bg-[#F8F8F6] rounded-2xl border border-dashed border-[#E8E6E3] text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-[13px] font-bold text-[#242424]">All Payments Verified!</p>
                <p className="text-[11px] text-[#737373]">No pending payment approvals at this moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#F8F8F6] rounded-2xl p-3.5 border border-[#E8E6E3] shadow-xs flex items-center justify-between gap-3 hover:border-[#C94B4B]/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E3] flex flex-col items-center justify-center font-bold text-[#242424] shrink-0">
                        <span className="text-[9px] text-[#737373] uppercase leading-none">Table</span>
                        <span className="text-[14px] leading-tight text-[#C94B4B]">{ord.tableNumber || 'TK'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-[#242424]">₹{ord.grandTotal}</span>
                          <span
                            className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              ord.payment?.method === 'CASH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.payment?.method === 'UPI'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {ord.payment?.method}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#737373] flex items-center gap-1.5 mt-0.5">
                          <span>By: <strong className="text-[#444]">{ord.payment?.employeeName || ord.employeeName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onReviewPayment(ord)}
                      id={`btn-review-${ord.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[#C94B4B] text-white font-bold text-[12px] hover:bg-[#A83B3B] active:scale-95 transition-all shadow-xs shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Dishes */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F5F5F3]">
              <h3 className="font-bold text-[15px] text-[#242424]">Top Selling Dishes</h3>
              <span className="text-[11px] text-[#737373]">Today's volume</span>
            </div>

            <div className="space-y-2.5">
              {topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between text-[13px] py-1 border-b border-[#F5F5F3] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#F8F8F6] text-[#737373] font-bold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-[#242424]">{dish.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#242424]">{dish.count} orders</span>
                    <span className="text-[10px] text-[#737373] block">{dish.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
