import React from 'react';
import {
  ArrowLeft,
  Plus,
  Receipt,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  Printer,
  ChevronRight,
  Info,
  ChefHat,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, Table, TimelineEvent } from '../types';

interface TableDetailScreenProps {
  table: Table;
  onBack: () => void;
  onAddItems: (order: Order) => void;
  onViewBill: (order: Order) => void;
  onCollectPayment: (order: Order) => void;
  onReviewPayment: (order: Order) => void;
  onNavigateToKitchen?: () => void;
}

export const TableDetailScreen: React.FC<TableDetailScreenProps> = ({
  table,
  onBack,
  onAddItems,
  onViewBill,
  onCollectPayment,
  onReviewPayment,
  onNavigateToKitchen,
}) => {
  const { getOrderById, currentUser, printReceipt, tables, kitchenTickets } = useRestaurant();

  const liveTable = tables.find((t) => t.number === table.number) || table;
  const order = liveTable.currentOrderId ? getOrderById(liveTable.currentOrderId) : undefined;
  const ticket = kitchenTickets.find((k) => k.orderId === order?.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Available', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'occupied':
      case 'sent_to_kitchen':
        return { label: 'Sent to Kitchen', color: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' };
      case 'preparing':
        return { label: 'In Kitchen / Cooking', color: 'bg-orange-50 text-orange-900 border-orange-300 font-bold' };
      case 'ready':
        return { label: 'Food Ready to Serve', color: 'bg-blue-50 text-blue-900 border-blue-300 font-bold' };
      case 'served':
        return { label: 'Food Served', color: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold' };
      case 'bill_requested':
        return { label: 'Bill Requested', color: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' };
      case 'payment_submitted':
        return {
          label: 'Payment Pending',
          color: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4] font-bold',
        };
      case 'closed':
        return { label: 'Closed / Available', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: status, color: 'bg-gray-50 text-gray-800 border-gray-200' };
    }
  };

  const formatActivityTime = (iso?: string) => {
    if (!iso) return undefined;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getOrderTimeline = (ord: Order): TimelineEvent[] => {
    const stages = [
      { title: 'Order Created', key: 'created' },
      { title: 'Sent to Kitchen', key: 'sent_to_kitchen' },
      { title: 'Preparing in Kitchen', key: 'preparing' },
      { title: 'Food Ready', key: 'ready' },
      { title: 'Food Served', key: 'served' },
      { title: 'Bill Requested', key: 'bill_requested' },
      { title: 'Payment Submitted', key: 'payment_submitted' },
      { title: 'Payment Verified & Closed', key: 'closed' },
    ];

    const statusOrder: Record<string, number> = {
      created: 0,
      sent_to_kitchen: 1,
      preparing: 2,
      ready: 3,
      served: 4,
      bill_requested: 5,
      payment_submitted: 6,
      payment_verified: 7,
      closed: 7,
    };

    const currentIdx = statusOrder[ord.status] ?? 0;

    return stages.map((stage, idx) => {
      const isPast = idx < currentIdx;
      const isCurrent = idx === currentIdx;
      const isClosed = ord.status === 'closed' || ord.status === 'payment_verified';

      let time = 'Pending';
      if (idx === 0) {
        time = formatActivityTime(ord.createdAt) || 'Done';
      } else if (idx === 1) {
        time = formatActivityTime(ticket?.createdAt) || (isPast || isCurrent ? 'Sent' : 'Pending');
      } else if (idx === 2) {
        time = formatActivityTime(ticket?.acceptedAt) || (isPast || (isCurrent && isClosed) ? 'Done' : isCurrent ? 'Cooking' : 'Pending');
      } else if (idx === 3) {
        time = formatActivityTime(ticket?.readyAt) || (isPast || (isCurrent && isClosed) ? 'Done' : isCurrent ? 'Ready' : 'Pending');
      } else if (idx === 4) {
        time = formatActivityTime(ticket?.servedAt) || (isPast || (isCurrent && isClosed) ? 'Served' : isCurrent ? 'Serving' : 'Pending');
      } else if (idx === 5) {
        time = isPast || (isCurrent && isClosed) ? 'Billed' : isCurrent ? 'Requested' : 'Pending';
      } else if (idx === 6) {
        time = formatActivityTime(ord.payment?.submittedAt) || (isPast || (isCurrent && isClosed) ? 'Submitted' : isCurrent ? 'Pending Verification' : 'Pending');
      } else if (idx === 7) {
        time = formatActivityTime(ord.payment?.verifiedAt) || (isClosed ? 'Settled' : 'Pending');
      }

      return {
        id: `timeline-${stage.key}-${idx}`,
        title: stage.title,
        time,
        completed: isPast || (isCurrent && isClosed),
        current: isCurrent && !isClosed,
        subtitle:
          isCurrent && ord.status === 'payment_submitted'
            ? 'Waiting for Admin Verification'
            : isCurrent && ord.status === 'ready'
            ? 'Ready for Waiter to pick up'
            : isCurrent && ord.status === 'served'
            ? 'Customer enjoying food'
            : undefined,
      };
    });
  };

  const statusBadge = getStatusBadge(order?.status || table.status);

  return (
    <div className="pb-32 max-w-5xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#242424] hover:text-[#C94B4B] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#C94B4B]" />
          <span>Back to Tables</span>
        </button>

        <div className="text-center">
          <span className="text-[10.5px] font-bold text-[#737373] uppercase tracking-wider block leading-none">
            Dining Detail
          </span>
          <span className="text-[17px] font-extrabold text-[#242424] leading-tight">
            Table {table.number}
          </span>
        </div>

        <button
          onClick={() => order && printReceipt(order.id)}
          className="w-9 h-9 rounded-full bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center text-[#555] hover:text-[#242424] hover:bg-white active:scale-95 transition-all"
          title="Print Receipt"
        >
          <Printer className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Table Details & Ordered Items (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          {/* Table & Order Hero Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[22px] font-extrabold text-[#242424] tracking-tight">
                    Table {table.number}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#737373] mt-1">
                  <span>Order: <strong className="font-mono text-[#242424]">{order?.id || 'None'}</strong></span>
                  <span>•</span>
                  <span>Created: {order?.createdAt || table.updatedAt}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10.5px] font-bold text-[#737373] uppercase tracking-wider block">
                  Total Due
                </span>
                <span className="text-[24px] font-extrabold text-[#C94B4B] tracking-tight leading-none">
                  ₹{order ? order.grandTotal : table.currentTotal || 0}
                </span>
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="mt-3.5 pt-3.5 border-t border-[#F5F5F3] flex items-center justify-between text-[12.5px]">
              <div className="flex items-center gap-1.5 text-[#555]">
                <User className="w-4 h-4 text-[#C94B4B]" />
                <span>Server: <strong className="text-[#242424]">{order?.employeeName || table.activeEmployee || 'Unassigned'}</strong></span>
              </div>

              {order?.billNumber && (
                <span className="font-mono text-[11.5px] bg-[#F8F8F6] px-2.5 py-1 rounded-lg border border-[#E8E6E3] text-[#555]">
                  {order.billNumber}
                </span>
              )}
            </div>
          </div>

          {/* Payment Pending Status Alert Card */}
          {order?.status === 'payment_submitted' && order.payment && (
            <div className="bg-[#FFF9F5] border border-amber-300 rounded-3xl p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px] text-amber-950">Payment Submitted</h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold text-[11px]">
                      {order.payment.method}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-amber-900 mt-1">
                    Amount ₹{order.payment.amount} collected by <strong>{order.payment.employeeName}</strong> at {order.payment.submittedAt}.
                  </p>
                  <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11.5px] text-amber-900 flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Waiting for Admin verification to close table & finalize sales.</span>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => onReviewPayment(order)}
                      id="btn-admin-verify-trigger"
                      className="mt-3.5 w-full py-3 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-1.5 shadow-sm shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                    >
                      <span>Verify & Close Table</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ordered Items List */}
          {order ? (
            <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F5F5F3]">
                <h3 className="font-extrabold text-[15px] text-[#242424]">
                  Ordered Items ({order.items.reduce((s, it) => s + it.quantity, 0)})
                </h3>
                {order.batchesCount > 1 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                    {order.batchesCount} Batches Served
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#F5F5F3]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-600' : 'border-red-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[14px] text-[#242424]">{item.name}</span>
                          <span className="text-[12.5px] font-bold text-[#C94B4B]">×{item.quantity}</span>
                          {item.isAddition && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9.5px] font-bold">
                              +Add
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <span className="text-[11.5px] text-[#888] italic block">{item.notes}</span>
                        )}
                      </div>
                    </div>

                    <span className="font-extrabold text-[14px] text-[#242424]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="mt-3.5 pt-3.5 border-t border-[#E8E6E3] space-y-1.5 text-[12.5px] text-[#555]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Total</span>
                  <span>₹{order.totalGst.toFixed(2)}</span>
                </div>
                {order.roundOff !== 0 && (
                  <div className="flex justify-between text-[#777]">
                    <span>Round Off</span>
                    <span>₹{order.roundOff > 0 ? `+${order.roundOff}` : order.roundOff}</span>
                  </div>
                )}
                <div className="flex justify-between text-[16px] font-extrabold text-[#242424] pt-2 border-t border-[#E8E6E3]">
                  <span>Grand Total</span>
                  <span className="text-[#C94B4B]">₹{order.grandTotal}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-[#E8E6E3] text-center">
              <p className="text-[14px] font-bold text-[#242424]">No active order</p>
              <p className="text-[12px] text-[#737373] mt-1">This table is currently available for guest seating.</p>
            </div>
          )}
        </div>

        {/* Right Column: Desktop Action Panel & Order Timeline (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Desktop Quick Actions Card */}
          {order && (
            <div className="hidden md:block bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
              <h3 className="font-extrabold text-[15px] text-[#242424]">Table Management</h3>
              <p className="text-[12px] text-[#737373]">
                Manage orders, view generated tax bill, or collect payment.
              </p>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onAddItems(order)}
                  className="w-full py-3 px-4 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] text-[#242424] font-bold text-[13.5px] flex items-center justify-center gap-2 hover:border-[#C94B4B] hover:bg-white active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4 text-[#C94B4B]" />
                  <span>Add More Items</span>
                </button>

                <button
                  onClick={() => onViewBill(order)}
                  className="w-full py-3 px-4 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] text-[#242424] font-bold text-[13.5px] flex items-center justify-center gap-2 hover:border-[#C94B4B] hover:bg-white active:scale-98 transition-all"
                >
                  <Receipt className="w-4 h-4 text-[#555]" />
                  <span>View / Print Bill</span>
                </button>

                {onNavigateToKitchen && (
                  <button
                    onClick={onNavigateToKitchen}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-amber-100 hover:border-amber-300 active:scale-98 transition-all cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 text-amber-700" />
                    <span>View in Kitchen (KDS)</span>
                  </button>
                )}

                {order.status === 'payment_submitted' ? (
                  currentUser.role === 'admin' ? (
                    <button
                      onClick={() => onReviewPayment(order)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                    >
                      <ShieldCheck className="w-4.5 h-4.5" />
                      <span>Verify & Close Table (₹{order.grandTotal})</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[12.5px] text-center">
                      Awaiting Admin Verification
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => onCollectPayment(order)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    <span>Collect Payment (₹{order.grandTotal})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Vertical Order Timeline */}
          {order && (
            <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F5F5F3]">
                <h3 className="font-extrabold text-[14.5px] text-[#242424]">Order Timeline</h3>
                <span className="text-[11.5px] text-[#737373] font-mono">{order.id}</span>
              </div>

              <div className="relative pl-6 space-y-4">
                {/* Vertical timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[#E8E6E3]" />

                {getOrderTimeline(order).map((event, idx) => {
                  const isDone = event.completed;
                  const isCurrent = event.current;

                  return (
                    <div key={idx} className="relative flex items-start justify-between text-[12.5px]">
                      {/* Circle icon */}
                      <div
                        className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? 'bg-[#C94B4B] border-white text-white shadow-xs'
                            : isCurrent
                            ? 'bg-white border-[#C94B4B] text-[#C94B4B] animate-pulse'
                            : 'bg-white border-[#D1D0CB] text-[#BBB]'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>

                      <div className="min-w-0 pr-2">
                        <div
                          className={`font-bold leading-tight ${
                            isDone
                              ? 'text-[#242424]'
                              : isCurrent
                              ? 'text-[#C94B4B]'
                              : 'text-[#888]'
                          }`}
                        >
                          {event.title}
                        </div>
                        {event.subtitle && (
                          <div className="text-[11.5px] text-[#737373] mt-0.5">{event.subtitle}</div>
                        )}
                      </div>

                      <span
                        className={`font-mono text-[11.5px] shrink-0 ${
                          event.time !== 'Pending' ? 'text-[#444] font-semibold' : 'text-[#BBB]'
                        }`}
                      >
                        {event.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Bar on Mobile */}
      {order && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] p-3 shadow-lg max-w-md mx-auto">
          {order.status === 'payment_submitted' ? (
            currentUser.role === 'admin' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onViewBill(order)}
                  className="flex-1 py-3 px-3 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Bill</span>
                </button>
                <button
                  onClick={() => onReviewPayment(order)}
                  id="btn-admin-verify-bottom"
                  className="flex-[2] py-3 px-4 rounded-2xl bg-[#C94B4B] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Verify & Close (₹{order.grandTotal})</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onViewBill(order)}
                  className="flex-1 py-3 px-3 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Bill</span>
                </button>
                <div className="flex-[2] py-3 px-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[12px] flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                  <span>Awaiting Admin Verification</span>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onAddItems(order)}
                id="btn-add-items-trigger"
                className="py-3 px-2 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] text-[#242424] font-bold text-[12.5px] flex items-center justify-center gap-1 hover:border-[#C94B4B] active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#C94B4B]" />
                <span>Add Items</span>
              </button>

              <button
                onClick={() => onViewBill(order)}
                id="btn-view-bill-trigger"
                className="py-3 px-2 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] text-[#242424] font-bold text-[12.5px] flex items-center justify-center gap-1 hover:border-[#C94B4B] active:scale-95"
              >
                <Receipt className="w-4 h-4 text-[#555]" />
                <span>View Bill</span>
              </button>

              <button
                onClick={() => onCollectPayment(order)}
                id="btn-collect-payment-trigger"
                className="py-3 px-2 rounded-2xl bg-[#C94B4B] text-white font-bold text-[12.5px] flex items-center justify-center gap-1 shadow-sm shadow-[#C94B4B]/30 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{order.grandTotal}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
