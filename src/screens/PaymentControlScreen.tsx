import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  AlertTriangle,
  Receipt,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, PaymentMethod } from '../types';

interface PaymentControlScreenProps {
  onViewBill: (order: Order) => void;
  selectedOrderForReview?: Order | null;
  onClearSelectedOrder?: () => void;
}

export const PaymentControlScreen: React.FC<PaymentControlScreenProps> = ({
  onViewBill,
  selectedOrderForReview,
  onClearSelectedOrder,
}) => {
  const { orders, verifyPayment, rejectPayment, printReceipt } = useRestaurant();
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Cash amount mismatch / Fake currency note');

  // Filter orders that have submitted payments waiting for verification
  const pendingPaymentOrders = orders.filter(
    (o) => o.status === 'payment_submitted' && o.payment?.status === 'pending'
  );

  const filteredOrders = pendingPaymentOrders.filter((o) => {
    if (methodFilter === 'ALL') return true;
    return o.payment?.method === methodFilter;
  });

  const totalPendingAmount = pendingPaymentOrders.reduce(
    (sum, o) => sum + (o.payment?.amount || o.grandTotal),
    0
  );
  const cashPending = pendingPaymentOrders
    .filter((o) => o.payment?.method === 'CASH')
    .reduce((sum, o) => sum + (o.payment?.amount || o.grandTotal), 0);
  const upiPending = pendingPaymentOrders
    .filter((o) => o.payment?.method === 'UPI')
    .reduce((sum, o) => sum + (o.payment?.amount || o.grandTotal), 0);
  const cardPending = pendingPaymentOrders
    .filter((o) => o.payment?.method === 'CARD')
    .reduce((sum, o) => sum + (o.payment?.amount || o.grandTotal), 0);

  const handleVerify = (orderId: string) => {
    verifyPayment(orderId);
    if (onClearSelectedOrder) onClearSelectedOrder();
  };

  const handleConfirmReject = () => {
    if (!rejectingOrderId) return;
    rejectPayment(rejectingOrderId, rejectReason);
    setRejectingOrderId(null);
    setRejectReason('Cash amount mismatch / Fake currency note');
    if (onClearSelectedOrder) onClearSelectedOrder();
  };

  return (
    <div className="pb-28 max-w-md lg:max-w-5xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-3.5 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FCE8E8] text-[#A83B3B] flex items-center justify-center font-bold border border-[#F4B4B4]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-[#242424] tracking-tight leading-tight">
                Payment Verification
              </h2>
              <span className="text-[11px] text-[#737373]">
                Admin Revenue Governance
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px]">
            {pendingPaymentOrders.length} Pending
          </span>
        </div>

        {/* Method Filter Tabs */}
        <div className="flex gap-1.5 mt-3 text-[11.5px] font-bold">
          <button
            onClick={() => setMethodFilter('ALL')}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              methodFilter === 'ALL'
                ? 'bg-[#242424] text-white border-[#242424]'
                : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
            }`}
          >
            All ({pendingPaymentOrders.length})
          </button>
          <button
            onClick={() => setMethodFilter('CASH')}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              methodFilter === 'CASH'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-[#F8F8F6] text-emerald-800 border-emerald-200'
            }`}
          >
            Cash (₹{cashPending})
          </button>
          <button
            onClick={() => setMethodFilter('UPI')}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              methodFilter === 'UPI'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-[#F8F8F6] text-blue-800 border-blue-200'
            }`}
          >
            UPI (₹{upiPending})
          </button>
          <button
            onClick={() => setMethodFilter('CARD')}
            className={`flex-1 py-1.5 rounded-xl border transition-all ${
              methodFilter === 'CARD'
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-[#F8F8F6] text-purple-800 border-purple-200'
            }`}
          >
            Card (₹{cardPending})
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Verification Summary Card */}
        <div className="bg-gradient-to-br from-white to-[#FFF9F5] rounded-3xl p-4 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Total Unverified Collections
              </span>
              <div className="text-[26px] font-extrabold text-amber-950 tracking-tight leading-none mt-0.5">
                ₹{totalPendingAmount.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#737373] block">Safety Policy</span>
              <span className="text-[11px] font-bold text-emerald-700">Strict Single Table Freeing</span>
            </div>
          </div>
          <p className="text-[11.5px] text-[#666] mt-2 pt-2 border-t border-amber-200/60">
            Confirm physical cash received in drawer or verified bank transaction. Approving frees the dining table for guest seating.
          </p>
        </div>

        {/* Verification Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-[#E8E6E3] text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-extrabold text-[15px] text-[#242424]">
              All Collections Verified!
            </h3>
            <p className="text-[12px] text-[#737373]">
              No outstanding payment submissions require administrative review.
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const pay = ord.payment;
            const isTarget = selectedOrderForReview?.id === ord.id;

            return (
              <div
                key={ord.id}
                id={`verify-card-${ord.id}`}
                className={`bg-white rounded-3xl p-4 border shadow-sm space-y-3 transition-all ${
                  isTarget ? 'border-[#C94B4B] ring-2 ring-[#C94B4B]/30' : 'border-[#E8E6E3]'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FCE8E8] text-[#A83B3B] font-extrabold flex flex-col items-center justify-center border border-[#F4B4B4] shrink-0">
                      <span className="text-[9px] uppercase leading-none">Table</span>
                      <span className="text-[17px] leading-tight font-extrabold">
                        {ord.tableNumber || 'TK'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[19px] font-extrabold text-[#242424]">
                          ₹{pay?.amount || ord.grandTotal}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold text-[10.5px] uppercase ${
                            pay?.method === 'CASH'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : pay?.method === 'UPI'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {pay?.method || 'CASH'}
                        </span>
                      </div>

                      <div className="text-[11.5px] text-[#737373] flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-[#555]" />
                        <span>
                          Staff: <strong className="text-[#333]">{pay?.employeeName || ord.employeeName}</strong>
                        </span>
                        <span>•</span>
                        <span>{pay?.submittedAt || ord.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-[#888]">
                    {ord.id}
                  </span>
                </div>

                {/* Additional Reference Details (Change / UPI UTR) */}
                {pay?.method === 'CASH' && pay.receivedAmount && (
                  <div className="p-2.5 bg-[#F8F8F6] rounded-2xl text-[12px] flex items-center justify-between text-[#555]">
                    <span>
                      Received: <strong className="text-[#242424]">₹{pay.receivedAmount}</strong>
                    </span>
                    <span>
                      Change Returned: <strong className="text-emerald-700">₹{pay.changeAmount || 0}</strong>
                    </span>
                  </div>
                )}

                {pay?.referenceNumber && (
                  <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-xl text-[11.5px] font-mono text-blue-900 flex items-center justify-between">
                    <span>Reference / UTR:</span>
                    <strong>{pay.referenceNumber}</strong>
                  </div>
                )}

                {/* Items Quick Summary */}
                <div className="py-2 border-t border-[#F5F5F3] text-[12px] text-[#666]">
                  <span className="font-semibold text-[#333] block mb-1">
                    Items ({ord.items.reduce((s, it) => s + it.quantity, 0)}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ord.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#F8F8F6] border border-[#E8E6E3] rounded-lg text-[11px]"
                      >
                        {it.name} ×{it.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verification Action Buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setRejectingOrderId(ord.id)}
                    id={`btn-reject-${ord.id}`}
                    className="flex-1 py-3 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 font-extrabold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleVerify(ord.id)}
                    id={`btn-verify-close-${ord.id}`}
                    className="flex-[2] py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>Verify & Close Table</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Payment Bottom Sheet Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-[#E8E6E3] rounded-full mx-auto" />
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#242424]">Reject Payment Submission</h3>
              <p className="text-[12.5px] text-[#737373] mt-1">
                Order status will revert to <strong>Bill Requested</strong> and table will remain occupied for re-collection.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider">
                Select Rejection Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
              >
                <option value="Cash amount mismatch / Fake currency note">Cash amount mismatch</option>
                <option value="UPI transaction not credited in bank">UPI transaction not credited</option>
                <option value="Card terminal payment failed / declined">Card terminal declined</option>
                <option value="Customer left without completing payment">Customer left without paying</option>
                <option value="Other cashier error">Other cashier error</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="flex-1 py-3 px-3 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13.5px] active:scale-98"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                id="btn-confirm-reject-action"
                className="flex-1 py-3 px-3 rounded-2xl bg-red-600 text-white font-extrabold text-[13.5px] shadow-md shadow-red-600/30 active:scale-98"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
