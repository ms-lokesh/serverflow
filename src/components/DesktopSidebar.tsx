import React, { useState, useEffect } from 'react';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  UtensilsCrossed,
  Users,
  BarChart3,
  Settings,
  CalendarCheck,
  Flame,
  LogOut,
  Bell,
  Clock,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Role } from '../types';

interface DesktopSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenNotifications: () => void;
  onOpenClosing: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNotifications,
  onOpenClosing,
}) => {
  const {
    currentUser,
    logout,
    login,
    restaurantConfig,
    orders,
    kitchenTickets,
    tables,
    notifications,
    showToast,
  } = useRestaurant();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live POS clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Badge calculations
  const pendingPaymentsCount = orders.filter(
    (o) => o.status === 'payment_submitted' && o.payment?.status === 'pending'
  ).length;

  const kitchenActiveCount = kitchenTickets.filter(
    (k) => k.status === 'new' || k.status === 'preparing'
  ).length;

  const billRequestedCount = tables.filter((t) => t.status === 'bill_requested').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Define navigation items based on current role
  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    category?: string;
  }

  const getRoleNavItems = (): { category: string; items: NavItem[] }[] => {
    if (currentUser.role === 'admin') {
      return [
        {
          category: 'Operations',
          items: [
            { id: 'home', label: 'Overview Dashboard', icon: Home },
            {
              id: 'tables',
              label: 'Dining Tables (POS)',
              icon: LayoutGrid,
              badge: billRequestedCount > 0 ? billRequestedCount : undefined,
              badgeColor: 'bg-amber-500',
            },
            {
              id: 'takeaway',
              label: 'Takeaway Counter',
              icon: ShoppingBag,
            },
            {
              id: 'payments',
              label: 'Payment Verifications',
              icon: CircleDollarSign,
              badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
              badgeColor: 'bg-[#C94B4B]',
            },
            { id: 'orders', label: 'All Orders Log', icon: ClipboardList },
          ],
        },
        {
          category: 'Management',
          items: [
            { id: 'menu', label: 'Menu & Prices (GST)', icon: UtensilsCrossed },
            { id: 'employees', label: 'Staff & Roles', icon: Users },
            { id: 'reports', label: 'Tax & Sales Analytics', icon: BarChart3 },
            { id: 'profile', label: 'Restaurant Settings', icon: Settings },
          ],
        },
      ];
    }

    if (currentUser.role === 'dining') {
      return [
        {
          category: 'Service Flow',
          items: [
            {
              id: 'tables',
              label: 'Dining Tables',
              icon: LayoutGrid,
              badge: billRequestedCount > 0 ? billRequestedCount : undefined,
              badgeColor: 'bg-amber-500',
            },
            { id: 'takeaway', label: 'Takeaway Counter', icon: ShoppingBag },
            { id: 'orders', label: 'My Orders', icon: ClipboardList },
            { id: 'profile', label: 'Terminal Profile', icon: Settings },
          ],
        },
      ];
    }

    if (currentUser.role === 'kitchen') {
      return [
        {
          category: 'Kitchen Station',
          items: [
            {
              id: 'kitchen',
              label: 'Live KDS Board',
              icon: ChefHat,
              badge: kitchenActiveCount > 0 ? kitchenActiveCount : undefined,
              badgeColor: 'bg-[#C94B4B]',
            },
            { id: 'menu', label: '86 Stock Items', icon: UtensilsCrossed },
            { id: 'profile', label: 'Station Profile', icon: Settings },
          ],
        },
      ];
    }

    // Takeaway role
    return [
      {
        category: 'Counter POS',
        items: [
          { id: 'takeaway', label: 'Takeaway Counter POS', icon: ShoppingBag },
          { id: 'orders', label: 'Active Takeaways', icon: ClipboardList },
          { id: 'profile', label: 'Terminal Profile', icon: Settings },
        ],
      },
    ];
  };

  const navGroups = getRoleNavItems();

  return (
    <aside className="hidden lg:flex flex-col w-68 bg-white border-r border-[#E8E6E3] shrink-0 h-screen sticky top-0 z-40 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E8E6E3] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#C94B4B] flex items-center justify-center text-white shadow-md shadow-[#C94B4B]/25">
            <Flame className="w-5.5 h-5.5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[17px] text-[#242424] tracking-tight">ServeFlow</span>
              <span className="px-1.5 py-0.2 bg-[#FCE8E8] text-[#A83B3B] text-[9.5px] font-bold rounded-md uppercase">
                POS
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#737373] truncate block max-w-[140px]">
              {restaurantConfig.name}
            </span>
          </div>
        </div>
      </div>

      {/* POS Terminal Clock & Status Bar */}
      <div className="px-4 py-2.5 bg-[#F8F8F6] border-b border-[#E8E6E3] flex items-center justify-between text-[11.5px]">
        <div className="flex items-center gap-1.5 text-[#555]">
          <Clock className="w-3.5 h-3.5 text-[#C94B4B]" />
          <span className="font-mono font-bold text-[#242424]">{currentTime || '12:00:00 PM'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10.5px] text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live POS
          </span>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter POS Fullscreen'}
            className="text-[#737373] hover:text-[#242424] p-0.5 rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="px-3 text-[10.5px] font-extrabold uppercase tracking-wider text-[#999] block">
              {group.category}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`desktop-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#C94B4B] text-white shadow-sm shadow-[#C94B4B]/25'
                        : 'text-[#555] hover:bg-[#F8F8F6] hover:text-[#242424]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-[#737373]'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                          isActive
                            ? 'bg-white text-[#C94B4B]'
                            : `${item.badgeColor || 'bg-[#C94B4B]'} text-white`
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick EOD Closing Button for Admin */}
        {currentUser.role === 'admin' && (
          <div className="pt-2">
            <button
              onClick={onOpenClosing}
              id="desktop-btn-eod-closing"
              className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[12px] font-extrabold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-700" />
                <span>Daily EOD Closing</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                EOD
              </span>
            </button>
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-[#E8E6E3] bg-[#FDFDFD]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FCE8E8] text-[#A83B3B] font-extrabold text-[13px] flex items-center justify-center shrink-0">
              {currentUser.name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold text-[#242424] truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] font-semibold text-[#737373] capitalize truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {currentUser.role} Role
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg text-[#737373] hover:bg-gray-200 relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#C94B4B] rounded-full" />
              )}
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
