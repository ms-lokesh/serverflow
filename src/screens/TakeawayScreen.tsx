import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  User,
  Phone,
  Clock,
  CheckCircle2,
  Receipt,
  CreditCard,
  ChefHat,
  Sparkles,
  UtensilsCrossed,
  Printer,
  Layers,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Dish, Order } from '../types';

interface TakeawayScreenProps {
  onViewBill: (order: Order) => void;
  onCollectPayment: (order: Order) => void;
}

export const TakeawayScreen: React.FC<TakeawayScreenProps> = ({
  onViewBill,
  onCollectPayment,
}) => {
  const { dishes, orders, createTakeawayOrder, restaurantConfig, showToast } = useRestaurant();
  const [isCreatingMobile, setIsCreatingMobile] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const categories = ['All', 'Main Course', 'Starters', 'Rice', 'Breads', 'Beverages', 'Desserts'];

  // Filter takeaway orders
  const takeawayOrders = orders.filter((o) => o.type === 'takeaway');
  const activeTakeaways = takeawayOrders.filter((o) => o.status !== 'closed');
  const pastTakeaways = takeawayOrders.filter((o) => o.status === 'closed');

  const handleUpdateQty = (dishId: string, delta: number) => {
    setCartQuantities((prev) => {
      const cur = prev[dishId] || 0;
      const next = Math.max(0, cur + delta);
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

  const totalItemsCount = Object.values(cartQuantities).reduce<number>((s, q) => s + (Number(q) || 0), 0);
  const subtotalCartAmount = Object.entries(cartQuantities).reduce<number>((sum, [dishId, qty]) => {
    const dish = dishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * Number(qty) : 0);
  }, 0);

  const gstRate = restaurantConfig.isGstEnabled ? restaurantConfig.gstPercent : 0;
  const gstAmount = Math.round((subtotalCartAmount * gstRate) / 100);
  const grandTotal = subtotalCartAmount + gstAmount;

  const handleCreateTakeaway = () => {
    if (totalItemsCount === 0) {
      showToast('Please add at least one item to the takeaway cart.', 'error');
      return;
    }

    const items = Object.entries(cartQuantities).map(([dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId)!;
      return { dish, quantity: qty };
    });

    createTakeawayOrder(customerName.trim() || 'Walk-in Guest', customerPhone.trim() || undefined, items);

    // Reset
    setIsCreatingMobile(false);
    setCustomerName('');
    setCustomerPhone('');
    setCartQuantities({});
  };

  return (
    <div className="pb-28 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6]">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E6E3] px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] sm:text-[24px] font-extrabold text-[#242424] tracking-tight">
              Takeaway & Parcel Counter POS
            </h2>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[11px]">
              Express Counter
            </span>
          </div>
          <span className="text-[12px] sm:text-[13px] text-[#737373]">
            {activeTakeaways.length} Active Orders • {pastTakeaways.length} Completed Today
          </span>
        </div>

        {/* Mobile New Takeaway Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsCreatingMobile(!isCreatingMobile)}
            id="btn-toggle-new-takeaway"
            className="py-2 px-3.5 rounded-xl bg-[#C94B4B] text-white font-bold text-[12.5px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreatingMobile ? 'View Orders' : 'New Takeaway'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* DESKTOP SPLIT VIEW (Visible on lg: & xl:) */}
        <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Interactive Menu Catalog & Search */}
          <div className="col-span-7 bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#C94B4B]" />
                <h3 className="font-extrabold text-[17px] text-[#242424]">Fast Menu Catalog</h3>
              </div>
              <span className="text-[12px] font-semibold text-[#737373]">
                {filteredDishes.length} Items Available
              </span>
            </div>

            {/* Search and Category Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes by name or category..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] text-[#242424] placeholder-[#888] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[12px] font-bold">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#C94B4B] text-white border-[#C94B4B]'
                        : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3] hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1">
              {filteredDishes.map((dish) => {
                const qty = cartQuantities[dish.id] || 0;
                return (
                  <div
                    key={dish.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      qty > 0 ? 'bg-[#FCE8E8]/30 border-[#C94B4B]' : 'bg-[#F8F8F6] border-[#E8E6E3] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <h4 className="font-extrabold text-[14px] text-[#242424] leading-tight">
                            {dish.name}
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#737373] mt-0.5 block">{dish.category}</span>
                      </div>
                      <span className="font-extrabold text-[14px] text-[#242424]">₹{dish.price}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5">
                      <span className="text-[11px] text-[#888] font-medium">Qty in cart: {qty}</span>

                      <div className="flex items-center bg-white border border-[#E8E6E3] rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => handleUpdateQty(dish.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 flex items-center justify-center text-[#242424] hover:bg-gray-100 disabled:opacity-30 active:bg-[#E8E6E3]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-extrabold text-[12.5px]">{qty}</span>
                        <button
                          onClick={() => handleUpdateQty(dish.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#C94B4B] hover:bg-[#FCE8E8] active:bg-[#E8E6E3]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: Live Sticky POS Order Ticket & Active Queue */}
          <div className="col-span-5 space-y-5">
            {/* Live Cart Ticket */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E6E3] shadow-xs space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-extrabold text-[13px]">
                    POS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[16px] text-[#242424]">Takeaway Cart</h3>
                    <span className="text-[11px] text-[#737373]">{totalItemsCount} items selected</span>
                  </div>
                </div>

                {totalItemsCount > 0 && (
                  <button
                    onClick={() => setCartQuantities({})}
                    className="text-[11.5px] font-bold text-red-600 hover:underline"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[12.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[12.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-[28vh] overflow-y-auto">
                {totalItemsCount === 0 ? (
                  <div className="p-6 text-center bg-[#F8F8F6] rounded-2xl border border-dashed border-[#E8E6E3] text-[#888] text-[12.5px]">
                    No items in cart yet. Select dishes from the menu catalog on the left.
                  </div>
                ) : (
                  Object.entries(cartQuantities).map(([dishId, qty]) => {
                    const dish = dishes.find((d) => d.id === dishId);
                    if (!dish) return null;
                    return (
                      <div
                        key={dishId}
                        className="p-2.5 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] flex items-center justify-between text-[12.5px]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-[#242424] truncate block">{dish.name}</span>
                          <span className="text-[11px] text-[#737373]">₹{dish.price} × {qty}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <strong className="text-[13px] text-[#242424]">₹{dish.price * Number(qty)}</strong>
                          <div className="flex items-center bg-white border border-[#E8E6E3] rounded-lg">
                            <button
                              onClick={() => handleUpdateQty(dishId, -1)}
                              className="w-5 h-5 flex items-center justify-center text-[#555]"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-[11px]">{qty}</span>
                            <button
                              onClick={() => handleUpdateQty(dishId, 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#C94B4B]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Price Calculation Summary */}
              {totalItemsCount > 0 && (
                <div className="pt-3 border-t border-[#E8E6E3] space-y-2 text-[12.5px]">
                  <div className="flex justify-between text-[#555]">
                    <span>Subtotal:</span>
                    <strong className="text-[#242424]">₹{subtotalCartAmount.toFixed(2)}</strong>
                  </div>
                  {gstRate > 0 && (
                    <div className="flex justify-between text-[#555]">
                      <span>GST ({gstRate}%):</span>
                      <strong className="text-[#242424]">₹{gstAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px] font-extrabold text-[#242424] pt-1.5 border-t border-[#E8E6E3]">
                    <span>Grand Total:</span>
                    <span className="text-[#C94B4B]">₹{grandTotal}</span>
                  </div>

                  <button
                    onClick={handleCreateTakeaway}
                    id="desktop-btn-send-takeaway"
                    className="w-full mt-2 py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 hover:bg-[#b53e3e] active:scale-98 transition-all"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span>Send Order to Kitchen (₹{grandTotal})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (Visible on sm & md) */}
        <div className="lg:hidden space-y-4">
          {isCreatingMobile ? (
            <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
                <h3 className="font-extrabold text-[16px] text-[#242424]">New Takeaway Order</h3>
                <button
                  onClick={() => setIsCreatingMobile(false)}
                  className="text-[12px] font-bold text-[#737373] hover:text-[#242424]"
                >
                  Cancel
                </button>
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                    />
                  </div>
                </div>
              </div>

              {/* Category selection */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11.5px] font-bold">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#C94B4B] text-white border-[#C94B4B]'
                        : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dish selector list */}
              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {filteredDishes.map((dish) => {
                  const qty = cartQuantities[dish.id] || 0;
                  return (
                    <div
                      key={dish.id}
                      className="p-2.5 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[13.5px] text-[#242424] block">
                          {dish.name}
                        </span>
                        <span className="text-[12px] font-bold text-[#555]">₹{dish.price}</span>
                      </div>

                      <div className="flex items-center bg-white border border-[#E8E6E3] rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => handleUpdateQty(dish.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-[#242424] active:bg-[#E8E6E3]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-[13px]">{qty}</span>
                        <button
                          onClick={() => handleUpdateQty(dish.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#C94B4B] active:bg-[#E8E6E3]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Actions */}
              {totalItemsCount > 0 && (
                <div className="pt-2 border-t border-[#E8E6E3] space-y-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#737373]">
                      Subtotal ({totalItemsCount} items)
                    </span>
                    <span className="font-extrabold text-[#242424]">₹{subtotalCartAmount}</span>
                  </div>
                  <button
                    onClick={handleCreateTakeaway}
                    id="btn-confirm-create-takeaway"
                    className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-[#C94B4B]/30 active:scale-98"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Send Takeaway to Kitchen (₹{grandTotal})</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ACTIVE & RECENT TAKEAWAY TOKENS LIST */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] sm:text-[16px] font-extrabold text-[#242424] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C94B4B]" />
              <span>Live Takeaway Orders Queue ({activeTakeaways.length})</span>
            </h3>
            <span className="text-[12px] text-[#737373]">
              Auto-syncs with KDS Kitchen status
            </span>
          </div>

          {activeTakeaways.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-[#E8E6E3] text-center max-w-lg mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-[14px] font-bold text-[#242424]">No Active Takeaway Orders</p>
              <p className="text-[12px] text-[#737373] mt-0.5">
                Add items to cart and tap Send to Kitchen to log a takeaway parcel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTakeaways.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E6E3] shadow-xs space-y-3.5 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-mono font-extrabold text-[13px]">
                            {ord.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F8F8F6] border border-[#E8E6E3] text-[10.5px] font-bold text-[#555] uppercase">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-[16px] font-extrabold text-[#242424] mt-1.5">
                          {ord.customerName || 'Takeaway Customer'}
                        </h4>
                        {ord.customerPhone && (
                          <span className="text-[11.5px] text-[#737373] block">{ord.customerPhone}</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[20px] font-extrabold text-[#C94B4B] block">
                          ₹{ord.grandTotal}
                        </span>
                        <span className="text-[11px] font-mono text-[#888]">{ord.createdAt}</span>
                      </div>
                    </div>

                    {/* Items summary */}
                    <div className="p-3 bg-[#F8F8F6] rounded-2xl text-[12.5px] space-y-1 mt-3">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-[#333]">
                            {it.name} <strong className="text-[#C94B4B]">×{it.quantity}</strong>
                          </span>
                          <span className="font-semibold text-[#555]">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-[#F5F5F3]">
                    <button
                      onClick={() => onViewBill(ord)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E8E6E3] hover:bg-gray-50 text-[#242424] font-bold text-[12.5px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Receipt className="w-4 h-4 text-[#555]" />
                      <span>Print KOT / Bill</span>
                    </button>

                    <button
                      onClick={() => onCollectPayment(ord)}
                      className="flex-1 py-2.5 rounded-xl bg-[#C94B4B] hover:bg-[#b53e3e] text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{ord.status === 'payment_submitted' ? 'Review Pay' : 'Pay ₹' + ord.grandTotal}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
