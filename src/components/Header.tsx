import React from 'react';
import { Bell, Flame, User, UtensilsCrossed, ChefHat, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  onOpenRoleSwitcher,
}) => {
  const { currentUser, notifications } = useRestaurant();

  const handleRoleClick = () => {
    if (onOpenRoleSwitcher) {
      onOpenRoleSwitcher();
    } else {
      onOpenProfile();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          icon: ShieldCheck,
          bg: 'bg-[#FCE8E8] text-[#A83B3B] border-[#F4B4B4]',
        };
      case 'dining':
        return {
          label: 'Dining',
          icon: UtensilsCrossed,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'kitchen':
        return {
          label: 'Kitchen',
          icon: ChefHat,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'takeaway':
        return {
          label: 'Takeaway',
          icon: ShoppingBag,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:hidden">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#C94B4B] flex items-center justify-center text-white shadow-sm shadow-[#C94B4B]/30">
          <Flame className="w-4.5 h-4.5 fill-white text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-[16px] text-[#242424] tracking-tight">ServeFlow</span>
          </div>
          <span className="text-[10.5px] font-medium text-[#737373] tracking-normal leading-tight block">
            Spice House
          </span>
        </div>
      </div>

      {/* Right Controls: Role Chip + Notifs + Profile */}
      <div className="flex items-center gap-1.5">
        {/* Quick Role Chip */}
        <button
          onClick={handleRoleClick}
          id="btn-role-switcher"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all active:scale-95 ${roleInfo.bg}`}
          title="Switch Role Demo"
        >
          <RoleIcon className="w-3 h-3" />
          <span>{currentUser.name}</span>
          <span className="opacity-70 text-[9.5px]">({roleInfo.label})</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          id="btn-header-notifs"
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#242424] hover:bg-[#F8F8F6] active:bg-[#E8E6E3] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-[#4A4A4A]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C94B4B] text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-soft-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          id="btn-header-profile"
          className="w-9 h-9 rounded-full bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center text-[#242424] hover:border-[#C94B4B]/40 active:scale-95 transition-all overflow-hidden"
          aria-label="User Profile"
        >
          <User className="w-4.5 h-4.5 text-[#555]" />
        </button>
      </div>
    </header>
  );
};
