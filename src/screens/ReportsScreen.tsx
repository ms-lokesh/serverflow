import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  PieChart,
  Users,
  Download,
  Calendar,
  DollarSign,
  Utensils,
  ShoppingBag,
  ArrowUpRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface ReportsScreenProps {
  onNavigateToDailyClosing?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onNavigateToDailyClosing }) => {
  const { summary, employees, showToast } = useRestaurant();
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  // Simulated metrics scaled by range
  const multiplier = timeRange === 'today' ? 1 : timeRange === 'yesterday' ? 0.92 : timeRange === 'week' ? 6.4 : 26.5;

  const totalSales = Math.round(summary.todaySales * multiplier);
  const diningSales = Math.round(summary.diningSales * multiplier);
  const takeawaySales = Math.round(summary.takeawaySales * multiplier);
  const cashSales = Math.round(summary.cashSales * multiplier);
  const upiSales = Math.round(summary.upiSales * multiplier);
  const cardSales = Math.round(summary.cardSales * multiplier);
  const totalOrders = Math.round(summary.totalOrders * multiplier);
  const totalGst = Math.round(summary.totalGst * multiplier);
  const avgOrderValue = Math.round(totalSales / (totalOrders || 1));

  const handleExport = () => {
    showToast(`Exported ${timeRange.toUpperCase()} Sales Report as CSV/PDF`, 'success');
  };

  return (
    <div className="pb-32 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-5 py-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold text-[#242424] tracking-tight">
            Sales & Financial Analytics
          </h2>
          <span className="text-[12.5px] text-[#737373]">Single Restaurant Revenue & Order Flow</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-1 p-1 bg-[#F8F8F6] rounded-2xl border border-[#E8E6E3] text-[12px] font-extrabold">
            {(['today', 'yesterday', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  timeRange === r
                    ? 'bg-[#C94B4B] text-white shadow-xs'
                    : 'text-[#737373] hover:text-[#242424]'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'yesterday' ? 'Yesterday' : r === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            id="btn-export-report"
            className="py-2 px-3.5 rounded-xl bg-white border border-[#E8E6E3] text-[#242424] hover:bg-[#F8F8F6] active:scale-95 flex items-center gap-1.5 text-[12.5px] font-bold shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C94B4B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Revenue Hero & Channel Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Revenue Hero Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#737373] uppercase tracking-wider">
                Confirmed Net Sales
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 border border-emerald-200">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% Growth
              </span>
            </div>

            <div className="text-[38px] font-extrabold text-[#242424] tracking-tight leading-none">
              ₹{totalSales.toLocaleString('en-IN')}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F5F5F3] text-center">
              <div className="p-3 rounded-2xl bg-[#F8F8F6]">
                <span className="text-[10.5px] text-[#737373] uppercase font-bold block">Total Orders</span>
                <strong className="text-[16px] text-[#242424]">{totalOrders}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8F8F6]">
                <span className="text-[10.5px] text-[#737373] uppercase font-bold block">Avg Order Value</span>
                <strong className="text-[16px] text-[#242424]">₹{avgOrderValue}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8F8F6]">
                <span className="text-[10.5px] text-[#737373] uppercase font-bold block">GST Collected</span>
                <strong className="text-[16px] text-[#242424]">₹{totalGst.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Payment Methods Split */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3.5">
            <h3 className="font-extrabold text-[15.5px] text-[#242424]">Payment Mode Breakdown</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1 text-emerald-800 text-[11.5px] font-bold">
                  <Banknote className="w-4 h-4" /> CASH
                </div>
                <div className="text-[17px] font-extrabold text-emerald-950 mt-1">
                  ₹{cashSales.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {Math.round((cashSales / (totalSales || 1)) * 100)}% of total
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-1 text-blue-800 text-[11.5px] font-bold">
                  <QrCode className="w-4 h-4" /> UPI / QR
                </div>
                <div className="text-[17px] font-extrabold text-blue-950 mt-1">
                  ₹{upiSales.toLocaleString()}
                </div>
                <span className="text-[11px] text-blue-700 font-semibold">
                  {Math.round((upiSales / (totalSales || 1)) * 100)}% of total
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-1 text-purple-800 text-[11.5px] font-bold">
                  <CreditCard className="w-4 h-4" /> CARD / POS
                </div>
                <div className="text-[17px] font-extrabold text-purple-950 mt-1">
                  ₹{cardSales.toLocaleString()}
                </div>
                <span className="text-[11px] text-purple-700 font-semibold">
                  {Math.round((cardSales / (totalSales || 1)) * 100)}% of total
                </span>
              </div>
            </div>
          </div>

          {/* Daily Closing Shortcut */}
          {onNavigateToDailyClosing && (
            <div className="p-5 bg-[#242424] text-white rounded-3xl shadow-md flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[15px]">End-of-Day Register Closing</h4>
                <p className="text-[12px] text-[#BBB] mt-0.5">Audit cash register drawer and reconcile daily sales batches.</p>
              </div>
              <button
                onClick={onNavigateToDailyClosing}
                id="btn-goto-daily-closing"
                className="py-2.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[13px] hover:bg-[#A83B3B] active:scale-95 transition-all shadow-sm"
              >
                Close Day
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Channel Distribution & Staff Performance (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Dining vs Takeaway Split */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-4">
            <h3 className="font-extrabold text-[15.5px] text-[#242424]">Order Channel Distribution</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-[#333]">
                    <Utensils className="w-4 h-4 text-[#C94B4B]" /> Dining Sales
                  </span>
                  <span className="font-bold text-[#242424]">
                    ₹{diningSales.toLocaleString()} ({Math.round((diningSales / (totalSales || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F0EFEA] overflow-hidden">
                  <div
                    style={{ width: `${Math.round((diningSales / (totalSales || 1)) * 100)}%` }}
                    className="h-full bg-[#C94B4B] rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[13px] font-semibold mb-1.5">
                  <span className="flex items-center gap-2 text-[#333]">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> Takeaway Sales
                  </span>
                  <span className="font-bold text-[#242424]">
                    ₹{takeawaySales.toLocaleString()} ({Math.round((takeawaySales / (totalSales || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F0EFEA] overflow-hidden">
                  <div
                    style={{ width: `${Math.round((takeawaySales / (totalSales || 1)) * 100)}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Staff Performance Metrics */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[15.5px] text-[#242424]">Staff Performance</h3>
              <span className="text-[11.5px] text-[#737373]">Shift Contribution</span>
            </div>

            <div className="divide-y divide-[#F5F5F3]">
              {employees.map((emp) => {
                const empOrders = emp.name === 'Arun' ? 42 : emp.name === 'Ravi' ? 38 : emp.name === 'Manoj' ? 46 : 0;
                const empSales = emp.name === 'Arun' ? 18400 : emp.name === 'Ravi' ? 16200 : emp.name === 'Manoj' ? 13650 : 0;

                return (
                  <div key={emp.id} className="py-3 flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center font-extrabold text-[#242424] text-[14px]">
                        {emp.name[0]}
                      </div>
                      <div>
                        <span className="font-bold text-[#242424] block">{emp.name}</span>
                        <span className="text-[11px] text-[#737373] capitalize">{emp.role} Staff</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-[#242424] block">₹{(empSales * multiplier).toLocaleString()}</span>
                      <span className="text-[11px] text-[#737373]">{Math.round(empOrders * multiplier)} orders</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
