import { 
  WardrobeItem, 
  Outfit, 
  GenerateOutfitRequest, 
  Occasion, 
  WeatherCondition,
  BodyFitPreference 
} from '../types/fashion.js';
import { analyzeColorHarmony } from './colorTheory.js';
import { generateStylistExplanation } from './gemini.js';

interface OutfitCandidate {
  top: WardrobeItem;
  bottom: WardrobeItem;
  outerwear?: WardrobeItem;
  footwear: WardrobeItem;
  score: number;
}

const OCCASION_FORMALITY_MAP: Record<Occasion, { min: number; ideal: number; max: number }> = {
  casual: { min: 1, ideal: 3, max: 6 },
  athleisure: { min: 1, ideal: 2, max: 4 },
  smart_casual: { min: 4, ideal: 6, max: 8 },
  business_formal: { min: 7, ideal: 8.5, max: 10 },
  evening_cocktail: { min: 7, ideal: 8.5, max: 10 },
  date_night: { min: 5, ideal: 7, max: 9 },
  vacation_resort: { min: 3, ideal: 5, max: 7 }
};

export async function generateOutfitRecommendations(
  wardrobe: WardrobeItem[],
  request: GenerateOutfitRequest
): Promise<Outfit[]> {
  const { occasion, weather, fitPreference, lockedItemIds } = request;

  const tops = wardrobe.filter(i => i.category === 'top');
  const bottoms = wardrobe.filter(i => i.category === 'bottom');
  const outerwears = wardrobe.filter(i => i.category === 'outerwear');
  const footwears = wardrobe.filter(i => i.category === 'footwear');

  if (tops.length === 0 || bottoms.length === 0 || footwears.length === 0) {
    throw new Error('Your digital closet needs at least one top, one bottom, and one footwear item to generate outfits. Click "+ ADD TO CLOSET" to upload clothes!');
  }

  const formalityTarget = OCCASION_FORMALITY_MAP[occasion] || { min: 3, ideal: 5, max: 8 };
  const temp = weather?.temperatureC ?? 21;
  const needsOuterwear = temp <= 16;
  const optionalOuterwear = temp > 16 && temp <= 22;

  const candidates: OutfitCandidate[] = [];

  // Combinatorial permutation
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const footwear of footwears) {
        // Formality coherence check
        const avgFormality = (top.formalityScore + bottom.formalityScore + footwear.formalityScore) / 3;
        if (avgFormality < formalityTarget.min || avgFormality > formalityTarget.max) {
          continue;
        }

        // Check locked items constraint
        if (lockedItemIds && lockedItemIds.length > 0) {
          const pieceIds = [top.id, bottom.id, footwear.id];
          const hasLocked = lockedItemIds.every(id => pieceIds.includes(id));
          if (!hasLocked) continue;
        }

        // Outerwear logic
        const outerOptions: (WardrobeItem | undefined)[] = needsOuterwear 
          ? outerwears 
          : (optionalOuterwear ? [...outerwears, undefined] : [undefined]);

        for (const outer of outerOptions) {
          const allPieces: WardrobeItem[] = [top, bottom, footwear];
          if (outer) allPieces.push(outer);

          // Color Harmony Analysis
          const colorAnalysis = analyzeColorHarmony(allPieces);

          // Scoring algorithm
          let score = colorAnalysis.score * 0.4;

          // Formality proximity
          const totalPieces = allPieces.length;
          const currentFormality = allPieces.reduce((acc, p) => acc + p.formalityScore, 0) / totalPieces;
          const formalityDiff = Math.abs(currentFormality - formalityTarget.ideal);
          score += Math.max(0, 30 - formalityDiff * 7);

          // Fit / silhouette proportion scoring
          if (fitPreference) {
            score += evaluateFitProportion(top, bottom, fitPreference);
          } else {
            // Default: contrast fit scores well (e.g. relaxed top + tailored bottom)
            if (top.fit !== bottom.fit) score += 15;
            else score += 10;
          }

          // Weather appropriateness
          if (needsOuterwear && outer) score += 15;
          if (!needsOuterwear && !outer) score += 15;

          // Complexion & Skin Tone Color Flattery
          score += evaluateSkinToneHarmony(allPieces, request.skinTone);

          // Gender Silhouette & Tailoring Alignment
          score += evaluateGenderSilhouette(allPieces, request.gender);

          candidates.push({
            top,
            bottom,
            outerwear: outer,
            footwear,
            score: Math.min(100, Math.round(score))
          });
        }
      }
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Pick top 3 diverse candidates
  const selectedCandidates = pickDiverseCandidates(candidates, 3);

  // Generate deep AI rationale for each selected outfit
  const outfits: Outfit[] = await Promise.all(
    selectedCandidates.map(async (cand, index) => {
      const piecesList: WardrobeItem[] = [cand.top, cand.bottom, cand.footwear];
      if (cand.outerwear) piecesList.push(cand.outerwear);

      const colorAnalysis = analyzeColorHarmony(piecesList);
      const piecesMap = {
        top: cand.top,
        bottom: cand.bottom,
        outerwear: cand.outerwear,
        footwear: cand.footwear
      };

      const stylistRationale = await generateStylistExplanation(
        piecesMap,
        occasion,
        {
          type: colorAnalysis.harmonyType,
          score: colorAnalysis.score,
          explanation: colorAnalysis.explanation
        },
        weather,
        {
          gender: request.gender,
          skinTone: request.skinTone
        }
      );

      const alternativeTitles = [
        'The Architectural Anchor',
        'The Effortless Minimalist',
        'The Nuanced Statement'
      ];

      return {
        id: `outfit-${Date.now()}-${index}`,
        name: stylistRationale.headline || alternativeTitles[index % alternativeTitles.length],
        pieces: piecesMap,
        occasion,
        colorHarmonyType: colorAnalysis.harmonyType,
        harmonyScore: colorAnalysis.score,
        overallScore: cand.score,
        stylistRationale,
        weatherFit: `${temp}°C ${weather?.condition || 'Clear'} • ${needsOuterwear ? 'Layered insulation' : 'Comfortable breathable drape'}`,
        createdAt: new Date().toISOString()
      };
    })
  );

  return outfits;
}

function evaluateFitProportion(top: WardrobeItem, bottom: WardrobeItem, pref: BodyFitPreference): number {
  if (pref === 'oversized_top_slim_bottom') {
    if ((top.fit === 'oversized' || top.fit === 'relaxed') && (bottom.fit === 'slim' || bottom.fit === 'tailored')) {
      return 15;
    }
  }
  if (pref === 'fitted_top_relaxed_bottom') {
    if ((top.fit === 'slim' || top.fit === 'tailored') && (bottom.fit === 'relaxed' || bottom.fit === 'oversized')) {
      return 15;
    }
  }
  if (pref === 'tailored_all') {
    if (top.fit === 'tailored' && bottom.fit === 'tailored') return 15;
  }
  if (pref === 'relaxed_all') {
    if ((top.fit === 'relaxed' || top.fit === 'oversized') && (bottom.fit === 'relaxed' || bottom.fit === 'oversized')) return 15;
  }
  return 8;
}

function pickDiverseCandidates(candidates: OutfitCandidate[], count: number): OutfitCandidate[] {
  if (candidates.length <= count) return candidates;

  const result: OutfitCandidate[] = [candidates[0]];
  const usedTopIds = new Set([candidates[0].top.id]);
  const usedBottomIds = new Set([candidates[0].bottom.id]);

  for (let i = 1; i < candidates.length && result.length < count; i++) {
    const candidate = candidates[i];
    // Encourage garment diversity across recommendations
    const isDiverse = !usedTopIds.has(candidate.top.id) || !usedBottomIds.has(candidate.bottom.id);
    if (isDiverse) {
      result.push(candidate);
      usedTopIds.add(candidate.top.id);
      usedBottomIds.add(candidate.bottom.id);
    }
  }

  // If we still need more to reach count, fill with remaining highest scoring
  for (let i = 1; i < candidates.length && result.length < count; i++) {
    if (!result.includes(candidates[i])) {
      result.push(candidates[i]);
    }
  }

  return result;
}

function evaluateSkinToneHarmony(pieces: WardrobeItem[], skinTone?: string): number {
  if (!skinTone) return 5;
  const colors = pieces.map(p => (p.primaryColor?.name || '').toLowerCase());

  switch (skinTone) {
    case 'fair_light':
      // Flattered by deep jewel tones, crisp navy, emerald, rich ruby, slate; avoids washed-out beige
      if (colors.some(c => c.includes('navy') || c.includes('blue') || c.includes('emerald') || c.includes('black') || c.includes('burgundy'))) {
        return 12;
      }
      return 6;
    case 'light_warm':
      // Flattered by warm corals, terracotta, olive, camel, warm cream, rust
      if (colors.some(c => c.includes('olive') || c.includes('brown') || c.includes('camel') || c.includes('cream') || c.includes('beige') || c.includes('coral'))) {
        return 12;
      }
      return 6;
    case 'medium_olive':
      // Flattered by jewel tones, plum, burgundy, forest green, crisp white, cobalt
      if (colors.some(c => c.includes('white') || c.includes('green') || c.includes('burgundy') || c.includes('plum') || c.includes('blue'))) {
        return 12;
      }
      return 6;
    case 'tan_warm':
      // Flattered by rich earth tones, turquoise, saffron yellow, warm ivory, bronze, coral
      if (colors.some(c => c.includes('cream') || c.includes('tan') || c.includes('yellow') || c.includes('blue') || c.includes('orange') || c.includes('gold'))) {
        return 12;
      }
      return 6;
    case 'deep_rich':
      // Flattered by bold saturated primaries, royal blue, gold, fuchsia, vibrant yellow, contrast white
      if (colors.some(c => c.includes('royal') || c.includes('gold') || c.includes('yellow') || c.includes('white') || c.includes('red') || c.includes('blue'))) {
        return 12;
      }
      return 6;
    case 'dark_espresso':
      // Flattered by striking brights, pure white, vivid primary colors, striking metallics
      if (colors.some(c => c.includes('white') || c.includes('cobalt') || c.includes('red') || c.includes('yellow') || c.includes('silver') || c.includes('gold'))) {
        return 12;
      }
      return 6;
    default:
      return 6;
  }
}

function evaluateGenderSilhouette(pieces: WardrobeItem[], gender?: string): number {
  if (!gender || gender === 'unisex') return 5;
  // Feminine styling: award versatility for fluid cuts and balance
  if (gender === 'women') {
    const hasDressesOrFlow = pieces.some(p => p.subcategory?.includes('dress') || p.subcategory?.includes('skirt') || p.fit === 'relaxed' || p.fit === 'tailored');
    return hasDressesOrFlow ? 10 : 7;
  }
  // Menswear styling: award structured tailoring and balanced lines
  if (gender === 'men') {
    const hasStructured = pieces.some(p => p.fit === 'tailored' || p.category === 'outerwear');
    return hasStructured ? 10 : 7;
  }
  return 7;
}
