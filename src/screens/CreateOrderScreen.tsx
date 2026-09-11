import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Dish, Table } from '../types';

interface CreateOrderScreenProps {
  table?: Table;
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

export const CreateOrderScreen: React.FC<CreateOrderScreenProps> = ({
  table,
  onBack,
  onOrderCreated,
}) => {
  const { dishes, createDiningOrder } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const categories = [
    'All',
    'Main Course',
    'Starters',
    'Rice',
    'Breads',
    'Beverages',
    'Desserts',
  ];

  const handleUpdateQty = (dishId: string, delta: number) => {
    setCartQuantities((prev) => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: next };
    });
  };

  const filteredDishes = dishes.filter((dish) => {
    if (!dish.isAvailable) return false;
    const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItemsCount = Object.values(cartQuantities).reduce<number>((s, q) => s + (Number(q) || 0), 0);

  const totalCartAmount = Object.entries(cartQuantities).reduce<number>((sum, [dishId, qty]) => {
    const dish = dishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * Number(qty) : 0);
  }, 0);

  const handleSendToKitchen = () => {
    if (!table || totalItemsCount === 0) return;

    const itemsToSend = Object.entries(cartQuantities).map(([dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId)!;
      return { dish, quantity: qty };
    });

    const newOrder = createDiningOrder(table.number, itemsToSend);
    onOrderCreated(newOrder.id);
  };

  return (
    <div className="pb-32 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-4 sm:px-6 py-3.5 shadow-xs mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#242424] hover:text-[#C94B4B] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#C94B4B]" />
          <span>Back to Tables</span>
        </button>

        <div className="text-center">
          <span className="text-[10.5px] font-bold text-[#737373] uppercase tracking-wider block leading-none">
            New Dining Order
          </span>
          <span className="text-[18px] font-extrabold text-[#242424] leading-tight">
            Table {table?.number || '01'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11.5px] font-extrabold text-[#737373] bg-[#F8F8F6] px-3 py-1 rounded-xl border border-[#E8E6E3]">
            {totalItemsCount} items
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Section (7-8 cols on desktop): Search, Categories & Dishes Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Categories Bar */}
          <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes (e.g. Biryani, Paneer, Coke)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] text-[#242424] placeholder-[#888] focus:outline-none focus:border-[#C94B4B] shadow-2xs"
              />
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[12px] font-bold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95 flex items-center justify-center ${
                    selectedCategory === cat
                      ? 'bg-[#C94B4B] text-white border-[#C94B4B] shadow-xs'
                      : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3] hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3.5">
            {filteredDishes.map((dish) => {
              const qty = cartQuantities[dish.id] || 0;

              return (
                <div
                  key={dish.id}
                  id={`dish-card-${dish.id}`}
                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                    qty > 0 ? 'border-[#C94B4B] shadow-xs bg-[#FDFCFB]' : 'border-[#E8E6E3] hover:border-[#C94B4B]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                            dish.isVeg ? 'border-emerald-600' : 'border-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                        </span>
                        <h4 className="font-extrabold text-[15px] text-[#242424] leading-tight">
                          {dish.name}
                        </h4>
                      </div>

                      {dish.popular && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" /> Best
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-[#737373] mt-1.5 line-clamp-2">
                      {dish.description || dish.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-[#F5F5F3]">
                    <div className="text-[16px] font-extrabold text-[#242424]">
                      ₹{dish.price}
                    </div>

                    {/* Add / Quantity Stepper */}
                    <div className="shrink-0 flex items-center">
                      {qty === 0 ? (
                        <button
                          onClick={() => handleUpdateQty(dish.id, 1)}
                          id={`btn-add-${dish.id}`}
                          className="min-w-[80px] h-9.5 px-3 rounded-xl bg-[#FCE8E8] text-[#A83B3B] font-extrabold text-[13px] border border-[#F4B4B4] flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-[#C94B4B] hover:text-white"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>ADD</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-[#C94B4B] text-white rounded-xl overflow-hidden shadow-xs">
                          <button
                            onClick={() => handleUpdateQty(dish.id, -1)}
                            className="w-9 h-9 flex items-center justify-center text-white active:bg-[#A83B3B] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <span className="w-7 text-center font-extrabold text-[14px]">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(dish.id, 1)}
                            className="w-9 h-9 flex items-center justify-center text-white active:bg-[#A83B3B] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section (4 cols on desktop): Desktop Order Cart Panel */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-4 bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <div>
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                  Active Dining Cart
                </span>
                <h3 className="text-[17px] font-extrabold text-[#242424]">
                  Table {table?.number}
                </h3>
              </div>
              <span className="w-7 h-7 rounded-full bg-[#C94B4B] text-white font-extrabold text-[12px] flex items-center justify-center">
                {totalItemsCount}
              </span>
            </div>

            {/* Cart list on desktop */}
            {totalItemsCount === 0 ? (
              <div className="py-12 text-center text-[#888]">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#CCC]" />
                <p className="font-bold text-[13.5px]">Cart is empty</p>
                <p className="text-[11.5px] text-[#999] mt-0.5">Click +ADD on items to create order</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {Object.entries(cartQuantities).map(([dishId, qty]) => {
                  const dish = dishes.find((d) => d.id === dishId);
                  if (!dish) return null;

                  return (
                    <div key={dishId} className="flex items-center justify-between text-[13px] py-1 border-b border-[#F5F5F3] pb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-[#242424] truncate">{dish.name}</div>
                        <div className="text-[11.5px] text-[#737373]">
                          ₹{dish.price} × {qty} = <strong className="text-[#242424]">₹{dish.price * Number(qty)}</strong>
                        </div>
                      </div>

                      <div className="flex items-center bg-[#F8F8F6] border border-[#E8E6E3] rounded-xl overflow-hidden shrink-0">
                        <button
                          onClick={() => handleUpdateQty(dish.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#242424] hover:bg-[#E8E6E3]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-[12px]">{qty}</span>
                        <button
                          onClick={() => handleUpdateQty(dish.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#242424] hover:bg-[#E8E6E3]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Financial Summary & Send Button */}
            {totalItemsCount > 0 && (
              <div className="pt-3 border-t border-[#E8E6E3] space-y-3">
                <div className="space-y-1.5 text-[12.5px] text-[#555]">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItemsCount} items)</span>
                    <span className="font-bold text-[#242424]">₹{totalCartAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. GST (5%)</span>
                    <span>₹{(totalCartAmount * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-extrabold text-[#242424] pt-1.5 border-t border-[#E8E6E3]">
                    <span>Estimated Total</span>
                    <span className="text-[#C94B4B]">
                      ₹{Math.round(totalCartAmount * 1.05)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSendToKitchen}
                  id="btn-send-to-kitchen-desktop"
                  className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>SEND TO KITCHEN</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Cart Bar for Mobile */}
      {totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] p-3.5 shadow-lg max-w-md mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#C94B4B] text-white font-bold text-[11px] flex items-center justify-center">
                  {totalItemsCount}
                </span>
                <span className="font-extrabold text-[15px] text-[#242424]">
                  ₹{totalCartAmount}
                </span>
              </div>
              <span className="text-[10.5px] text-[#737373] block">
                + GST (5%) calculated at billing
              </span>
            </div>

            <button
              onClick={() => setIsReviewOpen(true)}
              id="btn-view-order-cart"
              className="py-3 px-5 rounded-2xl bg-[#C94B4B] text-white font-bold text-[14px] flex items-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
            >
              <span>View Order</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Order Review Cart Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-in fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col max-w-md mx-auto w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E8E6E3] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                  Review Dining Order
                </span>
                <h3 className="text-[18px] font-extrabold text-[#242424]">
                  Table {table?.number}
                </h3>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-[13px] font-bold text-[#737373] hover:text-[#242424] px-2 py-1"
              >
                Back to Menu
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#F5F5F3] space-y-2">
              {Object.entries(cartQuantities).map(([dishId, qty]) => {
                const dish = dishes.find((d) => d.id === dishId);
                if (!dish) return null;

                return (
                  <div key={dishId} className="pt-2 pb-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[14px] text-[#242424]">{dish.name}</div>
                      <div className="text-[12px] text-[#737373]">
                        ₹{dish.price} × {qty} = <strong className="text-[#242424]">₹{dish.price * Number(qty)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center bg-[#F8F8F6] border border-[#E8E6E3] rounded-xl overflow-hidden">
                      <button
                        onClick={() => handleUpdateQty(dish.id, -1)}
                        className="w-9 h-9 flex items-center justify-center text-[#242424] active:bg-[#E8E6E3]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-[13px]">{qty}</span>
                      <button
                        onClick={() => handleUpdateQty(dish.id, 1)}
                        className="w-9 h-9 flex items-center justify-center text-[#242424] active:bg-[#E8E6E3]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal Footer & Action */}
            <div className="p-4 bg-[#F8F8F6] border-t border-[#E8E6E3] space-y-3">
              <div className="space-y-1 text-[12.5px] text-[#555]">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItemsCount} items)</span>
                  <span className="font-bold text-[#242424]">₹{totalCartAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. GST (5%)</span>
                  <span>₹{(totalCartAmount * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-extrabold text-[#242424] pt-1 border-t border-[#E8E6E3]">
                  <span>Estimated Total</span>
                  <span className="text-[#C94B4B]">
                    ₹{Math.round(totalCartAmount * 1.05)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSendToKitchen}
                id="btn-send-to-kitchen"
                className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>SEND TO KITCHEN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
