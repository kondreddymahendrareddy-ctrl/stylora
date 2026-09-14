# STYLORA — AI Personal Stylist & Wardrobe Intelligence
> **Track 3 — Fashion x Technology**  
> *Focus: Using AI, software, data, and digital technology to solve real-world problems in fashion.*

---

## 🌟 Executive Overview
Most fashion technology apps push consumers to buy more clothes. **STYLORA** tackles the fundamental, sustainable reality: **"I have a closet full of clothes, but nothing to wear."**

STYLORA is a closed-loop digital wardrobe assistant powered by **Google Gemini 2.5** and mathematical **Color Harmony Theory**. It ingests photos of the clothes you already own, extracts their structured sartorial attributes, solves multi-piece outfit combinations matching your occasion and weather, and provides transparent **Explainable AI (XAI)** reasoning behind every pairing.

---

## 🧠 Core AI Engines & Technical Depth

### 1. Multimodal Wardrobe Vision Ingestion (`gemini.ts`)
* Ingests raw clothing photos.
* Extracts 14-point structured metadata using Gemini 2.5 Flash:
  * Category (`top`, `bottom`, `outerwear`, `footwear`)
  * Color temperature, exact hex code, and palette name
  * Fabric texture (`linen`, `wool flannel`, `ribbed knit`, `raw denim`)
  * Silhouette & fit (`oversized`, `tailored`, `relaxed`)
  * Formality rating (`1` for gym/loungewear to `10` for black tie)

### 2. Algorithmic Color Harmony Engine (`colorTheory.ts`)
* Converts hex codes to RGB and HSL polar coordinates.
* Evaluates chromatic distances across outfits:
  * **Monochromatic**: Nuanced tone-on-tone depths (hue delta < 25°).
  * **Analogous**: Adjacent hues for organic fluid progression (delta 25° - 65°).
  * **Complementary / Split-Complementary**: Strategic contrast tension (delta ~180°).
  * **60-30-10 Rule**: 60% dominant base, 30% secondary structure, 10% accent/footwear.
  * **Neutral Anchoring**: Balances saturated items against sartorial neutrals (navy, cream, olive, charcoal).

### 3. Combinatorial Constraint Solver (`outfitEngine.ts`)
* Solves valid permutations across Top + Bottom + Footwear + Outerwear.
* Filters against occasion formality targets (Casual, Smart Casual, Business Formal, Cocktail, Resort).
* Enforces silhouette proportion rules (e.g. relaxed top + tapered bottom).
* Adjusts layering density dynamically according to simulated or live temperature and weather.

### 4. Explainable AI (XAI) Stylist Rationale (`gemini.ts`)
* Instead of black-box suggestions, STYLORA generates an editorial critique:
  * **Curatorial Vision**: Visual weight and texture dialogue.
  * **Color Theory Physics**: Why the specific hues flatter each other.
  * **Silhouette Balance**: How cuts complement body proportion.
  * **Pro Stylist Tips**: Micro-adjustments (French tuck, sleeve rolls, trouser break).

### 5. Preference Learning & Memory Vector (`preferenceStore.ts`)
* Reinforcement from user feedback:
  * Clicking **Like** adjusts the user's affinity color vector.
  * Clicking **Worn Today** increments garment wear counters and updates the user's active style archetype (Minimalist, Quiet Luxury, Streetwear, Savile Row).

---

## 🚀 Quick Start Guide

### 1. Open in Your IDE
To open the project in your IDE:
```bash
# Visual Studio Code
code C:\Users\krish\.gemini\antigravity\scratch\stylora

# Or open Cursor
cursor C:\Users\krish\.gemini\antigravity\scratch\stylora
```

### 2. Install Dependencies
Open two terminals (one for backend, one for frontend):

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. (Optional) Configure Gemini API Key
Create a `.env` file in `server/`:
```bash
cp server/.env.example server/.env
```
Add your key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=your_actual_key_here
```
> *Note: If no key is provided, STYLORA automatically activates its intelligent heuristic AI engine so you can test all features immediately!*

### 4. Run Development Servers
**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
```
*(Runs on `http://localhost:5000`)*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*(Runs on `http://localhost:3000`)*

Open your browser at `http://localhost:3000` to interact with **STYLORA**!

---

## 📂 Project Architecture

```
stylora/
├── server/
│   ├── src/
│   │   ├── types/fashion.ts         # Garment, Outfit, Profile type contracts
│   │   ├── services/
│   │   │   ├── gemini.ts            # Gemini 2.5 Flash Vision & Stylist generation
│   │   │   ├── colorTheory.ts       # HSL color wheel & harmony algorithms
│   │   │   ├── outfitEngine.ts      # Combinatorial solver & scoring matrix
│   │   │   ├── preferenceStore.ts   # Dynamic style vector & wear history
│   │   │   └── seedData.ts          # Pre-loaded capsule wardrobe pieces
│   │   ├── routes/
│   │   │   ├── wardrobe.ts          # Ingestion & catalog endpoints
│   │   │   ├── outfits.ts           # Outfit generation & history
│   │   │   └── feedback.ts          # Likes, wears & archetype tuning
│   │   └── index.ts                 # Express REST server
│   └── package.json
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx           # Luxury header with archetype badge
    │   │   ├── WardrobeSection.tsx  # Filterable visual closet
    │   │   ├── UploadModal.tsx      # AI photo scanner & tag review
    │   │   ├── OutfitGenerator.tsx  # Occasion, climate & fit controls
    │   │   ├── OutfitCard.tsx       # Assembled garment canvas with score
    │   │   ├── StylistExplanationModal.tsx # "Why this works" XAI breakdown
    │   │   └── StyleProfileModal.tsx# Preference vector & stats
    │   ├── services/api.ts          # API connector
    │   ├── App.tsx                  # Root state orchestration
    │   └── index.css                # Tailwind luxury fashion design
    └── package.json
```
