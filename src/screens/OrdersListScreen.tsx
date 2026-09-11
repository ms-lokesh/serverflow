import React, { useState } from 'react';
import {
  Search,
  Receipt,
  Filter,
  CheckCircle2,
  Clock,
  CreditCard,
  Utensils,
  ShoppingBag,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, OrderStatus } from '../types';

interface OrdersListScreenProps {
  onSelectOrder: (order: Order) => void;
  onViewBill: (order: Order) => void;
}

export const OrdersListScreen: React.FC<OrdersListScreenProps> = ({
  onSelectOrder,
  onViewBill,
}) => {
  const { orders, printReceipt } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dining' | 'takeaway' | 'payment_submitted' | 'closed'>('all');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.includes(searchQuery)) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.employeeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'dining'
        ? o.type === 'dining'
        : filterType === 'takeaway'
        ? o.type === 'takeaway'
        : filterType === 'payment_submitted'
        ? o.status === 'payment_submitted'
        : o.status === 'closed';

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'created':
      case 'sent_to_kitchen':
      case 'preparing':
      case 'ready':
      case 'served':
        return { label: 'In Service', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'bill_requested':
        return { label: 'Bill Given', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
      case 'payment_submitted':
        return {
          label: 'Payment Pending',
          color: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4] font-bold',
        };
      case 'closed':
        return { label: 'Paid & Closed', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: status, color: 'bg-gray-50 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="pb-28 max-w-md lg:max-w-5xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-3.5 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#242424] tracking-tight">
              Order History
            </h2>
            <span className="text-[12px] text-[#737373]">
              {orders.length} Total Shift Orders
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#F8F8F6] border border-[#E8E6E3] font-mono text-[11.5px] font-bold text-[#333]">
            Today
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-2.5 text-[11.5px] font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-[#242424] text-white border-[#242424]'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('dining')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              filterType === 'dining'
                ? 'bg-[#C94B4B] text-white border-[#C94B4B]'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            Dining ({orders.filter((o) => o.type === 'dining').length})
          </button>
          <button
            onClick={() => setFilterType('takeaway')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              filterType === 'takeaway'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-[#F8F8F6] text-blue-800 border-blue-200'
            }`}
          >
            Takeaway ({orders.filter((o) => o.type === 'takeaway').length})
          </button>
          <button
            onClick={() => setFilterType('payment_submitted')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              filterType === 'payment_submitted'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-[#F8F8F6] text-amber-800 border-amber-200'
            }`}
          >
            Unverified ({orders.filter((o) => o.status === 'payment_submitted').length})
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Table #, Staff..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E8E6E3] bg-white text-[13.5px] text-[#242424] placeholder-[#888] focus:outline-none focus:border-[#C94B4B] shadow-2xs"
          />
        </div>

        {/* Orders Stream */}
        <div className="space-y-2.5">
          {filteredOrders.map((ord) => {
            const badge = getStatusBadge(ord.status);

            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord)}
                className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-2.5 cursor-pointer active:scale-98 transition-all hover:border-[#C94B4B]/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] flex flex-col items-center justify-center font-bold text-[#242424] shrink-0">
                      {ord.type === 'dining' ? (
                        <>
                          <span className="text-[8.5px] text-[#737373] uppercase leading-none">T</span>
                          <span className="text-[13px] leading-tight text-[#C94B4B]">{ord.tableNumber}</span>
                        </>
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-[14px] text-[#242424]">
                          {ord.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#737373] flex items-center gap-1.5 mt-0.5">
                        <span>Staff: <strong className="text-[#444]">{ord.employeeName}</strong></span>
                        <span>•</span>
                        <span>{ord.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[17px] font-extrabold text-[#242424] block">
                      ₹{ord.grandTotal}
                    </span>
                    {ord.payment && (
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        {ord.payment.method}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Summary preview */}
                <div className="pt-2 border-t border-[#F5F5F3] flex items-center justify-between text-[11.5px] text-[#555]">
                  <span className="truncate max-w-[240px]">
                    {ord.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      printReceipt(ord.id);
                    }}
                    className="p-1.5 rounded-lg bg-[#F8F8F6] border border-[#E8E6E3] text-[#555] hover:text-[#242424] active:scale-95"
                    title="Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
