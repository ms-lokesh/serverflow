import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Sparkles,
  UtensilsCrossed,
  Shield,
  Percent,
  Trash2,
  Lock,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Dish } from '../types';

export const MenuManagementScreen: React.FC = () => {
  const {
    dishes,
    currentUser,
    restaurantConfig,
    toggleDishAvailability,
    updateDishPrice,
    addDish,
    deleteDish,
    updateGstPercent,
    showToast,
  } = useRestaurant();

  const isAdmin = currentUser.role === 'admin';
  const isKitchen = currentUser.role === 'kitchen';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  
  // Add dish modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Main Course');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishDesc, setNewDishDesc] = useState('');

  // GST settings modal state (Admin only)
  const [isGstModalOpen, setIsGstModalOpen] = useState<boolean>(false);
  const [tempGstRate, setTempGstRate] = useState<string>(restaurantConfig.gstPercent.toString());

  const categories = ['All', 'Main Course', 'Starters', 'Rice', 'Breads', 'Beverages', 'Desserts'];

  const filteredDishes = dishes.filter((d) => {
    const matchCat = selectedCategory === 'All' || d.category === selectedCategory;
    const matchQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleStartEditPrice = (dish: Dish) => {
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can edit dish prices.', 'error');
      return;
    }
    setEditingDishId(dish.id);
    setEditingPrice(dish.price.toString());
  };

  const handleSavePrice = (dishId: string) => {
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can save price changes.', 'error');
      return;
    }
    const p = parseFloat(editingPrice);
    if (!isNaN(p) && p > 0) {
      updateDishPrice(dishId, p);
    }
    setEditingDishId(null);
  };

  const handleDeleteDish = (dish: Dish) => {
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can delete dishes.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to remove "${dish.name}" from the menu?`)) {
      deleteDish(dish.id);
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can add new dishes.', 'error');
      return;
    }
    const p = parseFloat(newDishPrice);
    if (!newDishName.trim() || isNaN(p) || p <= 0) return;

    addDish({
      name: newDishName.trim(),
      category: newDishCategory,
      price: p,
      isVeg: newDishIsVeg,
      isAvailable: true,
      description: newDishDesc.trim(),
      gstPercentage: restaurantConfig.gstPercent,
    });

    setIsAddModalOpen(false);
    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
  };

  const handleSaveGstSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission Denied: Only Admin can configure GST rates.', 'error');
      return;
    }
    const rate = parseFloat(tempGstRate);
    if (isNaN(rate) || rate < 0 || rate > 40) {
      showToast('Please enter a valid GST percentage (0 to 40%)', 'error');
      return;
    }
    updateGstPercent(rate);
    setIsGstModalOpen(false);
  };

  return (
    <div className="pb-28 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-2">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-4 sm:px-6 py-4 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#242424] tracking-tight">
                {isAdmin ? 'Menu & Dish Price Management' : isKitchen ? 'Kitchen Stock & 86 Item Status' : 'Menu Catalog'}
              </h2>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded-lg bg-[#FCE8E8] text-[#A83B3B] font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Admin Master
                </span>
              ) : isKitchen ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider">
                  Kitchen
                </span>
              ) : null}
            </div>
            <span className="text-[12px] text-[#737373] mt-0.5 block">
              {dishes.length} items registered • {isAdmin ? 'Add dishes, update base rates, adjust GST tax percentage' : 'Manage 86 item availability'}
            </span>
          </div>

          {/* Add Dish Button (Visible only to Admin) */}
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              id="btn-add-menu-dish"
              className="py-2.5 px-4 rounded-xl bg-[#C94B4B] text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#A83B3B] active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add New Dish</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Role Notice Banners */}
        {isAdmin ? (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E6E3] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FCE8E8] text-[#A83B3B] flex items-center justify-center font-bold shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
                    Restaurant Tax Setting
                  </span>
                  <div className="text-[14px] font-extrabold text-[#242424]">
                    Active GST Rate: <span className="text-[#C94B4B]">{restaurantConfig.gstPercent}%</span>{' '}
                    <span className="text-[12px] font-normal text-[#666]">
                      ({(restaurantConfig.gstPercent / 2).toFixed(1)}% CGST + {(restaurantConfig.gstPercent / 2).toFixed(1)}% SGST)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setTempGstRate(restaurantConfig.gstPercent.toString());
                  setIsGstModalOpen(true);
                }}
                id="btn-open-gst-settings"
                className="px-4 py-2 rounded-xl bg-[#F8F8F6] hover:bg-[#ECEBE8] border border-[#E8E6E3] text-[#242424] font-bold text-[12.5px] active:scale-95 transition-all self-start sm:self-auto"
              >
                Change GST Rate
              </button>
            </div>
          </div>
        ) : isKitchen ? (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-2xs flex items-start gap-3 text-amber-900">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[12.5px] leading-relaxed">
              <strong>Kitchen Mode (86 Stock Only):</strong> You can toggle item stock availability when ingredients run out. Adding new dishes, fixing prices, and GST settings are <strong>Admin-only</strong> permissions.
            </div>
          </div>
        ) : null}

        {/* Search & Categories Toolbar */}
        <div className="bg-white rounded-3xl p-4 border border-[#E8E6E3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4.5 h-4.5 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by dish name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] text-[#242424] placeholder-[#888] focus:outline-none focus:border-[#C94B4B] shadow-2xs"
            />
          </div>

          {/* Categories Horizontal */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[12px] font-bold">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all ${
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
        <div>
          {filteredDishes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E6E3]">
              <UtensilsCrossed className="w-10 h-10 text-[#BBB] mx-auto mb-2.5" />
              <p className="font-bold text-[15px] text-[#555]">No dishes found</p>
              <p className="text-[12.5px] text-[#888]">Try a different search query or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDishes.map((dish) => {
                const isEditing = editingDishId === dish.id;

                return (
                  <div
                    key={dish.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      dish.isAvailable ? 'border-[#E8E6E3] shadow-xs hover:border-[#C94B4B]/40' : 'border-amber-300 bg-amber-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${
                              dish.isVeg ? 'border-emerald-600' : 'border-red-600'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            />
                          </span>
                          <h4
                            className={`font-extrabold text-[15px] ${
                              dish.isAvailable ? 'text-[#242424]' : 'text-[#888] line-through'
                            }`}
                          >
                            {dish.name}
                          </h4>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-[#F8F8F6] border border-[#E8E6E3] text-[10.5px] font-bold text-[#737373]">
                          {dish.category}
                        </span>
                      </div>

                      {dish.description && (
                        <p className="text-[11.5px] text-[#737373] mt-1.5 line-clamp-2">
                          {dish.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-[#F5F5F3]">
                      {/* Price Control */}
                      <div>
                        {isEditing && isAdmin ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-extrabold text-[#737373]">₹</span>
                            <input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-20 px-2 py-0.5 rounded-lg border border-[#C94B4B] bg-white text-[14px] font-extrabold text-[#242424] focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(dish.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white active:scale-95"
                              title="Save Price"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingDishId(null)}
                              className="p-1.5 rounded-lg bg-gray-200 text-gray-700 active:scale-95"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditPrice(dish)}
                              id={`btn-edit-price-${dish.id}`}
                              className="flex items-center gap-1 text-[15px] font-extrabold text-[#242424] hover:text-[#C94B4B] group"
                              title="Click to edit price (Admin only)"
                            >
                              <span>₹{dish.price}</span>
                              <Edit2 className="w-3.5 h-3.5 text-[#888] group-hover:text-[#C94B4B]" />
                            </button>

                            <button
                              onClick={() => handleDeleteDish(dish)}
                              className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                              title="Delete dish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#555]">
                            <span>₹{dish.price}</span>
                            <span className="text-[10.5px] font-normal text-[#888] flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Fixed
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Availability 86 Toggle */}
                      <button
                        onClick={() => toggleDishAvailability(dish.id)}
                        id={`toggle-avail-${dish.id}`}
                        className={`px-3 py-1.5 rounded-xl text-[11.5px] font-extrabold border transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                          dish.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dish.isAvailable ? 'bg-emerald-500' : 'bg-amber-600'
                          }`}
                        />
                        <span>{dish.isAvailable ? 'In Stock' : '86 Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add New Dish Modal (Admin Only) */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-[#E8E6E3] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#242424]">Add New Menu Item</h3>
                <span className="text-[11.5px] text-[#737373]">Admin Only Catalog Entry</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[13px] font-bold text-[#737373] hover:text-[#242424]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Mutton Rogan Josh"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                  >
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    placeholder="250"
                    required
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Description / Ingredients (Optional)
                </label>
                <input
                  type="text"
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  placeholder="e.g. Slow cooked tender lamb in Kashmiri spices"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[12.5px] font-medium text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Food Dietary Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDishIsVeg(true)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all ${
                      newDishIsVeg
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Vegetarian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDishIsVeg(false)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all ${
                      !newDishIsVeg
                        ? 'bg-red-50 text-red-800 border-red-500 ring-2 ring-red-500/20'
                        : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-confirm-add-dish"
                className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
              >
                Add Item to Menu Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GST Settings Modal (Admin Only) */}
      {isGstModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-[#E8E6E3] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F3]">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#242424]">Restaurant GST Rate</h3>
                <span className="text-[11.5px] text-[#737373]">Admin Master Tax Configuration</span>
              </div>
              <button
                onClick={() => setIsGstModalOpen(false)}
                className="text-[13px] font-bold text-[#737373] hover:text-[#242424]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveGstSettings} className="space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-bold text-[#555] uppercase tracking-wider mb-1">
                  Tax Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={tempGstRate}
                  onChange={(e) => setTempGstRate(e.target.value)}
                  placeholder="5"
                  required
                  min="0"
                  max="40"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[15px] font-extrabold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
              </div>

              {/* GST Preset Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                  Quick Presets:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-[12px] font-bold">
                  {[
                    { label: '0% (Exempt)', val: 0 },
                    { label: '5% (Standard)', val: 5 },
                    { label: '12% (Tier 2)', val: 12 },
                    { label: '18% (AC/Bar)', val: 18 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setTempGstRate(p.val.toString())}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        parseFloat(tempGstRate) === p.val
                          ? 'bg-[#C94B4B] text-white border-[#C94B4B]'
                          : 'bg-[#F8F8F6] text-[#555] border-[#E8E6E3]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax split preview */}
              <div className="p-3.5 bg-[#F8F8F6] rounded-xl border border-[#E8E6E3] text-[12px] space-y-1">
                <div className="flex justify-between text-[#555]">
                  <span>CGST Share:</span>
                  <strong>{((parseFloat(tempGstRate) || 0) / 2).toFixed(2)}%</strong>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>SGST Share:</span>
                  <strong>{((parseFloat(tempGstRate) || 0) / 2).toFixed(2)}%</strong>
                </div>
                <div className="flex justify-between text-[#242424] font-bold pt-1.5 border-t border-[#E8E6E3]">
                  <span>Total Tax Rate:</span>
                  <strong className="text-[#C94B4B]">{(parseFloat(tempGstRate) || 0)}%</strong>
                </div>
              </div>

              <button
                type="submit"
                id="btn-save-gst-rate"
                className="w-full py-3.5 rounded-2xl bg-[#C94B4B] text-white font-extrabold text-[14px] shadow-md shadow-[#C94B4B]/30 hover:bg-[#A83B3B] active:scale-98 transition-all"
              >
                Apply GST Rate Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
