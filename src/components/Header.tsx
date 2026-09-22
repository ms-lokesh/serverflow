import React from 'react';
import { Bell, Flame, User, UtensilsCrossed, ChefHat, ShoppingBag, ShieldCheck, LogOut } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { notifications } = useRestaurant();
  const { user: authUser, role, logout } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (r: Role | null) => {
    switch (r) {
      case 'admin':
        return {
          label: 'ADMIN',
          icon: ShieldCheck,
          bg: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'dining':
        return {
          label: 'DINING',
          icon: UtensilsCrossed,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'kitchen':
        return {
          label: 'KITCHEN',
          icon: ChefHat,
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'takeaway':
        return {
          label: 'TAKEAWAY',
          icon: ShoppingBag,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          label: 'STAFF',
          icon: User,
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const roleInfo = getRoleBadge(role);
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
          <span className="text-[10.5px] font-medium text-[#737373] tracking-normal leading-tight block truncate max-w-[130px]">
            {authUser?.restaurantName || 'Spice House'}
          </span>
        </div>
      </div>

      {/* Right Controls: Role Badge + Notifs + Logout */}
      <div className="flex items-center gap-1.5">
        {/* Real User Identity Chip */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleInfo.bg}`}
        >
          <RoleIcon className="w-3 h-3" />
          <span className="truncate max-w-[80px]">{authUser?.name || 'User'}</span>
          <span className="opacity-75 font-mono text-[9.5px]">({authUser?.employeeId || roleInfo.label})</span>
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          id="btn-header-notifs"
          className="relative w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#242424] hover:bg-[#F8F8F6] active:bg-[#E8E6E3] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-[#4A4A4A]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#C94B4B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="w-8.5 h-8.5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 hover:bg-red-100 active:scale-95 transition-all"
          aria-label="Sign Out"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
