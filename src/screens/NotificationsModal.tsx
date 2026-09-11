import React from 'react';
import { Bell, Check, Clock, AlertCircle, ChefHat, CreditCard, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useRestaurant();

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return <CreditCard className="w-4 h-4 text-[#C94B4B]" />;
      case 'kitchen_ready':
        return <ChefHat className="w-4 h-4 text-blue-600" />;
      case 'table_closed':
        return <Check className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
      <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="p-4 border-b border-[#E8E6E3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FCE8E8] text-[#A83B3B] flex items-center justify-center font-bold">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#242424]">Operational Alerts</h3>
              <span className="text-[11px] text-[#737373]">Live Restaurant Activity</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11.5px] font-bold text-[#737373] hover:text-[#242424]"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center text-[#555]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#F5F5F3]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[#737373]">
              <Bell className="w-8 h-8 text-[#CCC] mx-auto mb-2" />
              <p className="text-[13px] font-bold">No active notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`pt-2.5 pb-2.5 flex items-start gap-3 cursor-pointer rounded-xl p-2 transition-colors ${
                  n.read ? 'opacity-60 bg-transparent' : 'bg-[#FFFBFB] border border-[#F4B4B4]/40'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-[13.5px] text-[#242424]">{n.title}</h4>
                    <span className="text-[10px] font-mono text-[#888]">{n.timestamp}</span>
                  </div>
                  <p className="text-[12px] text-[#555] mt-0.5">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
