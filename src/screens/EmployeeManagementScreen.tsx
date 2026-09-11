import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Phone,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';

export const EmployeeManagementScreen: React.FC = () => {
  const { employees, addEmployee, currentUser } = useRestaurant();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('dining');
  const [phone, setPhone] = useState('');

  const isAdmin = currentUser.role === 'admin';

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'admin':
        return { label: 'Admin', icon: ShieldCheck, color: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4]' };
      case 'dining':
        return { label: 'Dining Staff', icon: UtensilsCrossed, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'kitchen':
        return { label: 'Kitchen Staff', icon: ChefHat, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'takeaway':
        return { label: 'Takeaway Staff', icon: ShoppingBag, color: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isAdmin) return;

    addEmployee({
      name: name.trim(),
      role,
      phone: phone.trim() || undefined,
      isActive: true,
      shift: 'Morning & Evening',
    });

    setIsAddModalOpen(false);
    setName('');
    setPhone('');
  };

  return (
    <div className="pb-32 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-5 py-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold text-[#242424] tracking-tight">
            Staff & Roles Management
          </h2>
          <span className="text-[12.5px] text-[#737373]">
            {employees.length} Active Team Members Across Shifts
          </span>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            id="btn-add-staff"
            className="py-2.5 px-4 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-sm hover:bg-[#A83B3B] active:scale-95 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Staff Member</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin-Only Management</span>
          </div>
        )}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const roleInfo = getRoleBadge(emp.role);
          const Icon = roleInfo.icon;

          return (
            <div
              key={emp.id}
              className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs flex items-center justify-between hover:border-[#C94B4B]/30 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center font-extrabold text-[#242424] text-[17px] shadow-2xs">
                  {emp.name[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-[15px] text-[#242424]">{emp.name}</h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold border ${roleInfo.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{roleInfo.label}</span>
                    </span>
                  </div>

                  <div className="text-[12px] text-[#737373] flex items-center gap-2 mt-1">
                    {emp.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#888]" /> {emp.phone}
                      </span>
                    )}
                    <span>•</span>
                    <span>{emp.shift || 'Full Shift'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 border border-[#E8E6E3]">
            <div className="w-12 h-1.5 bg-[#E8E6E3] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <h3 className="text-[18px] font-extrabold text-[#242424]">Add Restaurant Staff</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[13px] font-bold text-[#737373] hover:text-[#242424]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikas Sharma"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[14px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                >
                  <option value="dining">Dining Staff (Captain / Waiter)</option>
                  <option value="kitchen">Kitchen Staff (Chef)</option>
                  <option value="takeaway">Takeaway Staff</option>
                  <option value="admin">Administrator / Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876500000"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[14px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              <button
                type="submit"
                id="btn-confirm-add-staff"
                className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14.5px] shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
              >
                Add Staff Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
