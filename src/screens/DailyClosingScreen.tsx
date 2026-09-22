import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  DollarSign,
  Banknote,
  QrCode,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface DailyClosingScreenProps {
  onBack: () => void;
}

export const DailyClosingScreen: React.FC<DailyClosingScreenProps> = ({ onBack }) => {
  const { summary, showToast, currentUser } = useRestaurant();
  const [openingCash, setOpeningCash] = useState<number>(2000);
  const [pettyCashExpenses, setPettyCashExpenses] = useState<number>(1200);
  const [countedCash, setCountedCash] = useState<string>('23200');
  const [isClosed, setIsClosed] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'admin';

  const expectedCash = openingCash + summary.cashSales - pettyCashExpenses;
  const counted = parseFloat(countedCash) || 0;
  const cashDifference = counted - expectedCash;

  const handleExecuteClosing = () => {
    if (!isAdmin) {
      showToast('Only Admin can close the register', 'error');
      return;
    }
    setIsClosed(true);
    showToast('Daily Register closed and Z-Report recorded successfully!', 'success');
  };

  return (
    <div className="pb-36 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-5 py-4 shadow-xs mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#242424] hover:text-[#C94B4B] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#C94B4B]" />
          <span>Back to Analytics</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block leading-none">
            End of Day
          </span>
          <span className="text-[18px] font-extrabold text-[#242424] leading-tight">
            Daily Register Closing & Z-Audit
          </span>
        </div>

        <div className="w-24 text-right">
          <span className="text-[11px] font-extrabold text-[#C94B4B] bg-[#FCE8E8] px-2.5 py-1 rounded-xl border border-[#F4B4B4]">
            Admin Only
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-5">
        {isClosed ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-300 shadow-sm text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h3 className="text-[22px] font-extrabold text-[#242424]">Register Closed & Verified</h3>
            <p className="text-[13.5px] text-[#737373] max-w-md mx-auto">
              Daily shift totals audited and committed. Today's Z-Report generated and synced with local memory.
            </p>

            <div className="p-5 bg-[#F8F8F6] rounded-2xl border border-[#E8E6E3] text-left space-y-2.5 text-[13.5px] max-w-md mx-auto">
              <div className="flex justify-between">
                <span>Total Confirmed Sales</span>
                <strong className="text-[#242424]">₹{(summary?.todaySales ?? 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Orders Verified</span>
                <strong>{summary?.totalOrders ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total GST Collected</span>
                <strong>₹{(summary?.totalGst ?? 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-2 border-t border-[#E8E6E3]">
                <span>Physical Cash Reconciled</span>
                <span>₹{(counted ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => showToast('Printed Daily Z-Report', 'info')}
              className="py-3.5 px-8 rounded-2xl bg-[#242424] text-white font-extrabold text-[14px] inline-flex items-center justify-center gap-2 hover:bg-[#333] transition-all"
            >
              <Printer className="w-4.5 h-4.5" />
              <span>Print Z-Report</span>
            </button>
          </div>
        ) : (
          <>
            {/* Sales Overview Banner */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-[#737373] uppercase tracking-wider">
                  Today's Confirmed Revenue
                </span>
                <span className="text-[11.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {summary?.totalOrders ?? 0} Orders Verified
                </span>
              </div>

              <div className="text-[32px] font-extrabold text-[#242424]">
                ₹{(summary?.todaySales ?? 0).toLocaleString('en-IN')}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F5F5F3] text-[13px]">
                <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                  <span className="text-[11px] text-[#737373] block">Cash Total</span>
                  <strong className="text-[#242424] text-[15px]">₹{(summary?.cashSales ?? 0).toLocaleString()}</strong>
                </div>
                <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                  <span className="text-[11px] text-[#737373] block">UPI Total</span>
                  <strong className="text-[#242424] text-[15px]">₹{(summary?.upiSales ?? 0).toLocaleString()}</strong>
                </div>
                <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                  <span className="text-[11px] text-[#737373] block">Card Total</span>
                  <strong className="text-[#242424] text-[15px]">₹{(summary?.cardSales ?? 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-[16px] text-[#242424]">Cash Drawer Reconciliation</h3>
              </div>

              <div className="space-y-3 text-[13.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#555]">Opening Float (Morning)</span>
                  <span className="font-semibold text-[#242424]">₹{openingCash}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#555]">(+) Cash Collections</span>
                  <span className="font-semibold text-emerald-700">+₹{summary.cashSales}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#555]">(-) Petty Cash Expenses</span>
                  <span className="font-semibold text-red-600">-₹{pettyCashExpenses}</span>
                </div>

                <div className="pt-2 border-t border-[#E8E6E3] flex items-center justify-between font-bold text-[15px]">
                  <span className="text-[#242424]">Expected Drawer Cash</span>
                  <span className="text-[#C94B4B]">₹{expectedCash.toLocaleString()}</span>
                </div>
              </div>

              {/* Physical Cash Count input */}
              <div className="pt-3 border-t border-[#F0EFEA] space-y-2">
                <label className="block text-[12px] font-bold text-[#555] uppercase tracking-wider">
                  Counted Physical Cash in Drawer
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#737373] text-[16px]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] text-[17px] font-extrabold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                    placeholder="Enter counted amount"
                  />
                </div>
              </div>

              {/* Difference badge */}
              <div
                className={`p-4 rounded-2xl text-[13px] font-bold flex items-center justify-between ${
                  cashDifference === 0
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border border-amber-300'
                }`}
              >
                <span>Reconciliation Difference:</span>
                <span className="text-[14.5px]">
                  {cashDifference === 0
                    ? '✓ ₹0 (Perfect Match)'
                    : cashDifference > 0
                    ? `+₹${cashDifference} (Surplus)`
                    : `-₹${Math.abs(cashDifference)} (Shortage)`}
                </span>
              </div>
            </div>

            {/* Electronic Settlement summary */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E6E3] shadow-xs space-y-3 text-[13.5px]">
              <h4 className="font-extrabold text-[#242424]">Electronic Batch Settlement</h4>
              <div className="flex justify-between text-[#555]">
                <span>UPI Bank Settlements (Automated)</span>
                <strong className="text-blue-800">₹{(summary?.upiSales ?? 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-[#555]">
                <span>Card EDC Batch Close</span>
                <strong className="text-purple-800">₹{(summary?.cardSales ?? 0).toLocaleString()}</strong>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleExecuteClosing}
              disabled={!isAdmin}
              id="btn-confirm-close-day"
              className={`w-full py-4 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-md transition-all ${
                isAdmin
                  ? 'bg-[#C94B4B] text-white shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>{isAdmin ? 'CLOSE REGISTER & GENERATE Z-REPORT' : 'ADMIN LOGIN REQUIRED TO CLOSE REGISTER'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
