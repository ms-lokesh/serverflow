import React, { useState } from 'react';
import { Flame, ShieldCheck, UtensilsCrossed, ChefHat, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';

export const LoginScreen: React.FC = () => {
  const { login } = useRestaurant();
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<Role>('admin');

  const demoRoles: { role: Role; name: string; label: string; icon: any; color: string }[] = [
    {
      role: 'admin',
      name: 'Admin',
      label: 'Admin',
      icon: ShieldCheck,
      color: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4]',
    },
    {
      role: 'dining',
      name: 'Arun',
      label: 'Dining Staff',
      icon: UtensilsCrossed,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      role: 'kitchen',
      name: 'Suresh',
      label: 'Kitchen Staff',
      icon: ChefHat,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      role: 'takeaway',
      name: 'Manoj',
      label: 'Takeaway Staff',
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  ];

  const handleSelectRole = (r: (typeof demoRoles)[0]) => {
    setSelectedRole(r.role);
    setUsername(r.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="pt-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C94B4B] flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-[#C94B4B]/30">
          <Flame className="w-9 h-9 fill-white text-white" />
        </div>
        <h1 className="text-[26px] font-extrabold text-[#242424] tracking-tight">ServeFlow</h1>
        <p className="text-[14px] text-[#737373] mt-1 font-medium">Restaurant POS & Operations</p>
        <div className="inline-block mt-2 px-3 py-1 bg-white border border-[#E8E6E3] rounded-full text-[11px] font-semibold text-[#555]">
          Spice House Restaurant
        </div>
      </div>

      {/* Form Card */}
      <div className="my-auto py-6">
        <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[#242424] text-[14px] font-semibold focus:outline-none focus:border-[#C94B4B] focus:bg-white transition-all"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[#242424] text-[14px] font-semibold focus:outline-none focus:border-[#C94B4B] focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#C94B4B] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#A83B3B] active:scale-98 transition-all shadow-md shadow-[#C94B4B]/30 min-h-[48px]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role Selection for Demo */}
          <div className="mt-6 pt-5 border-t border-[#E8E6E3]">
            <p className="text-[11.5px] font-bold text-[#737373] text-center uppercase tracking-wider mb-3">
              Prototype Demo Quick Roles
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.role && username === r.name;
                return (
                  <button
                    key={r.role + r.name}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                      isSelected
                        ? `${r.color} ring-2 ring-[#C94B4B]/40 font-bold`
                        : 'bg-[#F8F8F6] border-[#E8E6E3] text-[#555] hover:bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs border border-inherit">
                      <Icon className="w-4 h-4 text-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold truncate leading-tight text-[#242424]">
                        {r.name}
                      </div>
                      <div className="text-[10px] text-[#737373] truncate">{r.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-4 text-[11px] text-[#888]">
        ServeFlow Mobile POS • v2.4 Single Restaurant Edition
      </div>
    </div>
  );
};
