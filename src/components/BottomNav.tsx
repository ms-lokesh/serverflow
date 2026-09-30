import React from 'react';
import {
  LayoutGrid,
  ClipboardList,
  CircleDollarSign,
  MoreHorizontal,
  Home,
  ChefHat,
  CookingPot,
  ShoppingBag,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: string;
  onSelectTab?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onTabChange,
}) => {
  const { orders, kitchenTickets, tables } = useRestaurant();
  const { role } = useAuth();

  const handleTabSelect = (tabId: string) => {
    if (onSelectTab) onSelectTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  // Badges calculation
  const pendingPaymentsCount = orders.filter(
    (o) => o.status === 'payment_submitted' && o.payment?.status === 'pending'
  ).length;

  const kitchenNewCount = kitchenTickets.filter((k) => k.status === 'new').length;
  const billRequestedCount = tables.filter((t) => t.status === 'bill_requested').length;
  const takeawayReadyCount = orders.filter(
    (o) => o.orderType === 'takeaway' && (o.status === 'ready' || o.status === 'preparing')
  ).length;

  // Nav configurations per role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'tables', label: 'Tables', icon: LayoutGrid, badge: billRequestedCount > 0 ? billRequestedCount : undefined },
          {
            id: 'kitchen',
            label: 'KDS Live',
            icon: ChefHat,
            badge: kitchenNewCount > 0 ? kitchenNewCount : undefined,
          },
          {
            id: 'payments',
            label: 'Payments',
            icon: CircleDollarSign,
            badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
          },
          { id: 'orders', label: 'Orders', icon: ClipboardList },
          { id: 'profile', label: 'More', icon: MoreHorizontal },
        ];

      case 'dining':
        return [
          { id: 'tables', label: 'Tables', icon: LayoutGrid, badge: billRequestedCount > 0 ? billRequestedCount : undefined },
          {
            id: 'kitchen',
            label: 'KDS Live',
            icon: ChefHat,
            badge: kitchenNewCount > 0 ? kitchenNewCount : undefined,
          },
          { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
          { id: 'orders', label: 'Orders', icon: ClipboardList },
          { id: 'profile', label: 'Staff', icon: MoreHorizontal },
        ];

      case 'kitchen':
        return [
          {
            id: 'kitchen',
            label: 'KDS Live',
            icon: ChefHat,
            badge: kitchenNewCount > 0 ? kitchenNewCount : undefined,
          },
          { id: 'menu', label: 'Menu', icon: CookingPot },
          { id: 'profile', label: 'Staff', icon: MoreHorizontal },
        ];

      case 'takeaway':
        return [
          { id: 'takeaway', label: 'Counter', icon: ShoppingBag },
          {
            id: 'orders',
            label: 'Orders',
            icon: ClipboardList,
            badge: takeawayReadyCount > 0 ? takeawayReadyCount : undefined,
          },
          { id: 'profile', label: 'Staff', icon: MoreHorizontal },
        ];

      default:
        return [
          { id: 'tables', label: 'Tables', icon: LayoutGrid },
          { id: 'orders', label: 'Orders', icon: ClipboardList },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleTabSelect(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[58px] min-h-[48px] px-1 py-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive ? 'text-[#C94B4B]' : 'text-[#737373] hover:text-[#242424]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#C94B4B] text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10.5px] mt-1 font-medium tracking-tight whitespace-nowrap ${
                  isActive ? 'font-bold text-[#C94B4B]' : 'text-[#737373]'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-[2.5px] bg-[#C94B4B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
