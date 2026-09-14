import React, { useState } from 'react';
import { WardrobeItem, ClothingCategory } from '../types/fashion';
import { User } from '../types/auth';
import { Trash2, Plus, Sparkles, Filter } from 'lucide-react';

interface WardrobeSectionProps {
  items: WardrobeItem[];
  onDeleteItem: (id: string) => void;
  onOpenUpload: () => void;
  currentUser?: User | null;
}

export const WardrobeSection: React.FC<WardrobeSectionProps> = ({
  items,
  onDeleteItem,
  onOpenUpload,
  currentUser
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Garments' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Trousers' },
    { id: 'outerwear', label: 'Jackets' },
    { id: 'footwear', label: 'Shoes' }
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.primaryColor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#ECE5DB] pb-5">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-neutral-900">
            My Closet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            All your clothes in one place, neatly organized and ready to style.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clothes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#ECE5DB] rounded-full px-4 py-2 text-xs w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 bg-neutral-900 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-neutral-800 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Clothes</span>
          </button>
        </div>
      </div>

      {/* Full Width Closet Grid */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-[#ECE5DB] text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {cat.label} ({cat.id === 'all' ? items.length : items.filter(i => i.category === cat.id).length})
            </button>
          ))}
        </div>

        {/* Wardrobe Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="relative rounded-3xl overflow-hidden border border-[#ECE5DB] shadow-xs">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url('/images/studio-bg.jpg')` }}
            />
            <div className="relative z-10 text-center py-20 px-4 bg-white/90 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <h3 className="font-serif text-xl text-neutral-900 font-medium">
                {!currentUser ? "Sign In to Access Your Closet" : "Your closet is empty (0 clothes)"}
              </h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto">
                {!currentUser 
                  ? "Log in to your personal account to see your uploaded clothes and style fresh outfits." 
                  : "Upload photos of your shirts, pants, jackets, shoes, or dresses to start styling!"}
              </p>
              <button
                onClick={onOpenUpload}
                className="mt-4 inline-flex items-center space-x-1.5 bg-neutral-900 text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-neutral-800 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{!currentUser ? "Sign In / Register" : "+ Add Your First Garment"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Responsive Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-[#ECE5DB] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-40 sm:h-44 bg-neutral-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Category Pill Badge */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase text-neutral-700 shadow-xs">
                    {item.category}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-red-50 text-neutral-500 hover:text-red-600 flex items-center justify-center transition-colors shadow-xs opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Times Worn Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Worn {item.timesWorn}x
                  </div>
                </div>

                {/* Garment Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-serif text-xs font-semibold text-neutral-900 leading-snug line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5 capitalize truncate">
                      {item.material} • {item.fit} fit
                    </p>
                  </div>

                  {/* Color Dot & Formality Badge */}
                  <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full border border-neutral-300 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: item.primaryColor.hex }}
                      />
                      <span className="text-[10px] text-neutral-600 truncate max-w-[80px]">
                        {item.primaryColor.name}
                      </span>
                    </div>

                    <span className="text-[9px] font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded capitalize">
                      {item.formalityScore <= 3 ? 'Casual' : item.formalityScore <= 6 ? 'Smart' : 'Dressy'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
