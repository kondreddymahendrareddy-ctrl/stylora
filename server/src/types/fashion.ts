export type ClothingCategory = 'top' | 'bottom' | 'outerwear' | 'footwear' | 'one_piece' | 'accessory';

export interface ColorInfo {
  name: string;
  hex: string;
  temperature: 'warm' | 'cool' | 'neutral';
  hsl?: [number, number, number]; // [hue 0-360, saturation 0-100, lightness 0-100]
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string; // e.g., 'oxford_shirt', 'chinos', 'chelsea_boots', 'trench_coat'
  primaryColor: ColorInfo;
  accentColors?: string[]; // hex codes
  pattern: 'solid' | 'striped' | 'plaid' | 'floral' | 'textured' | 'graphic';
  material: string; // e.g., 'cotton', 'linen', 'wool', 'denim', 'leather'
  texture: string; // e.g., 'ribbed', 'smooth', 'distressed', 'matte'
  fit: 'slim' | 'tailored' | 'regular' | 'relaxed' | 'oversized';
  formalityScore: number; // 1 (Gym/Lounge) to 10 (Black Tie)
  seasonality: ('spring' | 'summer' | 'fall' | 'winter')[];
  imageUrl: string;
  versatilityTags: string[];
  timesWorn: number;
  rating?: number; // 1-5
  createdAt: string;
}

export type Occasion = 
  | 'casual' 
  | 'smart_casual' 
  | 'business_formal' 
  | 'evening_cocktail' 
  | 'date_night' 
  | 'athleisure' 
  | 'vacation_resort';

export interface WeatherCondition {
  temperatureC: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'breezy';
}

export type BodyFitPreference = 
  | 'balanced' 
  | 'oversized_top_slim_bottom' 
  | 'fitted_top_relaxed_bottom' 
  | 'relaxed_all' 
  | 'tailored_all';

export type HarmonyType = 
  | 'monochromatic' 
  | 'analogous' 
  | 'complementary' 
  | 'split_complementary' 
  | 'triadic' 
  | 'neutral_anchor'
  | 'tonal';

export interface StylistRationale {
  headline: string;
  whyItWorks: string;
  colorHarmonyExplanation: string;
  proportionAndFit: string;
  proStylingTips: string[];
}

export interface Outfit {
  id: string;
  name: string; // e.g., "The Parisian Minimalist", "The Modern Executive"
  pieces: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    outerwear?: WardrobeItem;
    footwear?: WardrobeItem;
    accessories?: WardrobeItem[];
  };
  occasion: Occasion;
  colorHarmonyType: HarmonyType;
  harmonyScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  stylistRationale: StylistRationale;
  weatherFit: string;
  userFeedback?: {
    liked?: boolean;
    worn?: boolean;
    notes?: string;
  };
  createdAt: string;
}

export interface GenerateOutfitRequest {
  occasion: Occasion;
  weather?: WeatherCondition;
  fitPreference?: BodyFitPreference;
  colorMood?: string;
  lockedItemIds?: string[]; // IDs of garments user explicitly wants to wear
  gender?: string;
  skinTone?: string;
}

export interface UserStyleProfile {
  styleArchetype: 'minimalist' | 'classic_tailored' | 'streetwear_contemporary' | 'smart_casual_eclectic' | 'old_money_aesthetic';
  favoriteColors: string[];
  dislikedCombinations: string[];
  averageFormalityPreference: number;
  totalOutfitsGenerated: number;
  totalOutfitsWorn: number;
  likedOutfitsCount: number;
  gender?: string;
  skinTone?: string;
}
