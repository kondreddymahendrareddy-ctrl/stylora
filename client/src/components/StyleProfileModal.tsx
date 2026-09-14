import React, { useState } from 'react';
import { UserStyleProfile, WardrobeItem } from '../types/fashion';
import { User, GenderPreference, SkinTone } from '../types/auth';
import { 
  User as UserIcon, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Shirt, 
  TrendingUp, 
  Palette, 
  RotateCcw, 
  PieChart, 
  Sliders 
} from 'lucide-react';
import { updateStyleArchetype } from '../services/api';
import { updateProfile } from '../services/authApi';
import { SKIN_TONE_OPTIONS, GENDER_OPTIONS } from './AuthModal';
import { StyleHistory } from './StyleHistory';

interface StyleProfileModalProps {
  profile: UserStyleProfile | null;
  wardrobe: WardrobeItem[];
  currentUser?: User | null;
  onProfileUpdated: (profile: UserStyleProfile) => void;
  onUserUpdated?: (user: User) => void;
  onResetAll?: () => void;
}

export const StyleProfileModal: React.FC<StyleProfileModalProps> = ({
  profile,
  wardrobe,
  currentUser,
  onProfileUpdated,
  onUserUpdated,
  onResetAll
}) => {
  const [subTab, setSubTab] = useState<'stats' | 'history'>('stats');

  if (!profile) return null;

  const currentGender = (currentUser?.gender || profile.gender || 'unisex') as GenderPreference;
  const currentSkinTone = (currentUser?.skinTone || profile.skinTone || 'medium_olive') as SkinTone;

  const archetypes = [
    { id: 'smart_casual_eclectic', label: 'Smart Casual', desc: 'A great balance of casual staples and relaxed tailoring for work or dinner.' },
    { id: 'minimalist', label: 'Simple & Clean (Minimalist)', desc: 'Clean lines, neutral colors (black, white, grey), and zero visual clutter.' },
    { id: 'old_money_aesthetic', label: 'Classic & Elegant', desc: 'Timeless luxury fabrics like linen, cashmere, and classic neutral tones.' },
    { id: 'streetwear_contemporary', label: 'Streetwear & Casual', desc: 'Comfortable boxy cuts, relaxed jeans, cool jackets, and clean sneakers.' },
    { id: 'classic_tailored', label: 'Sharp & Formal', desc: 'Crisp dress shirts, tailored trousers, blazers, and formal dress shoes.' }
  ];

  const handleSelectArchetype = async (id: string) => {
    try {
      const updated = await updateStyleArchetype(id);
      onProfileUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGender = async (gender: GenderPreference) => {
    try {
      if (currentUser) {
        const updatedUser = await updateProfile({ gender });
        if (onUserUpdated) onUserUpdated(updatedUser);
      }
      onProfileUpdated({ ...profile, gender });
    } catch (err) {
      console.error('Failed to update gender:', err);
    }
  };

  const handleUpdateSkinTone = async (skinTone: SkinTone) => {
    try {
      if (currentUser) {
        const updatedUser = await updateProfile({ skinTone });
        if (onUserUpdated) onUserUpdated(updatedUser);
      }
      onProfileUpdated({ ...profile, skinTone });
    } catch (err) {
      console.error('Failed to update skin tone:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#ECE5DB] pb-6">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-neutral-900">
            {subTab === 'stats' ? 'My Style Stats & Vibe' : 'Style History & Pie Analytics'}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {subTab === 'stats'
              ? 'Here is how STYLORA learns your personal fashion taste and wardrobe metrics.'
              : 'Real outfit analytics, color preferences, and style choices over time.'}
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-full border border-[#ECE5DB] shadow-xs">
          <button
            onClick={() => setSubTab('stats')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              subTab === 'stats'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>My Style Stats</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              subTab === 'history'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-amber-300" />
            <span>Style History & Analytics</span>
          </button>
        </div>
      </div>

      {subTab === 'history' ? (
        /* Tab 2: Style History with Pie Charts */
        <StyleHistory />
      ) : (
        /* Tab 1: My Style Stats & Vibe */
        <div className="space-y-8 animate-fadeIn">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs">
              <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                <Shirt className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Clothes</span>
              </div>
              <div className="font-serif text-2xl font-semibold text-neutral-900">
                {wardrobe.length} Pieces
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Saved in your closet</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs">
              <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Outfits Created</span>
              </div>
              <div className="font-serif text-2xl font-semibold text-neutral-900">
                {profile.totalOutfitsGenerated} Looks
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Combinations tried</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs">
              <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Days Worn</span>
              </div>
              <div className="font-serif text-2xl font-semibold text-neutral-900">
                {profile.totalOutfitsWorn} Days
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Confirmed in real life</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE5DB] shadow-xs">
              <div className="flex items-center space-x-2 text-neutral-400 mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Favorite Looks</span>
              </div>
              <div className="font-serif text-2xl font-semibold text-neutral-900">
                {profile.likedOutfitsCount} Likes
              </div>
            </div>
          </div>

          {/* Style Archetype Selector */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DB] shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-neutral-900">
                Your Fashion Vibe
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Picks the clothing style that matches how you like to dress.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {archetypes.map(arch => (
                <button
                  key={arch.id}
                  onClick={() => handleSelectArchetype(arch.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    profile.styleArchetype === arch.id
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-[#ECE5DB] bg-[#FAF9F6] text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base font-semibold">{arch.label}</span>
                    {profile.styleArchetype === arch.id && (
                      <span className="text-[10px] bg-amber-400 text-neutral-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1.5 leading-relaxed ${profile.styleArchetype === arch.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {arch.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Wardrobe Silhouette & Complexion Personalization */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DB] shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-neutral-900 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-neutral-700" />
                <span>Silhouette & Complexion Harmonization</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                STYLORA customizes clothing cuts and color schemes specifically to flatter your skin tone and preferred silhouette.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Gender Preference */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Wardrobe Department
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleUpdateGender(g.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                        currentGender === g.id
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-[#ECE5DB] bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-semibold">{g.badge}</span>
                      <span className={`text-[10px] mt-0.5 leading-tight ${currentGender === g.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {g.id === 'women' ? "Women's" : g.id === 'men' ? "Men's" : 'Unisex'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Tone Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Skin Tone / Complexion
                  </label>
                  <span className="text-[11px] text-neutral-600 font-medium">
                    {SKIN_TONE_OPTIONS.find(s => s.id === currentSkinTone)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 p-2 bg-[#FAF9F6] border border-[#ECE5DB] rounded-2xl">
                  {SKIN_TONE_OPTIONS.map((tone) => {
                    const isSelected = currentSkinTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => handleUpdateSkinTone(tone.id)}
                        title={`${tone.label} - ${tone.note}`}
                        className={`group relative flex flex-col items-center p-1.5 rounded-xl transition-all ${
                          isSelected ? 'bg-white shadow-xs' : 'hover:bg-neutral-200/50'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full shadow-inner transition-transform ${
                            isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 scale-105' : 'group-hover:scale-105'
                          }`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-neutral-500 italic px-1">
                  ✨ Flattering colors: {SKIN_TONE_OPTIONS.find(s => s.id === currentSkinTone)?.note}
                </p>
              </div>
            </div>
          </div>

          {/* Learned Color Palette Memory */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DB] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold text-neutral-900 flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-neutral-700" />
                  <span>Your Favorite Colors</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Colors you like and wear will appear more often in your outfit recommendations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {profile.favoriteColors.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  No preferred colors learned yet. Start liking outfits or logging worn looks to build your color palette!
                </p>
              ) : (
                profile.favoriteColors.map((hex, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-[#FAF9F6] border border-[#ECE5DB] px-3.5 py-2 rounded-full"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-inner"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs font-mono font-medium text-neutral-700">{hex}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Wardrobe Data & Reset Controls */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DB] shadow-sm space-y-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-neutral-900">
                Wardrobe Data Management
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Wipe all uploaded clothes and generated outfits from your account to start fresh.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {onResetAll && (
                <button
                  onClick={onResetAll}
                  className="flex items-center space-x-2 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-full text-xs font-semibold hover:bg-rose-100 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Empty (0 Pieces & 0 Outfits)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
