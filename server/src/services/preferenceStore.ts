import { WardrobeItem, Outfit, UserStyleProfile } from '../types/fashion.js';
import { INITIAL_WARDROBE } from './seedData.js';
import { supabase } from './supabase.js';

function createDefaultProfile(archetype: UserStyleProfile['styleArchetype'] = 'minimalist'): UserStyleProfile {
  return {
    styleArchetype: archetype,
    favoriteColors: [],
    dislikedCombinations: [],
    averageFormalityPreference: 0,
    totalOutfitsGenerated: 0,
    totalOutfitsWorn: 0,
    likedOutfitsCount: 0
  };
}

class StyloraStore {
  // Multi-tenant isolation: every collection is strictly keyed by userId
  private wardrobes: Map<string, WardrobeItem[]> = new Map();
  private outfitHistories: Map<string, Outfit[]> = new Map();
  private profiles: Map<string, UserStyleProfile> = new Map();

  private getUserWardrobe(userId: string): WardrobeItem[] {
    if (!this.wardrobes.has(userId)) {
      this.wardrobes.set(userId, []);
    }
    return this.wardrobes.get(userId)!;
  }

  private getUserOutfits(userId: string): Outfit[] {
    if (!this.outfitHistories.has(userId)) {
      this.outfitHistories.set(userId, []);
    }
    return this.outfitHistories.get(userId)!;
  }

  getStyleProfile(userId: string): UserStyleProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, createDefaultProfile());
    }
    return { ...this.profiles.get(userId)! };
  }

  updateArchetype(userId: string, archetype: UserStyleProfile['styleArchetype']): void {
    const profile = this.getStyleProfile(userId);
    profile.styleArchetype = archetype;
    this.profiles.set(userId, profile);
  }

  async resetAll(userId: string): Promise<void> {
    this.wardrobes.set(userId, []);
    this.outfitHistories.set(userId, []);
    this.profiles.set(userId, createDefaultProfile());

    if (supabase) {
      try {
        await supabase.from('wardrobe_items').delete().eq('user_id', userId);
        await supabase.from('outfits').delete().eq('user_id', userId);
        console.log(`⚡ [Supabase] Database storage wiped for user: ${userId}`);
      } catch (err) {
        console.warn(`⚠️ [Supabase] Error resetting data for ${userId}:`, err);
      }
    }
  }

  async loadSampleWardrobe(userId: string): Promise<WardrobeItem[]> {
    // Generate fresh IDs tied to this specific user
    const userSample: WardrobeItem[] = INITIAL_WARDROBE.map(item => ({
      ...item,
      id: `sample-${userId}-${item.id}`
    }));

    this.wardrobes.set(userId, [...userSample]);

    if (supabase) {
      for (const item of userSample) {
        try {
          await supabase.from('wardrobe_items').upsert({
            id: item.id,
            user_id: userId,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            primary_color: item.primaryColor,
            pattern: item.pattern,
            material: item.material,
            texture: item.texture,
            fit: item.fit,
            formality_score: item.formalityScore,
            seasonality: item.seasonality,
            image_url: item.imageUrl,
            times_worn: item.timesWorn
          });
        } catch {}
      }
    }

    return userSample;
  }

  // ==========================================
  // Wardrobe Management (Per-User Isolated)
  // ==========================================

  async getWardrobe(userId: string): Promise<WardrobeItem[]> {
    // 1. Fetch from Supabase for this specific user
    if (supabase) {
      try {
        const { data: dbItems, error } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && dbItems) {
          const mapped: WardrobeItem[] = dbItems.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            subcategory: row.subcategory,
            primaryColor: row.primary_color,
            pattern: row.pattern,
            material: row.material,
            texture: row.texture,
            fit: row.fit,
            formalityScore: row.formality_score,
            seasonality: row.seasonality,
            imageUrl: row.image_url,
            versatilityTags: row.versatility_tags || [],
            timesWorn: row.times_worn || 0,
            createdAt: row.created_at
          }));

          this.wardrobes.set(userId, mapped);
          return [...mapped];
        }
      } catch (err) {
        console.warn(`⚠️ [Supabase] Error querying wardrobe for ${userId}:`, err);
      }
    }

    // 2. Return from in-memory user cache
    return [...this.getUserWardrobe(userId)];
  }

  getWardrobeItem(userId: string, id: string): WardrobeItem | undefined {
    return this.getUserWardrobe(userId).find(item => item.id === id);
  }

  async addWardrobeItem(userId: string, item: Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn'>): Promise<WardrobeItem> {
    const newItem: WardrobeItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timesWorn: 0,
      createdAt: new Date().toISOString()
    };

    const userList = this.getUserWardrobe(userId);
    userList.unshift(newItem);
    this.wardrobes.set(userId, userList);

    // Save in Supabase under this user's account
    if (supabase) {
      try {
        const { error } = await supabase.from('wardrobe_items').insert({
          id: newItem.id,
          user_id: userId,
          name: newItem.name,
          category: newItem.category,
          subcategory: newItem.subcategory,
          primary_color: newItem.primaryColor,
          pattern: newItem.pattern,
          material: newItem.material,
          texture: newItem.texture,
          fit: newItem.fit,
          formality_score: newItem.formalityScore,
          seasonality: newItem.seasonality,
          image_url: newItem.imageUrl,
          times_worn: newItem.timesWorn
        });

        if (error) {
          console.warn(`⚠️ [Supabase] Wardrobe Insert Notice for ${userId}:`, error.message);
        } else {
          console.log(`⚡ [Supabase] Garment "${newItem.name}" saved in database for user ${userId}.`);
        }
      } catch (err: any) {
        console.warn('⚠️ [Supabase] Error saving garment:', err.message);
      }
    }

    return newItem;
  }

  async deleteWardrobeItem(userId: string, id: string): Promise<boolean> {
    const list = this.getUserWardrobe(userId);
    const initialLen = list.length;
    const updated = list.filter(item => item.id !== id);
    this.wardrobes.set(userId, updated);
    const deleted = updated.length < initialLen;

    if (deleted && supabase) {
      try {
        await supabase
          .from('wardrobe_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        console.log(`⚡ [Supabase] Garment ${id} removed for user ${userId}.`);
      } catch {}
    }

    return deleted;
  }

  // ==========================================
  // Outfit & Feedback (Per-User Isolated)
  // ==========================================

  saveOutfit(userId: string, outfit: Outfit): void {
    const list = this.getUserOutfits(userId);
    list.unshift(outfit);
    this.outfitHistories.set(userId, list);

    const profile = this.getStyleProfile(userId);
    profile.totalOutfitsGenerated += 1;
    this.profiles.set(userId, profile);

    if (supabase) {
      (async () => {
        try {
          await supabase.from('outfits').insert({
            id: outfit.id,
            user_id: userId,
            name: outfit.name,
            occasion: outfit.occasion,
            color_harmony_type: outfit.colorHarmonyType,
            harmony_score: outfit.harmonyScore,
            overall_score: outfit.overallScore,
            pieces: outfit.pieces,
            stylist_rationale: outfit.stylistRationale
          });
        } catch {}
      })();
    }
  }

  getOutfitHistory(userId: string): Outfit[] {
    return [...this.getUserOutfits(userId)];
  }

  getStyleHistory(userId: string, timeFilter: '7d' | '30d' | '3m' | 'all' = '30d') {
    const now = new Date().getTime();
    let cutoffDays = 30;
    if (timeFilter === '7d') cutoffDays = 7;
    else if (timeFilter === '3m') cutoffDays = 90;
    else if (timeFilter === 'all') cutoffDays = 36500;

    const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
    const history = this.getUserOutfits(userId);
    
    const filteredOutfits = history.filter(o => {
      if (!o.createdAt) return true;
      const createdTime = new Date(o.createdAt).getTime();
      return (now - createdTime) <= cutoffMs;
    });

    const colorMap: Record<string, { name: string; hex: string; count: number }> = {};
    const styleMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const fitMap: Record<string, number> = {};

    filteredOutfits.forEach(outfit => {
      if (outfit.occasion) {
        styleMap[outfit.occasion] = (styleMap[outfit.occasion] || 0) + 1;
      }

      const pieces = [
        outfit.pieces?.top,
        outfit.pieces?.bottom,
        outfit.pieces?.outerwear,
        outfit.pieces?.footwear
      ].filter(Boolean);

      pieces.forEach(p => {
        if (!p) return;
        if (p.category) {
          categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
        }
        if (p.primaryColor?.name) {
          const key = p.primaryColor.name.toLowerCase();
          if (!colorMap[key]) {
            colorMap[key] = {
              name: p.primaryColor.name,
              hex: p.primaryColor.hex || '#6B7280',
              count: 0
            };
          }
          colorMap[key].count += 1;
        }
        if (p.fit) {
          fitMap[p.fit] = (fitMap[p.fit] || 0) + 1;
        }
      });
    });

    const colorCounts = Object.values(colorMap).sort((a, b) => b.count - a.count);
    const styleCounts = Object.entries(styleMap)
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => b.count - a.count);
    const categoryCounts = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    const fitCounts = Object.entries(fitMap)
      .map(([fit, count]) => ({ fit, count }))
      .sort((a, b) => b.count - a.count);

    return {
      timeFilter,
      totalOutfits: filteredOutfits.length,
      colorCounts,
      styleCounts,
      categoryCounts,
      fitCounts,
      outfits: filteredOutfits
    };
  }

  recordFeedback(userId: string, outfitId: string, liked: boolean, worn: boolean, notes?: string): Outfit | undefined {
    const outfits = this.getUserOutfits(userId);
    const outfit = outfits.find(o => o.id === outfitId);
    if (!outfit) return undefined;

    outfit.userFeedback = { liked, worn, notes };
    const profile = this.getStyleProfile(userId);

    const piecesList: WardrobeItem[] = [
      outfit.pieces.top,
      outfit.pieces.bottom,
      outfit.pieces.outerwear,
      outfit.pieces.footwear
    ].filter((p): p is WardrobeItem => Boolean(p));

    if (liked) {
      profile.likedOutfitsCount += 1;
      piecesList.forEach(p => {
        if (p.primaryColor && !profile.favoriteColors.includes(p.primaryColor.hex)) {
          profile.favoriteColors.push(p.primaryColor.hex);
        }
      });
    }

    if (worn) {
      profile.totalOutfitsWorn += 1;
      const wardrobe = this.getUserWardrobe(userId);
      piecesList.forEach(p => {
        const item = wardrobe.find(i => i.id === p.id);
        if (item) item.timesWorn += 1;
      });
    }

    this.profiles.set(userId, profile);
    return outfit;
  }
}

export const store = new StyloraStore();
