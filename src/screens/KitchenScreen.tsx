import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChefHat,
  CookingPot,
  PackageCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Check,
  Filter,
  Volume2,
  VolumeX,
  AlertTriangle,
  Search,
  X,
  Flame,
  RotateCcw,
  Timer,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { KitchenTicket } from '../types';

/**
 * Clean Web Audio API chime when a new order arrives
 */
function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

/**
 * Format ISO timestamp into clean 12-hour local time (e.g. 10:48 PM)
 */
function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Format relative elapsed duration (e.g. 5m 20s)
 */
function getElapsed(createdAt: string, now: number): {
  text: string;
  totalSecs: number;
  mins: number;
  urgency: 'normal' | 'warn' | 'urgent';
} {
  try {
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return { text: '< 1m', totalSecs: 0, mins: 0, urgency: 'normal' };
    const diffSec = Math.max(0, Math.floor((now - created) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const text = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    let urgency: 'normal' | 'warn' | 'urgent' = 'normal';
    if (mins >= 15) urgency = 'urgent';
    else if (mins >= 8) urgency = 'warn';

    return { text, totalSecs: diffSec, mins, urgency };
  } catch {
    return { text: '', totalSecs: 0, mins: 0, urgency: 'normal' };
  }
}

/**
 * Calculate preparation time between createdAt and servedAt
 */
function getPrepDuration(createdAt: string, servedAt?: string): string {
  if (!servedAt) return 'Quick';
  try {
    const start = new Date(createdAt).getTime();
    const end = new Date(servedAt).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return '< 1m';
    const mins = Math.round((end - start) / 60000);
    return mins <= 1 ? '1m' : `${mins}m`;
  } catch {
    return 'Done';
  }
}

export const KitchenScreen: React.FC = () => {
  const {
    kitchenTickets,
    updateKitchenTicketStatus,
    dishes,
    toggleDishAvailability,
    showToast,
  } = useRestaurant();

  // 2-Box Mobile View Switcher ('active' | 'completed')
  const [mobileBox, setMobileBox] = useState<'active' | 'completed'>('active');

  // Active Queue sub-filter ('all' | 'new' | 'preparing' | 'ready')
  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');

  // Order type filter ('all' | 'dining' | 'takeaway')
  const [typeFilter, setTypeFilter] = useState<'all' | 'dining' | 'takeaway'>('all');

  // Stock Out (86) modal state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Audio alerts toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Plated items check-off map (ticketId-itemIdx)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Real-time ticking second counter
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Track previous ticket count to play chime on new orders
  const prevCountRef = useRef(kitchenTickets.length);
  useEffect(() => {
    if (kitchenTickets.length > prevCountRef.current && soundEnabled) {
      playKitchenChime();
    }
    prevCountRef.current = kitchenTickets.length;
  }, [kitchenTickets.length, soundEnabled]);

  const outOfStockCount = dishes.filter((d) => !d.isAvailable).length;

  // Toggle individual item check-off
  const toggleItemCheck = (ticketId: string, idx: number) => {
    const key = `${ticketId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Separate into ACTIVE vs COMPLETED
  // FIFO SORTING: Earliest createdAt first = Priority #1!
  const allActiveTickets = useMemo(() => {
    return kitchenTickets
      .filter((t) => t.status !== 'served')
      .filter((t) => (typeFilter === 'all' ? true : t.orderType === typeFilter))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [kitchenTickets, typeFilter]);

  // Stage filtered active tickets
  const filteredActiveTickets = useMemo(() => {
    if (activeStageFilter === 'all') return allActiveTickets;
    return allActiveTickets.filter((t) => t.status === activeStageFilter);
  }, [allActiveTickets, activeStageFilter]);

  // COMPLETED TICKETS: Latest served first
  const completedTickets = useMemo(() => {
    return kitchenTickets
      .filter((t) => t.status === 'served')
      .filter((t) => (typeFilter === 'all' ? true : t.orderType === typeFilter))
      .sort((a, b) => new Date(b.servedAt || b.createdAt).getTime() - new Date(a.servedAt || a.createdAt).getTime());
  }, [kitchenTickets, typeFilter]);

  // Summary counts
  const newCount = allActiveTickets.filter((t) => t.status === 'new').length;
  const prepCount = allActiveTickets.filter((t) => t.status === 'preparing').length;
  const readyCount = allActiveTickets.filter((t) => t.status === 'ready').length;

  // Oldest active waiting time for header banner
  const oldestTicket = allActiveTickets[0];
  const oldestWaitMins = oldestTicket ? Math.floor((now - new Date(oldestTicket.createdAt).getTime()) / 60000) : 0;

  return (
    <div className="pb-24 w-full max-w-[1600px] mx-auto min-h-screen bg-[#F6F5F2] selection:bg-amber-500/20 selection:text-amber-900">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Station Title & Live Stats */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <ChefHat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] sm:text-[22px] font-black text-[#242424] tracking-tight">
                  Kitchen Display System (KDS)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[12px] flex items-center gap-1 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  {allActiveTickets.length} To Cook
                </span>
                {oldestWaitMins > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                      oldestWaitMins >= 15
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : oldestWaitMins >= 8
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Longest wait: {oldestWaitMins}m
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#737373] font-medium">
                Dual-Stage Streamlined Pipeline • Priority Sorted by First Placed (FIFO)
              </p>
            </div>
          </div>

          {/* Action Tools & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dining / Takeaway Filter */}
            <div className="flex bg-[#F0EFEA] p-1 rounded-2xl text-[12px] font-bold border border-[#E5E3DC]">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  typeFilter === 'all'
                    ? 'bg-[#242424] text-white shadow-xs'
                    : 'text-[#666] hover:text-[#242424]'
                }`}
              >
                All ({kitchenTickets.length})
              </button>
              <button
                onClick={() => setTypeFilter('dining')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  typeFilter === 'dining'
                    ? 'bg-[#C94B4B] text-white shadow-xs'
                    : 'text-[#666] hover:text-[#242424]'
                }`}
              >
                Dining ({kitchenTickets.filter((t) => t.orderType === 'dining').length})
              </button>
              <button
                onClick={() => setTypeFilter('takeaway')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  typeFilter === 'takeaway'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#666] hover:text-[#242424]'
                }`}
              >
                Takeaway ({kitchenTickets.filter((t) => t.orderType === 'takeaway').length})
              </button>
            </div>

            {/* Chime sound toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playKitchenChime();
              }}
              title={soundEnabled ? 'Kitchen chime enabled' : 'Kitchen chime muted'}
              className={`h-9 px-3 rounded-2xl text-[12px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-[#777] border-[#E8E6E3]'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-[#888]" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            {/* Quick 86 / Stock Out Management */}
            <button
              onClick={() => setIsStockModalOpen(true)}
              id="btn-kds-stock-out-manager"
              className={`h-9 px-3.5 rounded-2xl font-extrabold text-[12px] border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
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

        {/* Mobile / Tablet Segmented Switcher (Visible only below lg:) */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 lg:hidden">
          <button
            onClick={() => setMobileBox('active')}
            className={`py-2.5 px-3 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 border transition-all ${
              mobileBox === 'active'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                : 'bg-white text-[#555] border-[#E8E6E3]'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Active Queue ({allActiveTickets.length})</span>
          </button>
          <button
            onClick={() => setMobileBox('completed')}
            className={`py-2.5 px-3 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 border transition-all ${
              mobileBox === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                : 'bg-white text-[#555] border-[#E8E6E3]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed ({completedTickets.length})</span>
          </button>
        </div>
      </div>

      {/* Main 2-Box Responsive Workspace */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* BOX 1: ACTIVE COOKING QUEUE (Dominant 62% width on desktop)               */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 ${
              mobileBox === 'completed' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Box 1 Header Banner */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] sm:text-[18px] font-black text-[#242424] tracking-tight">
                      Active Kitchen Orders
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11.5px] font-extrabold">
                      {filteredActiveTickets.length} In Queue
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#737373]">
                    Orders sorted strictly by order placement time (First In = Highest Priority)
                  </p>
                </div>
              </div>

              {/* Sub-stage filter tabs within Active box */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveStageFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeStageFilter === 'all'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-[#F8F8F6] text-[#666] hover:bg-[#EFEFEA]'
                  }`}
                >
                  All Active ({allActiveTickets.length})
                </button>
                <button
                  onClick={() => setActiveStageFilter('new')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeStageFilter === 'new'
                      ? 'bg-[#C94B4B] text-white shadow-xs'
                      : 'bg-[#F8F8F6] text-[#666] hover:bg-[#EFEFEA]'
                  }`}
                >
                  New ({newCount})
                </button>
                <button
                  onClick={() => setActiveStageFilter('preparing')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeStageFilter === 'preparing'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#F8F8F6] text-[#666] hover:bg-[#EFEFEA]'
                  }`}
                >
                  Cooking ({prepCount})
                </button>
                <button
                  onClick={() => setActiveStageFilter('ready')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    activeStageFilter === 'ready'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#F8F8F6] text-[#666] hover:bg-[#EFEFEA]'
                  }`}
                >
                  Ready ({readyCount})
                </button>
              </div>
            </div>

            {/* Active Tickets List / Grid */}
            {filteredActiveTickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#DDD] space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-[18px] font-extrabold text-[#242424]">Kitchen Queue is Clear!</h3>
                <p className="text-[13px] text-[#737373] max-w-md mx-auto">
                  {activeStageFilter !== 'all'
                    ? `No tickets currently in "${activeStageFilter.toUpperCase()}" stage.`
                    : 'All dining tables and takeaway orders have been cooked and dispatched.'}
                </p>
                {activeStageFilter !== 'all' && (
                  <button
                    onClick={() => setActiveStageFilter('all')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#242424] text-white text-[12px] font-bold"
                  >
                    View All Active Tickets
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredActiveTickets.map((ticket) => {
                  // Find original index in FIFO sorted active tickets
                  const fifoIndex = allActiveTickets.findIndex((t) => t.id === ticket.id);
                  const priorityRank = fifoIndex + 1;
                  const isTopPriority = priorityRank === 1;
                  const isAddition = ticket.isAddition;
                  const elapsed = getElapsed(ticket.createdAt, now);

                  return (
                    <div
                      key={ticket.id}
                      id={`kds-active-card-${ticket.id}`}
                      className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                        isTopPriority
                          ? 'border-red-500 ring-3 ring-red-500/20 shadow-red-500/10'
                          : isAddition
                          ? 'border-amber-400 ring-2 ring-amber-400/25 bg-[#FFFEFC]'
                          : 'border-[#E8E6E3]'
                      }`}
                    >
                      {/* Top Priority Ribbon & Elapsed Time Banner */}
                      <div
                        className={`px-4 py-2.5 flex items-center justify-between text-[11.5px] font-black border-b ${
                          isTopPriority
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-600'
                            : priorityRank === 2
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-[#F8F8F6] text-[#444] border-[#EAE8E3]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Flame className={`w-3.5 h-3.5 ${isTopPriority ? 'animate-bounce text-amber-200' : ''}`} />
                          <span className="uppercase tracking-wider">
                            {isTopPriority ? '🔥 PRIORITY #1 • COOK FIRST' : `PRIORITY #${priorityRank}`}
                          </span>
                          {isAddition && (
                            <span className="ml-1 px-1.5 py-0.2 bg-black/30 text-white text-[9.5px] rounded-md font-bold uppercase">
                              Add-On #{ticket.batchNumber}
                            </span>
                          )}
                        </div>

                        {/* Live Ticking Wait Timer */}
                        <div
                          className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-lg ${
                            isTopPriority
                              ? 'bg-black/30 text-white font-black'
                              : elapsed.urgency === 'urgent'
                              ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                              : elapsed.urgency === 'warn'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{elapsed.text}</span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Order & Table Header */}
                          <div className="flex items-start justify-between pb-3 border-b border-[#F0EFEA]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-[#888] uppercase tracking-wider">
                                  {ticket.tableNumber ? 'FLOOR TABLE' : 'CUSTOMER'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                                    ticket.orderType === 'dining'
                                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                  {ticket.orderType}
                                </span>
                              </div>
                              <h3 className="text-[22px] sm:text-[24px] font-black text-[#C94B4B] tracking-tight leading-tight mt-0.5">
                                {ticket.tableNumber ? `TABLE ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
                              </h3>
                            </div>

                            <div className="text-right">
                              <span className="font-mono text-[12px] font-black text-[#242424] block">
                                {ticket.orderId}
                              </span>
                              <span className="text-[10.5px] text-[#888] font-mono block">
                                Placed at {formatTime(ticket.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* 3-Step Pipeline Status Stepper */}
                          <div className="py-2.5 flex items-center justify-between border-b border-[#F0EFEA] text-[10.5px] font-extrabold">
                            <div
                              className={`flex items-center gap-1 ${
                                ticket.status === 'new'
                                  ? 'text-red-700 font-black'
                                  : 'text-[#888]'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ticket.status === 'new' ? 'bg-red-600 animate-ping' : 'bg-emerald-500'
                                }`}
                              />
                              <span>1. New Ticket</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-[#BBB]" />
                            <div
                              className={`flex items-center gap-1 ${
                                ticket.status === 'preparing'
                                  ? 'text-amber-700 font-black'
                                  : ticket.status === 'ready'
                                  ? 'text-emerald-700'
                                  : 'text-[#BBB]'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ticket.status === 'preparing'
                                    ? 'bg-amber-500 animate-pulse'
                                    : ticket.status === 'ready'
                                    ? 'bg-emerald-500'
                                    : 'bg-[#CCC]'
                                }`}
                              />
                              <span>2. Cooking</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-[#BBB]" />
                            <div
                              className={`flex items-center gap-1 ${
                                ticket.status === 'ready' ? 'text-blue-700 font-black' : 'text-[#BBB]'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ticket.status === 'ready' ? 'bg-blue-600 animate-pulse' : 'bg-[#CCC]'
                                }`}
                              />
                              <span>3. Ready</span>
                            </div>
                          </div>

                          {/* Critical Food Items Checklist */}
                          <div className="py-3 space-y-2">
                            {isAddition && (
                              <div className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                                🔥 Cook only newly added items:
                              </div>
                            )}

                            <div className="space-y-1.5">
                              {ticket.items.map((it, idx) => {
                                const checkKey = `${ticket.id}-${idx}`;
                                const isChecked = Boolean(checkedItems[checkKey]);

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => toggleItemCheck(ticket.id, idx)}
                                    role="button"
                                    tabIndex={0}
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 opacity-80'
                                        : 'bg-[#FAF9F7] border-[#E8E6E3] hover:bg-[#F2F1EC]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {/* Interactive Checkbox */}
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                                      ) : (
                                        <Square className="w-4 h-4 text-[#AAA] shrink-0" />
                                      )}

                                      {/* Veg / Non-Veg Indicator */}
                                      <span
                                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                                          it.isVeg ? 'border-emerald-600' : 'border-red-600'
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            it.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                                          }`}
                                        />
                                      </span>

                                      <div className="min-w-0">
                                        <span
                                          className={`text-[13.5px] font-extrabold truncate block ${
                                            isChecked ? 'line-through text-[#666]' : 'text-[#242424]'
                                          }`}
                                        >
                                          {it.name}
                                        </span>
                                        {it.notes && (
                                          <span className="text-[10.5px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 inline-block mt-0.5">
                                            {it.notes}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Big Quantity Pill */}
                                    <span
                                      className={`text-[15px] font-black px-2.5 py-0.5 rounded-lg shrink-0 ${
                                        isChecked
                                          ? 'bg-emerald-200 text-emerald-900'
                                          : 'bg-[#FCE8E8] text-[#C94B4B]'
                                      }`}
                                    >
                                      ×{it.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Big Touch-Friendly Stage Bump Buttons */}
                        <div className="pt-3 border-t border-[#F0EFEA] flex flex-col gap-2">
                          {ticket.status === 'new' && (
                            <button
                              onClick={() => {
                                updateKitchenTicketStatus(ticket.id, 'preparing');
                                showToast(`🍳 Started cooking ${ticket.tableNumber ? 'Table ' + ticket.tableNumber : 'Takeaway'}`, 'info');
                              }}
                              id={`btn-kds-start-${ticket.id}`}
                              className="w-full h-13 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                            >
                              <CookingPot className="w-5 h-5 stroke-[2.5]" />
                              <span>START COOKING</span>
                            </button>
                          )}

                          {ticket.status === 'preparing' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  updateKitchenTicketStatus(ticket.id, 'ready');
                                  showToast(`⚡ Food Ready for ${ticket.tableNumber ? 'Table ' + ticket.tableNumber : 'Takeaway'}`, 'info');
                                }}
                                id={`btn-kds-ready-${ticket.id}`}
                                className="flex-1 h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-[14px] flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                              >
                                <PackageCheck className="w-5 h-5 stroke-[2.5]" />
                                <span>MARK AS READY</span>
                              </button>
                              <button
                                onClick={() => {
                                  updateKitchenTicketStatus(ticket.id, 'served');
                                  showToast(`✅ Completed & Served Table ${ticket.tableNumber || ''}`, 'success');
                                }}
                                title="Fast Complete & Serve"
                                className="h-13 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-[12px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Done</span>
                              </button>
                            </div>
                          )}

                          {ticket.status === 'ready' && (
                            <button
                              onClick={() => {
                                updateKitchenTicketStatus(ticket.id, 'served');
                                showToast(`✅ Completed & Served Table ${ticket.tableNumber || ''}`, 'success');
                              }}
                              id={`btn-kds-served-${ticket.id}`}
                              className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                              <span>MARK AS SERVED (COMPLETED)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BOX 2: COMPLETED & SERVED ORDERS (Spacious 38% width on desktop)          */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 ${
              mobileBox === 'active' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Box 2 Header Banner */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-black text-[#242424] tracking-tight">
                      Completed & Served
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      {completedTickets.length} Done
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#737373]">
                    Orders cooked, dispatched, and served to tables
                  </p>
                </div>
              </div>
            </div>

            {/* Completed Tickets List */}
            {completedTickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-[#DDD] space-y-2">
                <Clock className="w-8 h-8 text-[#BBB] mx-auto" />
                <h4 className="text-[15px] font-bold text-[#555]">No Completed Orders Yet</h4>
                <p className="text-[12px] text-[#888]">
                  When active kitchen orders are marked as served, they will appear here with preparation duration.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
                {completedTickets.map((ticket) => {
                  const prepDuration = getPrepDuration(ticket.createdAt, ticket.servedAt || ticket.readyAt);

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-2xl p-4 border border-[#E8E6E3] shadow-xs hover:border-emerald-300 transition-all space-y-2.5"
                    >
                      {/* Top Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <h4 className="text-[16px] font-black text-[#242424]">
                            {ticket.tableNumber ? `TABLE ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
                          </h4>
                          <span className="px-2 py-0.2 rounded-md bg-[#F0EFEA] text-[#666] text-[10px] font-bold uppercase">
                            {ticket.orderType}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ⏱️ Prep: {prepDuration}
                        </span>
                      </div>

                      {/* Items Summary */}
                      <div className="text-[12px] text-[#555] font-semibold bg-[#FAF9F7] p-2 rounded-xl space-y-1">
                        {ticket.items.map((it, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="truncate pr-2">
                              {it.name}
                            </span>
                            <span className="font-mono text-emerald-700 font-bold shrink-0">
                              ×{it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Completed Timestamp & Recall button */}
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-[#888] font-medium">
                          Done at {formatTime(ticket.servedAt || ticket.readyAt || ticket.createdAt)}
                        </span>

                        {/* Recall button in case chef clicked complete accidentally */}
                        <button
                          onClick={() => {
                            updateKitchenTicketStatus(ticket.id, 'preparing');
                            showToast(`↩️ Recalled ${ticket.tableNumber ? 'Table ' + ticket.tableNumber : 'Takeaway'} back to Kitchen`, 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#DDD] hover:bg-[#F0F0EE] text-[#555] font-bold text-[10.5px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>Recall</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                className="w-8 h-8 rounded-full bg-[#E8E6E3] hover:bg-[#DDD] text-[#555] flex items-center justify-center transition-colors cursor-pointer"
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
                        className={`h-9 px-3.5 rounded-xl text-[12px] font-extrabold border flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer ${
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
                className="px-4 py-2 rounded-xl bg-[#242424] text-white font-extrabold text-[12px] hover:bg-black transition-colors cursor-pointer"
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
