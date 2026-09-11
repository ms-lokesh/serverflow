import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  ChefHat,
  Sparkles,
  Info,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Dish, Order } from '../types';

interface AddItemsScreenProps {
  order: Order;
  onBack: () => void;
  onAdditionSent: () => void;
}

export const AddItemsScreen: React.FC<AddItemsScreenProps> = ({
  order,
  onBack,
  onAdditionSent,
}) => {
  const { dishes, addItemsToExistingOrder } = useRestaurant();
  const [additionQuantities, setAdditionQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Main Course', 'Starters', 'Rice', 'Breads', 'Beverages', 'Desserts'];

  const handleUpdateQty = (dishId: string, delta: number) => {
    setAdditionQuantities((prev) => {
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
    const matchesCat = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalAdditionCount = Object.values(additionQuantities).reduce<number>((s, q) => s + (Number(q) || 0), 0);

  const additionAmount = Object.entries(additionQuantities).reduce<number>((sum, [dishId, qty]) => {
    const dish = dishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * Number(qty) : 0);
  }, 0);

  const handleSendAddition = () => {
    if (totalAdditionCount === 0) return;

    const additions = Object.entries(additionQuantities).map(([dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId)!;
      return { dish, quantity: qty };
    });

    addItemsToExistingOrder(order.id, additions);
    onAdditionSent();
  };

  return (
    <div className="pb-36 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-4 sm:px-6 py-3.5 shadow-xs mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#242424] hover:text-[#C94B4B] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#C94B4B]" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <span className="text-[10.5px] font-bold text-[#C94B4B] uppercase tracking-wider block leading-none">
            Add Additional Items
          </span>
          <span className="text-[17px] font-extrabold text-[#242424] leading-tight">
            Table {order.tableNumber || 'Takeaway'} • {order.id}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11.5px] font-extrabold text-[#737373] bg-[#F8F8F6] px-3 py-1 rounded-xl border border-[#E8E6E3]">
            {totalAdditionCount} new
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Dishes Grid & Category Filter (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Categories Bar */}
          <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs flex items-center justify-between gap-3">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[12px] font-bold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center justify-center ${
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

          {/* Dishes Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredDishes.map((dish) => {
              const qty = additionQuantities[dish.id] || 0;

              return (
                <div
                  key={dish.id}
                  id={`add-dish-${dish.id}`}
                  className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between ${
                    qty > 0 ? 'border-[#C94B4B] bg-[#FFFBFB] shadow-xs' : 'border-[#E8E6E3] hover:border-[#C94B4B]/40'
                  }`}
                >
                  <div>
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
                      <span className="font-extrabold text-[14.5px] text-[#242424]">{dish.name}</span>
                    </div>
                    <span className="text-[14px] font-extrabold text-[#555] mt-1 block">
                      ₹{dish.price}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#F8F8F6] border border-[#E8E6E3] rounded-xl overflow-hidden shadow-2xs shrink-0">
                    <button
                      onClick={() => handleUpdateQty(dish.id, -1)}
                      className="w-9 h-9 flex items-center justify-center text-[#242424] hover:bg-[#E8E6E3]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`w-8 text-center font-extrabold text-[14px] ${
                        qty > 0 ? 'text-[#C94B4B]' : 'text-[#888]'
                      }`}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(dish.id, 1)}
                      id={`btn-plus-add-${dish.id}`}
                      className="w-9 h-9 flex items-center justify-center text-[#C94B4B] hover:bg-[#E8E6E3]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Existing Order Summary & Additions Summary (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Existing Order Context Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3] text-[12px]">
              <span className="font-bold text-[#737373] uppercase tracking-wider text-[11px]">
                Existing Order ({order.id})
              </span>
              <span className="font-mono font-bold text-[#C94B4B]">Total: ₹{order.grandTotal}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {order.items.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#F8F8F6] border border-[#E8E6E3] rounded-xl text-[12px] font-semibold text-[#333]"
                >
                  {item.name} <strong className="text-[#C94B4B]">×{item.quantity}</strong>
                </span>
              ))}
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Order ID remains <strong>{order.id}</strong>. Kitchen receives an additional ticket batch.
              </span>
            </div>
          </div>

          {/* Desktop Summary & Send Button */}
          <div className="hidden lg:block bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-3">
            <h4 className="font-extrabold text-[15px] text-[#242424]">New Additions</h4>
            {totalAdditionCount > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {Object.entries(additionQuantities).map(([id, q]) => {
                    const dish = dishes.find((d) => d.id === id);
                    if (!dish) return null;
                    const numQ = Number(q) || 0;
                    return (
                      <div key={id} className="flex justify-between text-[13px] border-b border-[#F5F5F3] pb-1.5">
                        <span className="font-semibold text-[#242424]">{dish.name} × {numQ}</span>
                        <span className="font-bold text-[#C94B4B]">₹{dish.price * numQ}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#E8E6E3] flex justify-between font-extrabold text-[15px]">
                  <span>Addition Total:</span>
                  <span className="text-[#C94B4B]">+₹{additionAmount}</span>
                </div>

                <button
                  onClick={handleSendAddition}
                  id="btn-send-addition-desktop"
                  className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
                >
                  <ChefHat className="w-5 h-5" />
                  <span>SEND ADDITION TO KITCHEN</span>
                </button>
              </div>
            ) : (
              <p className="text-[12.5px] text-[#888] py-4 text-center">
                Select items using the <strong>[+]</strong> buttons to send new batch
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#E8E6E3] p-3.5 shadow-lg max-w-md mx-auto">
        {totalAdditionCount > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[12px]">
              <div>
                <span className="font-bold text-[#737373]">Additional Items: </span>
                <span className="font-extrabold text-[#C94B4B]">
                  {Object.entries(additionQuantities)
                    .map(([id, q]) => `${dishes.find((d) => d.id === id)?.name} ×${q}`)
                    .join(', ')}
                </span>
              </div>
              <span className="font-extrabold text-[14px] text-[#242424]">
                +₹{additionAmount}
              </span>
            </div>

            <button
              onClick={handleSendAddition}
              id="btn-send-addition-to-kitchen"
              className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
            >
              <ChefHat className="w-5 h-5" />
              <span>SEND ADDITION TO KITCHEN</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-[12.5px] text-[#737373]">
            Select dishes with <strong className="text-[#C94B4B]">[+]</strong> to add to Order {order.id}
          </div>
        )}
      </div>
    </div>
  );
};
