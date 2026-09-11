import React, { useState } from 'react';
import {
  User,
  LogOut,
  Building2,
  Printer,
  RotateCcw,
  ShieldCheck,
  Phone,
  QrCode,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Percent,
  Edit2,
  Check,
  Shield,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';

interface ProfileScreenProps {
  onNavigateToClosing?: () => void;
  onNavigateToMenu?: () => void;
  onNavigateToStaff?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToClosing,
  onNavigateToMenu,
  onNavigateToStaff,
}) => {
  const {
    currentUser,
    logout,
    login,
    resetMockData,
    restaurantConfig,
    updateGstPercent,
    updateRestaurantConfig,
    showToast,
  } = useRestaurant();

  const isAdmin = currentUser.role === 'admin';

  // Tax editing states
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [taxPercentInput, setTaxPercentInput] = useState(restaurantConfig.gstPercent.toString());
  const [gstinInput, setGstinInput] = useState(restaurantConfig.gstin);

  const handleRoleSwitch = (name: string, role: Role) => {
    login(name, role);
    showToast(`Switched view to ${name} (${role})`, 'info');
  };

  const handleSaveTaxConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can update GST settings.', 'error');
      return;
    }
    const rate = parseFloat(taxPercentInput);
    if (isNaN(rate) || rate < 0 || rate > 40) {
      showToast('Please enter a valid GST percentage (0 to 40%)', 'error');
      return;
    }

    updateGstPercent(rate);
    updateRestaurantConfig({ gstin: gstinInput.trim() });
    setIsEditingTax(false);
  };

  return (
    <div className="pb-28 max-w-md lg:max-w-5xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-3.5 py-3 shadow-2xs">
        <h2 className="text-[20px] font-extrabold text-[#242424] tracking-tight">
          Restaurant Settings
        </h2>
        <span className="text-[12px] text-[#737373]">Single-Store Terminal Profile</span>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-[#FCE8E8] text-[#A83B3B] font-extrabold text-[20px] flex items-center justify-center border border-[#F4B4B4]">
              {currentUser.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-[16px] text-[#242424]">{currentUser.name}</h3>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-[#FCE8E8] text-[#A83B3B] text-[9.5px] font-extrabold uppercase">
                    Admin
                  </span>
                )}
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#F8F8F6] border border-[#E8E6E3] text-[11px] font-bold text-[#555] capitalize mt-0.5">
                {currentUser.role} Role
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            id="btn-logout"
            className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:scale-95 flex items-center gap-1.5 text-[12px] font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Role Switcher for Prototype testing */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[13.5px] text-[#242424]">Demo Role Switcher</h4>
            <span className="text-[10px] text-[#888] font-bold uppercase">Fast Preview</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <button
              onClick={() => handleRoleSwitch('Admin', 'admin')}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                currentUser.role === 'admin'
                  ? 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4]'
                  : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
              }`}
            >
              👑 Admin (Manager)
            </button>
            <button
              onClick={() => handleRoleSwitch('Arun', 'dining')}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                currentUser.role === 'dining' && currentUser.name === 'Arun'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
              }`}
            >
              🍽️ Arun (Dining Staff)
            </button>
            <button
              onClick={() => handleRoleSwitch('Suresh', 'kitchen')}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                currentUser.role === 'kitchen'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
              }`}
            >
              👨‍🍳 Suresh (Kitchen Staff)
            </button>
            <button
              onClick={() => handleRoleSwitch('Manoj', 'takeaway')}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                currentUser.role === 'takeaway'
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
              }`}
            >
              🛍️ Manoj (Takeaway Staff)
            </button>
          </div>
        </div>

        {/* GST & Tax Configuration (Admin Only Interactive Editor) */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FCE8E8] text-[#A83B3B] flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-[14px] text-[#242424]">GST & Tax Settings</h4>
                <span className="text-[11px] text-[#737373]">
                  {isAdmin ? '👑 Admin Configuration' : '🔒 Locked to Admin'}
                </span>
              </div>
            </div>

            {isAdmin && !isEditingTax && (
              <button
                onClick={() => {
                  setTaxPercentInput(restaurantConfig.gstPercent.toString());
                  setGstinInput(restaurantConfig.gstin);
                  setIsEditingTax(true);
                }}
                id="btn-edit-tax-profile"
                className="px-2.5 py-1 rounded-xl bg-[#F8F8F6] hover:bg-gray-200 border border-[#E8E6E3] text-[#242424] font-bold text-[11.5px] flex items-center gap-1 active:scale-95"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Tax</span>
              </button>
            )}
          </div>

          {isEditingTax && isAdmin ? (
            <form onSubmit={handleSaveTaxConfig} className="p-3 bg-[#F8F8F6] rounded-2xl border border-[#E8E6E3] space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  GST Rate Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={taxPercentInput}
                  onChange={(e) => setTaxPercentInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E6E3] bg-white text-[14px] font-bold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5">
                {[0, 5, 12, 18].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTaxPercentInput(rate.toString())}
                    className={`flex-1 py-1 rounded-lg border text-[11px] font-bold ${
                      parseFloat(taxPercentInput) === rate
                        ? 'bg-[#C94B4B] text-white border-[#C94B4B]'
                        : 'bg-white text-[#555] border-[#E8E6E3]'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Restaurant GSTIN
                </label>
                <input
                  type="text"
                  value={gstinInput}
                  onChange={(e) => setGstinInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E6E3] bg-white text-[13px] font-mono text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#C94B4B] text-white font-bold text-[12.5px] shadow-sm active:scale-95"
                >
                  Save Tax Settings
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTax(false)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E8E6E3] text-[#737373] font-bold text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-[12.5px]">
              <div className="flex justify-between pb-1.5 border-b border-[#F5F5F3]">
                <span className="text-[#737373]">Active GST Rate</span>
                <strong className="text-[#C94B4B] font-extrabold text-[13.5px]">
                  {restaurantConfig.gstPercent}% Total
                </strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-[#F5F5F3]">
                <span className="text-[#737373]">CGST / SGST Split</span>
                <span className="text-[#242424] font-semibold">
                  {(restaurantConfig.gstPercent / 2).toFixed(1)}% + {(restaurantConfig.gstPercent / 2).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Registered GSTIN</span>
                <strong className="font-mono text-[#242424]">{restaurantConfig.gstin}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Profile Information */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-[#C94B4B]" />
            <h4 className="font-bold text-[14px] text-[#242424]">Store Details</h4>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between pb-1.5 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">Restaurant Name</span>
              <strong className="text-[#242424]">{restaurantConfig.name}</strong>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">Address</span>
              <strong className="text-[#242424] text-right max-w-[200px] truncate">
                {restaurantConfig.address}
              </strong>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-[#F5F5F3]">
              <span className="text-[#737373]">FSSAI License</span>
              <strong className="font-mono text-[#242424]">{restaurantConfig.fssai}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Merchant UPI ID</span>
              <strong className="font-mono text-[#242424]">{restaurantConfig.upiId}</strong>
            </div>
          </div>
        </div>

        {/* Hardware & Printer Settings */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-[#555]" />
              <h4 className="font-bold text-[14px] text-[#242424]">Thermal Receipt Printer</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
              Connected (80mm ESC/POS)
            </span>
          </div>
          <p className="text-[11.5px] text-[#737373]">
            Automatic dual-copy printing enabled on order submission (Kitchen KOT + Customer Bill).
          </p>
        </div>

        {/* Reset State Action */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (confirm('Reset prototype mock database to original state?')) {
                resetMockData();
              }
            }}
            id="btn-reset-prototype-data"
            className="w-full py-3 rounded-2xl bg-white border border-[#E8E6E3] text-[#737373] hover:text-red-700 hover:border-red-200 font-bold text-[13px] flex items-center justify-center gap-2 active:scale-98 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data to Initial State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
