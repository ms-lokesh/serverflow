import React, { useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order } from '../types';
import { RESTAURANT_INFO } from '../data/mockData';

interface BillingScreenProps {
  order: Order;
  onBack: () => void;
  onProceedToPayment: (order: Order) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  order,
  onBack,
  onProceedToPayment,
}) => {
  const { requestBill, printReceipt, showToast, restaurantConfig } = useRestaurant();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const billNumber = order.billNumber || `BILL-${order.id.replace(/[^0-9]/g, '')}`;

  const handleRequestBill = () => {
    requestBill(order.id);
    setShowConfirmModal(false);
  };

  const activeGstRate = restaurantConfig.isGstEnabled ? restaurantConfig.gstPercent : 0;
  const halfRate = (activeGstRate / 2).toFixed(1);

  return (
    <div className="pb-32 max-w-4xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#242424] hover:text-[#C94B4B] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#C94B4B]" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <span className="text-[10.5px] font-bold text-[#737373] uppercase tracking-wider block leading-none">
            Bill & Invoicing
          </span>
          <span className="text-[17px] font-extrabold text-[#242424] leading-tight">
            {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
          </span>
        </div>

        <button
          onClick={() => printReceipt(order.id)}
          id="btn-print-bill-screen"
          className="w-9 h-9 rounded-full bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center text-[#555] hover:text-[#242424] hover:bg-white active:scale-95 transition-all"
          title="Print 80mm Receipt"
        >
          <Printer className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left 7 Cols / Full width on mobile: Bill Sheet Card */}
        <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E6E3] shadow-sm font-sans space-y-4">
          {/* Restaurant Header */}
          <div className="text-center pb-3.5 border-b border-[#F0EFEA]">
            <h2 className="text-[18px] font-extrabold text-[#242424] tracking-tight">
              {restaurantConfig.name}
            </h2>
            <p className="text-[12px] text-[#737373]">{restaurantConfig.address}</p>
            <p className="text-[11px] text-[#737373] mt-0.5">
              GSTIN: <strong className="text-[#333]">{restaurantConfig.gstin}</strong>
            </p>
          </div>

          {/* Meta details */}
          <div className="grid grid-cols-2 gap-2.5 text-[12px] text-[#555] bg-[#F8F8F6] p-3.5 rounded-2xl border border-[#E8E6E3]">
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">Bill No</span>
              <strong className="text-[#242424] font-mono text-[13px]">{billNumber}</strong>
            </div>
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">Order ID</span>
              <strong className="text-[#242424] font-mono text-[13px]">{order.id}</strong>
            </div>
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">
                {order.tableNumber ? 'Table' : 'Customer'}
              </span>
              <strong className="text-[#242424]">
                {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName || 'Takeaway'}
              </strong>
            </div>
            <div>
              <span className="text-[#888] block text-[10px] uppercase font-bold">Server</span>
              <strong className="text-[#242424]">{order.employeeName}</strong>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-[#737373] uppercase tracking-wider pb-2 border-b border-[#E8E6E3]">
              <span>Item Description</span>
              <span>Amount</span>
            </div>

            <div className="divide-y divide-[#F5F5F3] pt-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-[13.5px]">
                  <div>
                    <div className="font-bold text-[#242424]">{it.name}</div>
                    <div className="text-[12px] text-[#737373]">
                      ₹{it.price} × {it.quantity}
                    </div>
                  </div>
                  <span className="font-extrabold text-[#242424]">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tax & Financial Summary */}
          <div className="pt-3.5 border-t border-[#E8E6E3] space-y-2 text-[13px] text-[#555]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Amount</span>
              <span>₹{order.taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#666]">
              <span>CGST ({halfRate}%)</span>
              <span>₹{order.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#666]">
              <span>SGST ({halfRate}%)</span>
              <span>₹{order.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#444]">
              <span>GST Total ({activeGstRate.toFixed(1)}%)</span>
              <span>₹{order.totalGst.toFixed(2)}</span>
            </div>
            {order.roundOff !== 0 && (
              <div className="flex justify-between text-[#888]">
                <span>Round Off</span>
                <span>₹{order.roundOff > 0 ? `+${order.roundOff}` : order.roundOff}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-[#242424] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                  Grand Total
                </span>
                <span className="text-[26px] font-extrabold text-[#C94B4B] tracking-tight leading-tight">
                  ₹{order.grandTotal}
                </span>
              </div>
              <div className="text-right text-[12px] text-[#737373]">
                {order.items.reduce((s, it) => s + it.quantity, 0)} Items
              </div>
            </div>
          </div>

          {/* Payment Status badge */}
          {order.payment ? (
            <div className="p-3.5 bg-[#FFF9F5] rounded-2xl border border-amber-200 text-amber-900 text-[12.5px] flex items-center justify-between">
              <div>
                <span className="font-bold">Payment Status:</span>{' '}
                <span className="uppercase">{order.payment.status}</span> ({order.payment.method})
              </div>
              <span className="font-extrabold text-[14px]">₹{order.payment.amount}</span>
            </div>
          ) : (
            <div className="p-3.5 bg-[#F8F8F6] rounded-2xl border border-[#E8E6E3] text-[#737373] text-[12.5px] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C94B4B]" />
              <span>Bill generated. Ready for payment collection.</span>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Quick Actions & Status on Desktop */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-sm space-y-4">
            <h3 className="font-extrabold text-[15.5px] text-[#242424]">Billing Actions</h3>
            <p className="text-[12.5px] text-[#737373]">
              Finalize bill, print thermal receipt, or record payment.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => printReceipt(order.id)}
                className="w-full py-3.5 px-4 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#F8F8F6] active:scale-98 transition-all"
              >
                <Printer className="w-4.5 h-4.5 text-[#555]" />
                <span>Print 80mm Receipt</span>
              </button>

              {order.status === 'sent_to_kitchen' || order.status === 'preparing' || order.status === 'ready' || order.status === 'served' ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  id="btn-request-final-bill"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                >
                  <FileText className="w-4.5 h-4.5" />
                  <span>REQUEST BILL</span>
                </button>
              ) : (
                <button
                  onClick={() => onProceedToPayment(order)}
                  id="btn-collect-payment"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  <span>COLLECT PAYMENT (₹{order.grandTotal})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] p-3.5 shadow-lg max-w-md mx-auto">
        <div className="flex gap-2.5">
          <button
            onClick={() => printReceipt(order.id)}
            className="flex-1 py-3.5 px-3 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Printer className="w-4 h-4 text-[#555]" />
            <span>Print</span>
          </button>

          {order.status === 'sent_to_kitchen' || order.status === 'preparing' || order.status === 'ready' || order.status === 'served' ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              id="btn-request-final-bill-mobile"
              className="flex-[2] py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
            >
              <FileText className="w-4.5 h-4.5" />
              <span>REQUEST BILL</span>
            </button>
          ) : (
            <button
              onClick={() => onProceedToPayment(order)}
              id="btn-collect-payment-mobile"
              className="flex-[2] py-3.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
            >
              <CreditCard className="w-4.5 h-4.5" />
              <span>COLLECT (₹{order.grandTotal})</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Bottom Sheet for "Request Bill?" */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-[#E8E6E3] rounded-full mx-auto sm:hidden" />
            <div className="text-center">
              <h3 className="text-[18px] font-extrabold text-[#242424]">Request final bill?</h3>
              <p className="text-[12.5px] text-[#737373] mt-1">
                This will lock table items and print the final invoice for <strong>Table {order.tableNumber}</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#F8F8F6] rounded-2xl border border-[#E8E6E3] text-center">
              <span className="text-[11px] text-[#737373] uppercase font-bold block">Bill Total</span>
              <span className="text-[22px] font-extrabold text-[#C94B4B]">₹{order.grandTotal}</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-3 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13.5px] active:scale-98"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestBill}
                id="btn-confirm-request-bill"
                className="flex-1 py-3 px-3 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] shadow-md shadow-[#C94B4B]/30 active:scale-98"
              >
                Request Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
