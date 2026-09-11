import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';

export const Toast: React.FC = () => {
  const { activeToast, dismissToast } = useRestaurant();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#C94B4B] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (activeToast.type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95 text-emerald-950';
      case 'error':
        return 'border-[#F4B4B4] bg-[#FCE8E8]/95 text-[#7F2626]';
      case 'warning':
        return 'border-amber-200 bg-amber-50/95 text-amber-950';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50/95 text-blue-950';
    }
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto max-w-sm w-full rounded-2xl p-3 border shadow-lg backdrop-blur-md flex items-center justify-between gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${getBorderColor()}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {getIcon()}
          <span className="text-[13px] font-semibold leading-snug break-words">
            {activeToast.message}
          </span>
        </div>
        <button
          onClick={dismissToast}
          className="p-1 rounded-full hover:bg-black/5 active:bg-black/10 text-current opacity-70 hover:opacity-100"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
