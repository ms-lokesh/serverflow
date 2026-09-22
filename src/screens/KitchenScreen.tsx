import React, { useState } from 'react';
import {
  ChefHat,
  CookingPot,
  PackageCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Layers,
  Check,
  Filter,
  Volume2,
  VolumeX,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { KitchenTicket } from '../types';

export const KitchenScreen: React.FC = () => {
  const { kitchenTickets, updateKitchenTicketStatus, currentUser, dishes, toggleDishAvailability } = useRestaurant();
  const [mobileTab, setMobileTab] = useState<'new' | 'preparing' | 'ready' | 'served'>('new');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dining' | 'takeaway'>('all');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  const outOfStockCount = dishes.filter((d) => !d.isAvailable).length;

  // Filtered by type
  const activeTickets = kitchenTickets.filter((t) => {
    if (typeFilter === 'all') return true;
    return t.orderType === typeFilter;
  });

  const newTickets = activeTickets.filter((t) => t.status === 'new');
  const prepTickets = activeTickets.filter((t) => t.status === 'preparing');
  const readyTickets = activeTickets.filter((t) => t.status === 'ready');
  const servedTickets = activeTickets.filter((t) => t.status === 'served');

  const mobileFilteredTickets = activeTickets.filter((t) => t.status === mobileTab);

  const renderTicketCard = (ticket: KitchenTicket, isKanban: boolean = false) => {
    const isAddition = ticket.isAddition;

    return (
      <div
        key={ticket.id}
        id={`kitchen-card-${ticket.id}`}
        className={`bg-white rounded-3xl p-4 border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
          isAddition
            ? 'border-amber-400 ring-2 ring-amber-400/30 bg-[#FFFCF7]'
            : 'border-[#E8E6E3]'
        } ${isKanban ? 'mb-3' : ''}`}
      >
        <div>
          {/* Visual Banner for ADDITIONAL ITEMS vs NEW ORDER */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-1.5">
              {isAddition ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-xs">
                  <Layers className="w-3 h-3" />
                  ADD-ON #{ticket.batchNumber}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-[#242424] text-white font-extrabold text-[10px] tracking-wider uppercase">
                  {ticket.orderType === 'dining' ? 'DINING' : 'TAKEAWAY'}
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-[#737373] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#C94B4B]" /> {ticket.createdAt}
            </span>
          </div>

          {/* Table / Customer Info */}
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="text-[9.5px] font-extrabold text-[#737373] uppercase tracking-wider block">
                {ticket.tableNumber ? 'TABLE' : 'CUSTOMER'}
              </span>
              <span className="text-[20px] sm:text-[22px] font-extrabold text-[#C94B4B] tracking-tight leading-none">
                {ticket.tableNumber ? `TABLE ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
              </span>
            </div>

            <div className="text-right">
              <span className="font-mono text-[12px] font-extrabold text-[#242424] block">
                {ticket.orderId}
              </span>
              <span className="text-[10px] text-[#737373] font-mono">
                #{ticket.id}
              </span>
            </div>
          </div>

          {/* CRITICAL: Items List */}
          <div className="py-2.5 border-t border-b border-[#F0EFEA] space-y-2">
            {isAddition && (
              <div className="text-[10.5px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                🔥 Cook only newly added items:
              </div>
            )}

            {ticket.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between text-[13.5px] font-extrabold text-[#242424]"
              >
                <div className="flex items-start gap-1.5 pr-2">
                  <span
                    className={`w-3.5 h-3.5 mt-0.5 rounded-xs border flex items-center justify-center shrink-0 ${
                      it.isVeg ? 'border-emerald-600' : 'border-red-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        it.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    />
                  </span>
                  <div>
                    <span className="leading-tight block">{it.name}</span>
                    {it.notes && (
                      <span className="text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 inline-block mt-0.5">
                        {it.notes}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[16px] font-extrabold text-[#C94B4B] px-2 py-0.5 rounded-lg bg-[#FCE8E8] shrink-0">
                  ×{it.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Large Bump / Progress Action Buttons */}
        <div className="pt-3">
          {ticket.status === 'new' && (
            <button
              onClick={() => updateKitchenTicketStatus(ticket.id, 'preparing')}
              id={`btn-kds-accept-${ticket.id}`}
              className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-sm shadow-amber-500/30 active:scale-98 transition-all"
            >
              <CookingPot className="w-5 h-5 stroke-[2.5]" />
              <span>START COOKING</span>
            </button>
          )}

          {ticket.status === 'preparing' && (
            <button
              onClick={() => updateKitchenTicketStatus(ticket.id, 'ready')}
              id={`btn-kds-ready-${ticket.id}`}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 active:scale-98 transition-all"
            >
              <PackageCheck className="w-5 h-5 stroke-[2.5]" />
              <span>MARK AS READY</span>
            </button>
          )}

          {ticket.status === 'ready' && (
            <button
              onClick={() => updateKitchenTicketStatus(ticket.id, 'served')}
              id={`btn-kds-served-${ticket.id}`}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>MARK AS SERVED</span>
            </button>
          )}

          {ticket.status === 'served' && (
            <div className="py-2 text-center text-emerald-800 bg-emerald-50 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
              <span>Done at {ticket.servedAt || ticket.readyAt || 'Earlier'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-28 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] sm:text-[22px] font-extrabold text-[#242424] tracking-tight leading-tight">
                  Kitchen Display System (KDS)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                  {newTickets.length + prepTickets.length} Pending
                </span>
              </div>
              <span className="text-[12px] text-[#737373]">Live Order Queue & Preparation Pipeline</span>
            </div>
          </div>

          {/* Type Filter Chips (All / Dining / Takeaway) */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F8F8F6] p-1 rounded-2xl border border-[#E8E6E3] text-[12px] font-bold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  typeFilter === 'all'
                    ? 'bg-[#242424] text-white shadow-xs'
                    : 'text-[#555] hover:text-[#242424]'
                }`}
              >
                All ({kitchenTickets.length})
              </button>
              <button
                onClick={() => setTypeFilter('dining')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  typeFilter === 'dining'
                    ? 'bg-[#C94B4B] text-white shadow-xs'
                    : 'text-[#555] hover:text-[#242424]'
                }`}
              >
                Dining ({kitchenTickets.filter((t) => t.orderType === 'dining').length})
              </button>
              <button
                onClick={() => setTypeFilter('takeaway')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  typeFilter === 'takeaway'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#555] hover:text-[#242424]'
                }`}
              >
                Takeaway ({kitchenTickets.filter((t) => t.orderType === 'takeaway').length})
              </button>
            </div>

            {/* Quick 86 / Stock Out Management Button */}
            <button
              onClick={() => setIsStockModalOpen(true)}
              id="btn-kds-stock-out-manager"
              className={`h-9 px-3 rounded-2xl font-extrabold text-[12px] border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs shrink-0 ${
                outOfStockCount > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                  : 'bg-white hover:bg-[#F5F5F3] text-[#242424] border-[#E8E6E3]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stock Out (86)</span>
              {outOfStockCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-amber-800 text-[10px] font-black flex items-center justify-center">
                  {outOfStockCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tabs (Visible only on mobile screens) */}
        <div className="grid grid-cols-4 gap-1.5 mt-3.5 text-[11.5px] font-extrabold lg:hidden">
          <button
            onClick={() => setMobileTab('new')}
            id="tab-kds-new"
            className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
              mobileTab === 'new'
                ? 'bg-[#C94B4B] text-white border-[#C94B4B] shadow-xs'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            <span>NEW</span>
            <span className={`text-[10px] ${mobileTab === 'new' ? 'text-white/90' : 'text-[#888]'}`}>
              ({newTickets.length})
            </span>
          </button>

          <button
            onClick={() => setMobileTab('preparing')}
            id="tab-kds-prep"
            className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
              mobileTab === 'preparing'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            <span>COOKING</span>
            <span className={`text-[10px] ${mobileTab === 'preparing' ? 'text-white/90' : 'text-[#888]'}`}>
              ({prepTickets.length})
            </span>
          </button>

          <button
            onClick={() => setMobileTab('ready')}
            id="tab-kds-ready"
            className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
              mobileTab === 'ready'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            <span>READY</span>
            <span className={`text-[10px] ${mobileTab === 'ready' ? 'text-white/90' : 'text-[#888]'}`}>
              ({readyTickets.length})
            </span>
          </button>

          <button
            onClick={() => setMobileTab('served')}
            id="tab-kds-done"
            className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
              mobileTab === 'served'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            <span>SERVED</span>
            <span className={`text-[10px] ${mobileTab === 'served' ? 'text-white/90' : 'text-[#888]'}`}>
              ({servedTickets.length})
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* DESKTOP 4-COLUMN KANBAN BOARD (Visible on lg: and up) */}
        <div className="hidden lg:grid grid-cols-4 gap-4 items-start">
          {/* Column 1: New / Incoming Orders */}
          <div className="bg-[#FAF9F7] rounded-3xl p-3.5 border border-[#E8E6E3] min-h-[75vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E6E3]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C94B4B] animate-pulse" />
                <h3 className="font-extrabold text-[14px] text-[#242424] uppercase tracking-wider">
                  New Incoming
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#C94B4B] text-white text-[11px] font-extrabold">
                {newTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {newTickets.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-semibold text-[#888] bg-white rounded-2xl border border-dashed border-[#E8E6E3]">
                  No new orders in queue
                </div>
              ) : (
                newTickets.map((t) => renderTicketCard(t, true))
              )}
            </div>
          </div>

          {/* Column 2: Cooking in Progress */}
          <div className="bg-[#FAF9F7] rounded-3xl p-3.5 border border-[#E8E6E3] min-h-[75vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E6E3]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="font-extrabold text-[14px] text-[#242424] uppercase tracking-wider">
                  Cooking / Prep
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold">
                {prepTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {prepTickets.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-semibold text-[#888] bg-white rounded-2xl border border-dashed border-[#E8E6E3]">
                  No items currently cooking
                </div>
              ) : (
                prepTickets.map((t) => renderTicketCard(t, true))
              )}
            </div>
          </div>

          {/* Column 3: Ready for Serving / Dispatch */}
          <div className="bg-[#FAF9F7] rounded-3xl p-3.5 border border-[#E8E6E3] min-h-[75vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E6E3]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <h3 className="font-extrabold text-[14px] text-[#242424] uppercase tracking-wider">
                  Ready To Serve
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-extrabold">
                {readyTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {readyTickets.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-semibold text-[#888] bg-white rounded-2xl border border-dashed border-[#E8E6E3]">
                  No dishes waiting for pickup
                </div>
              ) : (
                readyTickets.map((t) => renderTicketCard(t, true))
              )}
            </div>
          </div>

          {/* Column 4: Served / Completed */}
          <div className="bg-[#FAF9F7] rounded-3xl p-3.5 border border-[#E8E6E3] min-h-[75vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E6E3]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="font-extrabold text-[14px] text-[#242424] uppercase tracking-wider">
                  Completed / Served
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                {servedTickets.length}
              </span>
            </div>

            <div className="space-y-3">
              {servedTickets.length === 0 ? (
                <div className="p-6 text-center text-[12px] font-semibold text-[#888] bg-white rounded-2xl border border-dashed border-[#E8E6E3]">
                  No completed tickets yet
                </div>
              ) : (
                servedTickets.slice(0, 10).map((t) => renderTicketCard(t, true))
              )}
            </div>
          </div>
        </div>

        {/* MOBILE STREAM (Visible on sm/md) */}
        <div className="lg:hidden space-y-4">
          {mobileFilteredTickets.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-[#E8E6E3] text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-[15px] text-[#242424]">
                No {mobileTab.toUpperCase()} Tickets
              </h3>
              <p className="text-[12px] text-[#737373]">
                All items in this section have been processed.
              </p>
            </div>
          ) : (
            mobileFilteredTickets.map((t) => renderTicketCard(t, false))
          )}
        </div>
      </div>

      {/* 86 / Stock Out Item Manager Modal for Chefs */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E8E6E3] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8E6E3] flex items-center justify-between bg-[#F8F8F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#242424]">86 / Stock Out Manager</h3>
                  <p className="text-[11.5px] text-[#737373]">
                    Instantly toggle dish availability across all POS terminals and waiter tablets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#E8E6E3] hover:bg-[#DDD] text-[#555] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-4 border-b border-[#F0EFEA] bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes by name or category..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[13px] font-medium text-[#242424] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Dish List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {dishes
                .filter(
                  (d) =>
                    d.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                    d.category.toLowerCase().includes(stockSearchQuery.toLowerCase())
                )
                .map((dish) => {
                  const isAvail = dish.isAvailable;
                  return (
                    <div
                      key={dish.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isAvail
                          ? 'bg-white border-[#E8E6E3]'
                          : 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <h4
                            className={`text-[13.5px] font-extrabold truncate ${
                              isAvail ? 'text-[#242424]' : 'text-[#888] line-through'
                            }`}
                          >
                            {dish.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-[#F0EFEA] text-[#555] text-[10.5px] font-bold">
                            {dish.category}
                          </span>
                        </div>
                        <div className="text-[12px] font-mono text-[#737373] mt-0.5">
                          ₹{dish.price}
                        </div>
                      </div>

                      {/* Instant Toggle Button */}
                      <button
                        onClick={() => toggleDishAvailability(dish.id)}
                        id={`btn-toggle-86-${dish.id}`}
                        className={`h-9 px-3.5 rounded-xl text-[12px] font-extrabold border flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                          isAvail
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvail ? 'bg-emerald-500' : 'bg-white'
                          }`}
                        />
                        <span>{isAvail ? 'In Stock' : '86 OUT OF STOCK'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E8E6E3] bg-[#F8F8F6] flex items-center justify-between text-[12px]">
              <span className="text-[#737373]">
                {outOfStockCount > 0 ? (
                  <strong className="text-amber-800 font-extrabold">{outOfStockCount} items</strong>
                ) : (
                  'All items'
                )}{' '}
                currently out of stock
              </span>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#242424] text-white font-extrabold text-[12px] hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
