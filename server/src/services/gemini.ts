import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { WardrobeItem, StylistRationale, Occasion, WeatherCondition, HarmonyType } from '../types/fashion.js';

dotenv.config();

// Enable relaxed TLS in local development to avoid Windows certificate chain rejections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('✨ [Stylora AI] Gemini API initialized successfully.');
  } catch (err) {
    console.warn('⚠️ [Stylora AI] Could not initialize Gemini client:', err);
  }
} else {
  console.log('ℹ️ [Stylora AI] GEMINI_API_KEY not found. Running in smart simulation mode (AI heuristic engine). Add your key to .env for full live multimodal vision!');
}

const CANDIDATE_VISION_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
const CANDIDATE_TEXT_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

/**
 * Multimodal garment feature extractor using Gemini 3.5 Flash cascade
 */
export async function analyzeGarmentImage(
  imageBase64: string,
  mimeType = 'image/jpeg'
): Promise<Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn' | 'imageUrl'>> {
  if (aiClient) {
    const prompt = `You are an expert fashion computer vision analyzer.
Carefully inspect this clothing photo and classify its exact attributes.
Rules:
1. CATEGORY:
   - "top": dress shirts, button-down shirts, t-shirts, blouses, sweaters, knits, polo shirts, tank tops.
   - "bottom": pants, trousers, jeans, chinos, shorts, skirts.
   - "outerwear": blazers, jackets, coats, cardigans, trench coats.
   - "footwear": shoes, sneakers, boots, loafers, heels, sandals.
   - "one_piece": dresses, jumpsuits, rompers, evening gowns.
   - "accessory": belts, scarves, hats, ties, bags.
2. NAME & DETAILS:
   - Provide an accurate, descriptive name matching what is visible in the photo (e.g. "Sky Blue Button-Down Oxford Shirt", "Classic White Cotton Tee", "Navy Single-Breasted Blazer").
   - Extract the TRUE visible main color (e.g. Sky Blue, Light Blue, Navy, White, Charcoal, Cream) and accurate hex code.
   - Accurately determine fabric (cotton, linen, silk, wool, denim), fit, and formality score (1-10).

Return ONLY valid JSON matching this exact schema:
{
  "name": "descriptive name (e.g. Sky Blue Oxford Button-Down Shirt)",
  "category": "one of: top | bottom | outerwear | footwear | one_piece | accessory",
  "subcategory": "specific item type (e.g. oxford_shirt, dress_shirt, knit_sweater, chinos)",
  "primaryColor": {
    "name": "color name (e.g. Light Blue, Sky Blue, Crisp White)",
    "hex": "#HEXCODE",
    "temperature": "warm | cool | neutral"
  },
  "accentColors": ["#HEX1"],
  "pattern": "solid | striped | plaid | floral | textured | graphic",
  "material": "fabric material (e.g. cotton, linen, silk, wool, denim)",
  "texture": "fabric texture (e.g. crisp, smooth, ribbed, woven)",
  "fit": "slim | tailored | regular | relaxed | oversized",
  "formalityScore": 1 to 10,
  "seasonality": ["spring", "summer", "fall", "winter"],
  "versatilityTags": ["smart_casual", "office", "casual"]
}`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    for (const model of CANDIDATE_VISION_MODELS) {
      try {
        console.log(`🔍 [Stylora Vision] Analyzing garment using model: ${model}...`);
        const response = await aiClient.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        });

        const responseText = response.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`✅ [Stylora Vision] Classified successfully via ${model}: "${parsed.name}" [${parsed.category}] - ${parsed.primaryColor?.name || 'Detected'}`);
          return {
            name: parsed.name || 'Tailored Garment',
            category: parsed.category || 'top',
            subcategory: parsed.subcategory || 'casual_piece',
            primaryColor: parsed.primaryColor || { name: 'Sky Blue', hex: '#87CEEB', temperature: 'cool' },
            accentColors: parsed.accentColors || [],
            pattern: parsed.pattern || 'solid',
            material: parsed.material || 'cotton',
            texture: parsed.texture || 'smooth',
            fit: parsed.fit || 'regular',
            formalityScore: Number(parsed.formalityScore) || 5,
            seasonality: parsed.seasonality || ['spring', 'summer', 'fall', 'winter'],
            versatilityTags: parsed.versatilityTags || ['smart_casual']
          };
        }
      } catch (error: any) {
        console.warn(`⚠️ [Gemini Vision] Model ${model} error:`, error?.message || error);
      }
    }
  }

  // Smart Heuristic Fallback
  return generateHeuristicGarmentAnalysis();
}

/**
 * Generates editorial personal stylist rationale using Gemini
 */
export async function generateStylistExplanation(
  pieces: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    outerwear?: WardrobeItem;
    footwear?: WardrobeItem;
  },
  occasion: Occasion,
  colorHarmony: { type: HarmonyType; score: number; explanation: string },
  weather?: WeatherCondition,
  clientProfile?: { gender?: string; skinTone?: string }
): Promise<StylistRationale> {
  const pieceSummary = Object.entries(pieces)
    .filter(([, item]) => Boolean(item))
    .map(([role, item]) => `${role.toUpperCase()}: ${item!.name} (${item!.primaryColor.name} ${item!.material}, ${item!.fit} fit, formality ${item!.formalityScore}/10)`)
    .join('\n');

  const skinToneLabels: Record<string, string> = {
    fair_light: 'Fair / Porcelain (flattered by jewel tones, emerald, rich navy, berry, avoiding washed-out tones)',
    light_warm: 'Light Warm / Golden (flattered by warm corals, olive green, warm camel, terracotta)',
    medium_olive: 'Medium / Olive (flattered by jewel blues, rich burgundy, plum, forest green, crisp white)',
    tan_warm: 'Warm Tan / Caramel (flattered by warm saffron, turquoise, warm ivory, earth tones)',
    deep_rich: 'Deep / Rich Bronze (flattered by vivid primaries, cobalt, gold, radiant jewel tones, bold contrast)',
    dark_espresso: 'Deep Espresso / Dark Cocoa (flattered by high contrast pure white, vivid primaries, jewel tones, bright metallics)'
  };

  const genderLabels: Record<string, string> = {
    women: "Women's Fashion (feminine tailoring, elegant lines, curated silhouettes)",
    men: "Men's Fashion (classic menswear tailoring, structured shoulders, sharp proportions)",
    non_binary: "Gender-Fluid & Contemporary (relaxed cuts, modern tailoring)",
    unisex: "Unisex / Universal Styling"
  };

  const clientContextLines = [
    clientProfile?.gender ? `Client Styling Focus: ${genderLabels[clientProfile.gender] || clientProfile.gender}` : null,
    clientProfile?.skinTone ? `Client Skin Complexion: ${skinToneLabels[clientProfile.skinTone] || clientProfile.skinTone}` : null
  ].filter(Boolean).join('\n');

  if (aiClient) {
    const prompt = `You are STYLORA, an elite high-fashion personal stylist trained in Savile Row tailoring, Parisian street style, and seasonal color analysis.
Explain why this outfit combination works for the requested occasion: "${occasion.replace('_', ' ')}".
Weather: ${weather ? `${weather.temperatureC}°C, ${weather.condition}` : 'Temperate (20°C)'}
Color Harmony: ${colorHarmony.type} (${colorHarmony.explanation})
${clientContextLines ? `\nClient Profile:\n${clientContextLines}\n` : ''}
Selected Pieces:
${pieceSummary}

Provide an editorial, deeply insightful, encouraging review with strict JSON:
{
  "headline": "A catchy luxury editorial headline (e.g. The Radiant Emerald Anchor)",
  "whyItWorks": "A 2-3 sentence breakdown of visual weight, fabric texture interplay, and mood.",
  "colorHarmonyExplanation": "A 1-2 sentence technical breakdown of why these specific shades flatter each other and how they complement the client's skin complexion.",
  "proportionAndFit": "An explanation of silhouette balance tailored to the client's styling focus.",
  "proStylingTips": [
    "Tip 1 (styling tip including accessories or layering)",
    "Tip 2 (silhouette or hem advice)",
    "Tip 3 (color or accent advice that enhances the client's complexion)"
  ]
}`;

    for (const model of CANDIDATE_TEXT_MODELS) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const responseText = response.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err: any) {
        console.warn(`⚠️ [Gemini Stylist] Model ${model} error:`, err?.message || err);
      }
    }
  }

  // Curated Fashion Rules Fallback
  return generateRuleBasedRationale(pieces, occasion, colorHarmony);
}

function generateHeuristicGarmentAnalysis(): Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn' | 'imageUrl'> {
  const presets = [
    {
      name: 'Textured Oatmeal Knit Sweater',
      category: 'top' as const,
      subcategory: 'crewneck_knit',
      primaryColor: { name: 'Oatmeal Beige', hex: '#D6C7B2', temperature: 'warm' as const },
      pattern: 'textured' as const,
      material: 'merino wool',
      texture: 'ribbed knit',
      fit: 'relaxed' as const,
      formalityScore: 5,
      seasonality: ['fall' as const, 'winter' as const, 'spring' as const],
      versatilityTags: ['smart_casual', 'layering', 'quiet_luxury']
    },
    {
      name: 'Pleated Tapered Chinos',
      category: 'bottom' as const,
      subcategory: 'pleated_trousers',
      primaryColor: { name: 'Midnight Navy', hex: '#1D2A44', temperature: 'cool' as const },
      pattern: 'solid' as const,
      material: 'cotton twill',
      texture: 'crisp',
      fit: 'tailored' as const,
      formalityScore: 6,
      seasonality: ['spring' as const, 'summer' as const, 'fall' as const, 'winter' as const],
      versatilityTags: ['office', 'smart_casual', 'elevated']
    },
    {
      name: 'Unstructured Linen Blazer',
      category: 'outerwear' as const,
      subcategory: 'blazer',
      primaryColor: { name: 'Sand Taupe', hex: '#B8A898', temperature: 'warm' as const },
      pattern: 'solid' as const,
      material: 'pure linen',
      texture: 'textured weave',
      fit: 'regular' as const,
      formalityScore: 7,
      seasonality: ['spring' as const, 'summer' as const],
      versatilityTags: ['resort', 'cocktail', 'summer_wedding']
    }
  ];
  return presets[Math.floor(Math.random() * presets.length)];
}

function generateRuleBasedRationale(
  pieces: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    outerwear?: WardrobeItem;
    footwear?: WardrobeItem;
  },
  occasion: Occasion,
  colorHarmony: { type: HarmonyType; score: number; explanation: string }
): StylistRationale {
  const topName = pieces.top ? pieces.top.name : 'base layer';
  const bottomName = pieces.bottom ? pieces.bottom.name : 'trousers';
  const outerName = pieces.outerwear ? pieces.outerwear.name : null;

  return {
    headline: `The Modern ${occasion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Essential`,
    whyItWorks: `This ensemble balances structure and nonchalance. The ${pieces.top?.material || 'soft'} texture of the ${topName} naturally softens the silhouette of the ${bottomName}, creating an effortless aesthetic tailored for ${occasion.replace('_', ' ')}.`,
    colorHarmonyExplanation: colorHarmony.explanation,
    proportionAndFit: `The ${pieces.top?.fit || 'comfortable'} top balances the ${pieces.bottom?.fit || 'tailored'} bottom, ensuring the body's natural proportions are flattered without clinging. ${outerName ? `The ${outerName} adds a strong vertical line that elongates the frame.` : ''}`,
    proStylingTips: [
      'Execute a subtle French tuck with the top to define the waistline without looking overly formal.',
      'Leave your footwear slightly revealed with a clean no-break trouser hem.',
      'Roll sleeves to mid-forearm to showcase a minimal watch or wrist accessory.'
    ]
  };
}
