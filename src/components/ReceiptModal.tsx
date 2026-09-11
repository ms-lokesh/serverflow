import React from 'react';
import { X, Printer, Check, Copy } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { RESTAURANT_INFO } from '../data/mockData';

export const ReceiptModal: React.FC = () => {
  const { receiptOrder, setReceiptOrder, showToast, restaurantConfig } = useRestaurant();

  if (!receiptOrder) return null;

  const handlePrint = () => {
    showToast('Receipt sent to printer.', 'success');
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const activeGstRate = restaurantConfig.isGstEnabled ? restaurantConfig.gstPercent : 0;
  const halfRate = (activeGstRate / 2).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#F8F8F6] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8E6E3]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E8E6E3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#C94B4B]" />
            <h3 className="font-extrabold text-[15px] text-[#242424]">Thermal Receipt Preview</h3>
          </div>
          <button
            onClick={() => setReceiptOrder(null)}
            className="w-8 h-8 rounded-full bg-[#F8F8F6] flex items-center justify-center text-[#737373] hover:text-[#242424] hover:bg-[#E8E6E3] active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body - Realistic Thermal Paper simulation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-[#F1EFEA]">
          <div className="w-full max-w-sm bg-white border border-[#DDD9D2] rounded-2xl p-6 shadow-sm font-mono text-[12px] text-[#222] leading-relaxed relative">
            {/* Perforation design top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#E8E6E3] to-transparent" />

            {/* Restaurant Header */}
            <div className="text-center pb-3.5 border-b border-dashed border-[#CCC]">
              <div className="text-[15px] font-bold tracking-tight text-[#111] uppercase">
                {restaurantConfig.name}
              </div>
              <div className="text-[10.5px] text-[#666] leading-tight mt-0.5">
                {restaurantConfig.address}
              </div>
              <div className="text-[10.5px] text-[#666] mt-0.5">
                Tel: {restaurantConfig.phone}
              </div>
              <div className="text-[10.5px] text-[#666]">
                GSTIN: <span className="font-semibold">{restaurantConfig.gstin}</span>
              </div>
            </div>

            {/* Bill & Order Details */}
            <div className="py-3 border-b border-dashed border-[#CCC] space-y-1 text-[11.5px]">
              <div className="flex justify-between">
                <span>Bill No: <strong className="text-[#000]">{receiptOrder.billNumber || `BILL-${receiptOrder.id.replace(/[^0-9]/g, '')}`}</strong></span>
                <span>Date: {todayStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Order: <strong className="text-[#000]">{receiptOrder.id}</strong></span>
                <span>Time: {receiptOrder.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {receiptOrder.tableNumber
                    ? `Table: ${receiptOrder.tableNumber}`
                    : `Takeaway: ${receiptOrder.customerName || 'Customer'}`}
                </span>
                <span>Server: {receiptOrder.employeeName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-[#CCC]">
              <div className="grid grid-cols-12 font-bold pb-1 text-[11px] text-[#333] border-b border-[#EEE]">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-2 text-right">RATE</span>
                <span className="col-span-2 text-right">AMT</span>
              </div>
              <div className="divide-y divide-[#F5F5F5] pt-1">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1.5 items-center">
                    <span className="col-span-6 truncate font-medium">{item.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right">₹{item.price}</span>
                    <span className="col-span-2 text-right font-semibold">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-3 space-y-1.5 text-[11.5px] border-b border-dashed border-[#CCC]">
              <div className="flex justify-between text-[#555]">
                <span>Item Subtotal ({receiptOrder.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{receiptOrder.subtotal.toFixed(2)}</span>
              </div>
              {receiptOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{receiptOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#555]">
                <span>Taxable Amount</span>
                <span>₹{receiptOrder.taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#555]">
                <span>CGST ({halfRate}%)</span>
                <span>₹{receiptOrder.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#555]">
                <span>SGST ({halfRate}%)</span>
                <span>₹{receiptOrder.sgst.toFixed(2)}</span>
              </div>
              {receiptOrder.roundOff !== 0 && (
                <div className="flex justify-between text-[#666]">
                  <span>Round Off</span>
                  <span>₹{receiptOrder.roundOff > 0 ? `+${receiptOrder.roundOff}` : receiptOrder.roundOff}</span>
                </div>
              )}
              <div className="flex justify-between text-[13.5px] font-bold text-[#000] pt-2 border-t border-[#333]">
                <span>GRAND TOTAL</span>
                <span className="text-[15px]">₹{receiptOrder.grandTotal}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="py-2.5 border-b border-dashed border-[#CCC] text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <strong className="uppercase">{receiptOrder.payment?.method || 'PENDING'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <strong className={receiptOrder.payment?.status === 'verified' ? 'text-emerald-700' : 'text-amber-700'}>
                  {receiptOrder.payment?.status === 'verified'
                    ? 'VERIFIED & PAID'
                    : receiptOrder.payment?.status === 'pending'
                    ? 'SUBMITTED (AWAITING VERIFICATION)'
                    : 'UNPAID'}
                </strong>
              </div>
              {receiptOrder.payment?.refNumber && (
                <div className="flex justify-between">
                  <span>Ref:</span>
                  <span>{receiptOrder.payment.refNumber}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10.5px] text-[#666] space-y-1">
              <div className="font-bold tracking-widest text-[#222]">*** THANK YOU - VISIT AGAIN ***</div>
              <div>ServeFlow POS Platform</div>
              <div className="text-[9.5px] text-[#888]">Reprint does not create duplicate accounting sale</div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-white border-t border-[#E8E6E3] flex gap-3">
          <button
            onClick={() => setReceiptOrder(null)}
            className="flex-1 py-3 px-4 rounded-2xl border border-[#E8E6E3] text-[#242424] font-bold text-[13.5px] hover:bg-[#F8F8F6] active:scale-98 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            id="btn-print-receipt-action"
            className="flex-[2] py-3 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 hover:bg-[#A83B3B] active:scale-98 shadow-md shadow-[#C94B4B]/30 transition-all"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>PRINT RECEIPT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
