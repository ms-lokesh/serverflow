import React, { useState } from 'react';
import { Search, Plus, Utensils, Receipt, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Table, TableStatus } from '../types';

interface TablesScreenProps {
  onSelectTable: (table: Table) => void;
  onCreateOrderForTable: (table: Table) => void;
}

export const TablesScreen: React.FC<TablesScreenProps> = ({
  onSelectTable,
  onCreateOrderForTable,
}) => {
  const { tables, currentUser } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');

  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.number.includes(searchQuery) ||
      (table.activeEmployee && table.activeEmployee.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (table.currentOrderId && table.currentOrderId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          border: 'border-[#E8E6E3]',
          indicator: 'bg-emerald-500',
        };
      case 'occupied':
        return {
          label: 'Occupied',
          badge: 'bg-blue-50 text-blue-800 border-blue-200',
          border: 'border-blue-200 shadow-blue-50/50',
          indicator: 'bg-blue-500',
        };
      case 'bill_requested':
        return {
          label: 'Bill Requested',
          badge: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
          border: 'border-amber-300 shadow-amber-50',
          indicator: 'bg-amber-500 animate-pulse',
        };
      case 'payment_pending':
        return {
          label: 'Payment Pending',
          badge: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4] font-bold',
          border: 'border-[#F4B4B4] shadow-[#FCE8E8]/40',
          indicator: 'bg-[#C94B4B] animate-soft-pulse',
        };
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'available') {
      onCreateOrderForTable(table);
    } else {
      onSelectTable(table);
    }
  };

  // Status counts
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billCount = tables.filter((t) => t.status === 'bill_requested').length;
  const pendingCount = tables.filter((t) => t.status === 'payment_pending').length;

  return (
    <div className="pb-24 px-3.5 sm:px-6 lg:px-8 pt-4 space-y-4 w-full max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight">
            {currentUser.role === 'dining' ? `Dining Tables POS` : 'Table Management & Billing'}
          </h2>
          <p className="text-[12px] sm:text-[13px] text-[#737373]">
            {availableCount} Available • {occupiedCount} Dining • {billCount} Bill Printed • {pendingCount} Verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-white border border-[#E8E6E3] rounded-full text-[12px] font-bold text-[#242424] shadow-2xs">
            20 Total Floor Tables
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Stacked on mobile, Inline on Desktop) */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table # (e.g. 05) or server name..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E8E6E3] bg-white text-[13.5px] text-[#242424] placeholder-[#888] focus:outline-none focus:border-[#C94B4B] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#888] hover:text-[#242424]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11.5px] font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'all'
                ? 'bg-[#242424] text-white border-[#242424] shadow-xs'
                : 'bg-white text-[#555] border-[#E8E6E3] hover:bg-[#F8F8F6]'
            }`}
          >
            All ({tables.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'available'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'occupied'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
            }`}
          >
            Occupied ({occupiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('bill_requested')}
            className={`px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'bill_requested'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
            }`}
          >
            Bill Printed ({billCount})
          </button>
          <button
            onClick={() => setStatusFilter('payment_pending')}
            className={`px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'payment_pending'
                ? 'bg-[#C94B4B] text-white border-[#C94B4B] shadow-xs'
                : 'bg-white text-[#C94B4B] border-[#F4B4B4] hover:bg-[#FCE8E8]'
            }`}
          >
            Verification ({pendingCount})
          </button>
        </div>
      </div>

      {/* Responsive Tables Grid (Mobile: 2 cols, Tablet: 3-4 cols, Desktop: 5-6 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredTables.map((table) => {
          const statusInfo = getStatusBadge(table.status);

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              id={`table-card-${table.number}`}
              className={`bg-white rounded-2xl p-3.5 sm:p-4 border ${statusInfo.border} shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px] sm:min-h-[155px] cursor-pointer active:scale-97 transition-all relative overflow-hidden group`}
            >
              {/* Top Row: Table number & capacity */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
                      TABLE
                    </span>
                    <span className="text-[24px] sm:text-[28px] font-extrabold text-[#242424] leading-tight group-hover:text-[#C94B4B] transition-colors">
                      {table.number}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-[#737373] bg-[#F8F8F6] px-2 py-0.5 rounded-md font-semibold border border-[#E8E6E3]">
                    <Users className="w-3 h-3" /> {table.capacity}
                  </span>
                </div>

                {/* Status Pill */}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border ${statusInfo.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.indicator}`} />
                    <span className="truncate">{statusInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Row: Amount / Order Details or Quick Open button */}
              <div className="mt-3 pt-2 border-t border-[#F5F5F3] flex items-center justify-between text-[11.5px]">
                {table.status === 'available' ? (
                  <div className="flex items-center justify-between w-full text-emerald-700 font-bold">
                    <span>Open Table</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 group-hover:scale-110 transition-transform">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[14px] sm:text-[15px] text-[#242424]">
                        ₹{table.currentTotal || 0}
                      </span>
                      <span className="text-[10.5px] font-semibold text-[#737373] truncate max-w-[75px]">
                        {table.activeEmployee || 'Staff'}
                      </span>
                    </div>
                    {table.currentOrderId && (
                      <span className="text-[9.5px] font-mono text-[#888] block truncate mt-0.5">
                        {table.currentOrderId}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
