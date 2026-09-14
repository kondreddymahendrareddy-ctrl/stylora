import { ColorInfo, HarmonyType, WardrobeItem } from '../types/fashion.js';

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('') 
    : cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function isNeutral(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  const [, s, l] = rgbToHsl(r, g, b);
  // Low saturation or extreme lightness is considered neutral (blacks, whites, grays, beiges)
  if (s <= 15) return true;
  if (l >= 90 || l <= 12) return true;
  // Specific fashion neutrals like navy, olive, beige, denim
  const [h] = rgbToHsl(r, g, b);
  if (h >= 200 && h <= 240 && s <= 45 && l <= 35) return true; // Navy
  if (h >= 60 && h <= 100 && s <= 35 && l <= 40) return true; // Olive drab
  if (h >= 30 && h <= 50 && s <= 35 && l >= 70) return true; // Khaki / Cream
  return false;
}

export function analyzeColorHarmony(items: WardrobeItem[]): {
  harmonyType: HarmonyType;
  score: number;
  explanation: string;
} {
  const colors = items.map(i => {
    const [r, g, b] = hexToRgb(i.primaryColor.hex);
    const hsl = rgbToHsl(r, g, b);
    return {
      name: i.primaryColor.name,
      hex: i.primaryColor.hex,
      hsl,
      isNeutral: isNeutral(i.primaryColor.hex)
    };
  });

  const nonNeutrals = colors.filter(c => !c.isNeutral);

  // Case 1: Monochromatic or all neutrals with subtle tonal shifts
  if (nonNeutrals.length === 0) {
    return {
      harmonyType: 'neutral_anchor',
      score: 95,
      explanation: 'Quiet luxury neutral palette. Grounded in balanced tonal anchors (charcoals, creams, or navy) providing timeless sophistication without visual clutter.'
    };
  }

  if (nonNeutrals.length === 1) {
    return {
      harmonyType: 'neutral_anchor',
      score: 92,
      explanation: `60-30-10 accent structure: Features a focal statement (${nonNeutrals[0].name}) anchored against neutral supporting garments to let the key piece shine.`
    };
  }

  // Calculate hue distances between non-neutrals
  const hues = nonNeutrals.map(c => c.hsl[0]);
  let maxHueDiff = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      let diff = Math.abs(hues[i] - hues[j]);
      if (diff > 180) diff = 360 - diff;
      if (diff > maxHueDiff) maxHueDiff = diff;
    }
  }

  // Monochromatic: same hue family (diff < 25)
  if (maxHueDiff <= 25) {
    return {
      harmonyType: 'monochromatic',
      score: 94,
      explanation: `Harmonious monochromatic styling: Pairs nuanced depths of ${nonNeutrals[0].name} for an elongated, cohesive silhouette.`
    };
  }

  // Analogous: neighboring hues (diff between 25 and 65)
  if (maxHueDiff <= 65) {
    return {
      harmonyType: 'analogous',
      score: 90,
      explanation: `Analogous color relationship: Adjacent color-wheel tones blend naturally with warm, fluid visual progression.`
    };
  }

  // Complementary: opposite hues (diff between 150 and 180)
  if (maxHueDiff >= 145 && maxHueDiff <= 180) {
    return {
      harmonyType: 'complementary',
      score: 88,
      explanation: `High-impact complementary tension: Contrasting hues create energetic, confident visual pop balanced by fabric texture.`
    };
  }

  // Triadic or Split-Complementary
  if (maxHueDiff >= 105 && maxHueDiff < 145) {
    return {
      harmonyType: 'triadic',
      score: 85,
      explanation: `Triadic balance: Dynamic color pairing that creates depth and creative flair when layered appropriately.`
    };
  }

  return {
    harmonyType: 'tonal',
    score: 82,
    explanation: 'Balanced multi-tone combination where contrasting piece textures prevent color friction.'
  };
}
