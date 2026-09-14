import React from 'react';
import { Outfit, WardrobeItem } from '../types/fashion';
import { X, Sparkles, Palette, Scale, Lightbulb, CheckCircle2 } from 'lucide-react';

interface StylistExplanationModalProps {
  outfit: Outfit | null;
  onClose: () => void;
}

export const StylistExplanationModal: React.FC<StylistExplanationModalProps> = ({ outfit, onClose }) => {
  if (!outfit) return null;

  const { stylistRationale, colorHarmonyType, harmonyScore, overallScore, pieces } = outfit;
  const piecesList: WardrobeItem[] = [pieces.top, pieces.bottom, pieces.outerwear, pieces.footwear].filter(
    (p): p is WardrobeItem => Boolean(p)
  );

  const getFriendlyHarmony = (type: string) => {
    switch (type) {
      case 'monochromatic': return 'Single Color Tones';
      case 'analogous': return 'Similar Colors That Blend';
      case 'complementary': return 'Contrasting Pop Colors';
      case 'neutral_accent': return 'Classic Neutrals With A Pop';
      case 'triadic': return 'Balanced Vibrant Colors';
      default: return 'Harmonious Color Blend';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#ECE5DB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#ECE5DB] flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-neutral-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-amber-300 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Stylist Advice & Match Details
              </span>
              <h3 className="font-serif text-xl font-semibold text-neutral-900 leading-tight">
                {stylistRationale.headline || outfit.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Swatch Bar */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#ECE5DB]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Color Palette ({getFriendlyHarmony(colorHarmonyType)} • {harmonyScore}% Match)
            </span>
            <div className="flex items-center space-x-3">
              {piecesList.map((p) => p && (
                <div key={p.id} className="flex items-center space-x-1.5 bg-white border border-[#ECE5DB] px-3 py-1.5 rounded-full shadow-xs">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-inner"
                    style={{ backgroundColor: p.primaryColor.hex }}
                  />
                  <span className="text-xs font-medium text-neutral-700">
                    {p.primaryColor.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 1. Why It Works */}
          <div className="space-y-1.5">
            <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>1. The Overall Look & Vibe</span>
            </h4>
            <p className="text-sm text-neutral-600 leading-relaxed pl-5 font-normal">
              {stylistRationale.whyItWorks}
            </p>
          </div>

          {/* 2. Color Theory Physics */}
          <div className="space-y-1.5 border-t border-neutral-100 pt-4">
            <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-800">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Why The Colors Match</span>
            </h4>
            <p className="text-sm text-neutral-600 leading-relaxed pl-5 font-normal">
              {stylistRationale.colorHarmonyExplanation}
            </p>
          </div>

          {/* 3. Proportions & Silhouette */}
          <div className="space-y-1.5 border-t border-neutral-100 pt-4">
            <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-800">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. How The Clothes Fit Together</span>
            </h4>
            <p className="text-sm text-neutral-600 leading-relaxed pl-5 font-normal">
              {stylistRationale.proportionAndFit}
            </p>
          </div>

          {/* 4. Pro Styling Tips */}
          {stylistRationale.proStylingTips && stylistRationale.proStylingTips.length > 0 && (
            <div className="space-y-2.5 border-t border-neutral-100 pt-4">
              <h4 className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-800">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>4. Quick Tips on How to Wear It</span>
              </h4>
              <ul className="space-y-2 pl-5">
                {stylistRationale.proStylingTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-neutral-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-[#ECE5DB] flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Where to wear: <span className="font-semibold text-neutral-800 capitalize">{outfit.occasion.replace('_', ' ')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
