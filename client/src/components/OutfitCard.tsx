import React, { useState } from 'react';
import { Outfit, WardrobeItem } from '../types/fashion';
import { Heart, CheckCircle2, Info, Sparkles, Layers } from 'lucide-react';

interface OutfitCardProps {
  outfit: Outfit;
  onExplain: (outfit: Outfit) => void;
  onFeedback: (outfitId: string, liked: boolean, worn: boolean) => void;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, onExplain, onFeedback }) => {
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(outfit.userFeedback?.liked));
  const [isWorn, setIsWorn] = useState<boolean>(Boolean(outfit.userFeedback?.worn));

  const handleLikeToggle = () => {
    const next = !isLiked;
    setIsLiked(next);
    onFeedback(outfit.id, next, isWorn);
  };

  const handleWornToggle = () => {
    const next = !isWorn;
    setIsWorn(next);
    onFeedback(outfit.id, isLiked, next);
  };

  const piecesList = [
    { label: 'Layer / Outerwear', item: outfit.pieces.outerwear },
    { label: 'Base Top', item: outfit.pieces.top },
    { label: 'Trousers / Bottom', item: outfit.pieces.bottom },
    { label: 'Footwear', item: outfit.pieces.footwear }
  ].filter(p => Boolean(p.item)) as { label: string; item: WardrobeItem }[];

  const formatHarmony = (type: string) => {
    switch (type) {
      case 'neutral_anchor': return 'Classic Neutrals';
      case 'monochromatic': return 'Single Tone';
      case 'analogous': return 'Harmonious Colors';
      case 'complementary': return 'Contrasting Pop';
      case 'split_complementary': return 'Accent Contrast';
      default: return 'Color Coordinated';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#ECE5DB] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-6 border-b border-[#ECE5DB] bg-gradient-to-b from-[#FAF9F6] to-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-900 text-white px-2.5 py-1 rounded-full">
              {formatHarmony(outfit.colorHarmonyType)}
            </span>
            <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
              {outfit.overallScore}% Match
            </span>
          </div>

          {/* Like & Worn Action Icons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeToggle}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-neutral-400 hover:text-rose-500'
              }`}
              title={isLiked ? 'Liked' : 'Like outfit'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              onClick={handleWornToggle}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isWorn
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
              title="Mark as worn today"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isWorn ? 'text-emerald-700' : ''}`} />
              <span className="text-[11px]">{isWorn ? 'Worn Today' : 'Wear'}</span>
            </button>
          </div>
        </div>

        <h3 className="font-serif text-xl font-semibold text-neutral-900 leading-snug">
          {outfit.name}
        </h3>
        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
          {outfit.stylistRationale.headline} • {outfit.weatherFit}
        </p>
      </div>

      {/* Outfit Assembled Pieces Visuals */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {piecesList.map((slot, index) => (
          <div
            key={slot.item.id}
            className="group relative bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl p-2.5 flex flex-col justify-between hover:border-neutral-400 transition-colors"
          >
            <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-400 block mb-1">
              {slot.label}
            </span>

            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-200 relative mb-2">
              <img
                src={slot.item.imageUrl}
                alt={slot.item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <span
                className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: slot.item.primaryColor.hex }}
                title={slot.item.primaryColor.name}
              />
            </div>

            <div>
              <h5 className="text-[11px] font-semibold text-neutral-800 line-clamp-1 leading-tight">
                {slot.item.name}
              </h5>
              <p className="text-[10px] text-neutral-500 capitalize line-clamp-1 mt-0.5">
                {slot.item.material}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer: Explain This Look */}
      <div className="p-4 bg-neutral-50 border-t border-[#ECE5DB] flex items-center justify-end">
        <button
          onClick={() => onExplain(outfit)}
          className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 border border-[#ECE5DB] px-3.5 py-1.5 rounded-full shadow-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Why this looks great</span>
          <Info className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
