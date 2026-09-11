import React, { useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, PaymentMethod } from '../types';
import { RESTAURANT_INFO } from '../data/mockData';

interface PaymentCollectionScreenProps {
  order: Order;
  onBack: () => void;
  onPaymentSubmitted: () => void;
}

export const PaymentCollectionScreen: React.FC<PaymentCollectionScreenProps> = ({
  order,
  onBack,
  onPaymentSubmitted,
}) => {
  const { submitPayment, currentUser } = useRestaurant();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');

  // Cash state
  const [receivedAmount, setReceivedAmount] = useState<string>(order.grandTotal.toString());

  // UPI / Card state
  const [refNumber, setRefNumber] = useState<string>('');

  // Post-submit confirmation screen
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<{
    method: PaymentMethod;
    amount: number;
    change: number;
    employee: string;
  } | null>(null);

  const parsedReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, parsedReceived - order.grandTotal);

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setReceivedAmount('');
    } else if (val === 'BACK') {
      setReceivedAmount((prev) => prev.slice(0, -1));
    } else {
      setReceivedAmount((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const handleSetQuickCash = (amount: number) => {
    setReceivedAmount(amount.toString());
  };

  const handleSubmitPayment = () => {
    if (selectedMethod === 'CASH' && parsedReceived < order.grandTotal) {
      alert('Received amount cannot be less than Grand Total');
      return;
    }

    const finalRef =
      refNumber.trim() ||
      (selectedMethod === 'UPI'
        ? `UPI/${Date.now().toString().slice(-8)}`
        : selectedMethod === 'CARD'
        ? `CARD/${Date.now().toString().slice(-6)}`
        : undefined);

    submitPayment(
      order.id,
      selectedMethod,
      order.grandTotal,
      parsedReceived || order.grandTotal,
      changeAmount,
      finalRef
    );

    setSubmittedData({
      method: selectedMethod,
      amount: order.grandTotal,
      change: changeAmount,
      employee: currentUser.name,
    });

    setIsSubmitted(true);
  };

  // Post Submission Success Screen
  if (isSubmitted && submittedData) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] p-4 max-w-md lg:max-w-2xl mx-auto flex flex-col justify-between pb-8">
        <div className="pt-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm animate-in zoom-in-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-block">
            Payment Submitted
          </span>

          <h2 className="text-[24px] font-extrabold text-[#242424] tracking-tight">
            ₹{submittedData.amount}
          </h2>

          <p className="text-[13px] text-[#737373] max-w-xs mx-auto">
            Payment reported by <strong>{submittedData.employee}</strong> via{' '}
            <strong>{submittedData.method}</strong>.
          </p>
        </div>

        {/* Status Card & Rules Reminder */}
        <div className="my-auto py-4 space-y-3">
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[13px] pb-2 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">Order ID</span>
              <strong className="font-mono text-[#242424]">{order.id}</strong>
            </div>

            <div className="flex items-center justify-between text-[13px] pb-2 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">
                {order.tableNumber ? 'Table Number' : 'Takeaway'}
              </span>
              <strong className="text-[#242424]">
                {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
              </strong>
            </div>

            <div className="flex items-center justify-between text-[13px] pb-2 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">Payment Method</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F8F8F6] font-bold text-[#242424] border border-[#E8E6E3]">
                {submittedData.method}
              </span>
            </div>

            {submittedData.method === 'CASH' && (
              <div className="flex items-center justify-between text-[13px] pb-2 border-b border-[#F5F5F3]">
                <span className="text-[#737373]">Customer Change</span>
                <strong className="text-emerald-700 font-extrabold text-[15px]">
                  ₹{submittedData.change}
                </strong>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Status: Waiting for Admin Verification</strong>
                <p className="mt-0.5 text-[#666]">
                  Table remains open in system until the restaurant administrator approves this collection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onPaymentSubmitted}
          id="btn-payment-done-return"
          className="w-full py-4 rounded-2xl bg-[#242424] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-98 shadow-md"
        >
          <span>Done & Return to Tables</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-md lg:max-w-5xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-3.5 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-bold text-[#242424] active:scale-95"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-[#C94B4B]" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block leading-none">
            Collect Payment
          </span>
          <span className="text-[16px] font-extrabold text-[#242424] leading-tight">
            {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
          </span>
        </div>

        <div className="w-8" />
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Amount Due Header Card */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs text-center">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Amount Due
          </span>
          <div className="text-[32px] font-extrabold text-[#C94B4B] tracking-tight leading-tight mt-0.5">
            ₹{order.grandTotal}
          </div>
          <div className="text-[11.5px] text-[#737373] mt-1 font-mono">
            {order.id} • Server: {currentUser.name}
          </div>
        </div>

        {/* Large Payment Method Selector Cards */}
        <div>
          <label className="block text-[11.5px] font-bold text-[#737373] uppercase tracking-wider mb-2 px-1">
            Select Payment Method
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {/* CASH */}
            <button
              type="button"
              onClick={() => setSelectedMethod('CASH')}
              id="btn-method-cash"
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[85px] ${
                selectedMethod === 'CASH'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-[#E8E6E3] text-[#555] hover:bg-[#F8F8F6]'
              }`}
            >
              <Banknote className="w-6 h-6 text-emerald-700" />
              <span className="font-extrabold text-[13px]">CASH</span>
            </button>

            {/* UPI */}
            <button
              type="button"
              onClick={() => setSelectedMethod('UPI')}
              id="btn-method-upi"
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[85px] ${
                selectedMethod === 'UPI'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-[#E8E6E3] text-[#555] hover:bg-[#F8F8F6]'
              }`}
            >
              <QrCode className="w-6 h-6 text-blue-700" />
              <span className="font-extrabold text-[13px]">UPI / QR</span>
            </button>

            {/* CARD */}
            <button
              type="button"
              onClick={() => setSelectedMethod('CARD')}
              id="btn-method-card"
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[85px] ${
                selectedMethod === 'CARD'
                  ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white border-[#E8E6E3] text-[#555] hover:bg-[#F8F8F6]'
              }`}
            >
              <CreditCard className="w-6 h-6 text-purple-700" />
              <span className="font-extrabold text-[13px]">CARD</span>
            </button>
          </div>
        </div>

        {/* Mode Specific Flow: CASH */}
        {selectedMethod === 'CASH' && (
          <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-bold text-[#555] uppercase tracking-wider">
                  Amount Received
                </span>
                <span className="text-[12px] font-semibold text-[#737373]">
                  Min: ₹{order.grandTotal}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-extrabold text-[#737373]">
                  ₹
                </span>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] text-[20px] font-extrabold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white text-right"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quick Denomination Chips */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSetQuickCash(order.grandTotal)}
                className="flex-1 py-2 px-1 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[11.5px] font-bold text-[#242424] hover:border-[#C94B4B] active:scale-95"
              >
                Exact (₹{order.grandTotal})
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickCash(Math.ceil(order.grandTotal / 500) * 500 || 500)}
                className="flex-1 py-2 px-1 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[11.5px] font-bold text-[#242424] hover:border-[#C94B4B] active:scale-95"
              >
                ₹{Math.ceil(order.grandTotal / 500) * 500 || 500}
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickCash(Math.ceil(order.grandTotal / 1000) * 1000 || 1000)}
                className="flex-1 py-2 px-1 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[11.5px] font-bold text-[#242424] hover:border-[#C94B4B] active:scale-95"
              >
                ₹{Math.ceil(order.grandTotal / 1000) * 1000 || 1000}
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickCash(2000)}
                className="flex-1 py-2 px-1 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[11.5px] font-bold text-[#242424] hover:border-[#C94B4B] active:scale-95"
              >
                ₹2000
              </button>
            </div>

            {/* Change Calculation Display */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Change to Return
                </span>
                <span className="text-[20px] font-extrabold text-emerald-900">
                  ₹{changeAmount}
                </span>
              </div>
              <Banknote className="w-7 h-7 text-emerald-600" />
            </div>

            {/* Mobile Touch Keypad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`h-11 rounded-xl font-extrabold text-[15px] border active:scale-95 transition-all flex items-center justify-center ${
                    key === 'CLEAR'
                      ? 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4] text-[12px]'
                      : key === 'BACK'
                      ? 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3] text-[12px]'
                      : 'bg-white text-[#242424] border-[#E8E6E3] hover:bg-[#F8F8F6]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Specific Flow: UPI */}
        {selectedMethod === 'UPI' && (
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs text-center space-y-4">
            <div>
              <span className="text-[12px] font-bold text-[#737373] uppercase tracking-wider">
                Restaurant Dynamic UPI QR
              </span>
              <p className="text-[12.5px] text-[#555] mt-0.5">
                Ask customer to scan with GPay, PhonePe, or Paytm
              </p>
            </div>

            {/* Dynamic QR Code Simulation Box */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-blue-500/40 shadow-sm flex flex-col items-center justify-center relative">
              <div className="w-full h-full bg-[#FAFAFA] border border-[#DDD] rounded-xl flex flex-col items-center justify-center p-2">
                <QrCode className="w-24 h-24 text-blue-900" />
                <span className="font-extrabold text-[13px] text-[#242424] mt-1">
                  ₹{order.grandTotal}
                </span>
                <span className="text-[9px] font-mono text-[#777]">{RESTAURANT_INFO.upiId}</span>
              </div>
            </div>

            <div className="text-left space-y-1.5">
              <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider">
                UPI Reference / UTR Number (Optional)
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. 423901928392"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
              />
            </div>
          </div>
        )}

        {/* Mode Specific Flow: CARD */}
        {selectedMethod === 'CARD' && (
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto border border-purple-200 mb-2">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[15px] text-[#242424]">POS Card Terminal</h3>
              <p className="text-[12px] text-[#737373]">
                Swipe/Tap card on EDC machine for <strong>₹{order.grandTotal}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider">
                POS Transaction / Approval Code
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. APPR-9921"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
              />
            </div>
          </div>
        )}

        {/* Notice of Table Closure Rule */}
        <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-amber-200 text-[11.5px] text-amber-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Submitting marks payment as pending. <strong>Table is closed only after Admin verifies.</strong>
          </span>
        </div>
      </div>

      {/* Sticky Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] p-3.5 shadow-lg max-w-md mx-auto">
        <button
          onClick={handleSubmitPayment}
          id="btn-submit-payment-action"
          className="w-full py-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
        >
          <span>SUBMIT PAYMENT (₹{order.grandTotal})</span>
        </button>
      </div>
    </div>
  );
};
