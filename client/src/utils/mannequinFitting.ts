import * as THREE from 'three';
import { Outfit } from '../types/fashion';

interface ImageCache {
  body: HTMLImageElement | null;
  top: HTMLImageElement | null;
  bottom: HTMLImageElement | null;
  shoes: HTMLImageElement | null;
}

const cache: ImageCache = {
  body: null,
  top: null,
  bottom: null,
  shoes: null
};

let preloadPromise: Promise<void> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load ${src}: ${e}`));
    img.src = src;
  });
}

/**
 * Preloads the segmented mannequin clothing templates
 */
export async function preloadMannequinAssets(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    try {
      const [body, top, bottom, shoes] = await Promise.all([
        loadImage('/images/mannequin/body.png'),
        loadImage('/images/mannequin/top_template.png'),
        loadImage('/images/mannequin/bottom_template.png'),
        loadImage('/images/mannequin/shoes_template.png')
      ]);
      cache.body = body;
      cache.top = top;
      cache.bottom = bottom;
      cache.shoes = shoes;
    } catch (err) {
      console.warn('Could not load segmented mannequin templates, falling back to base model:', err);
    }
  })();

  return preloadPromise;
}

/**
 * Composites the head/body with dynamically tinted top, bottom, and footwear
 * to render the 3D human mannequin wearing the user's selected preferable clothes.
 */
export function generateFittedMannequinCanvas(outfit: Outfit | null): HTMLCanvasElement | null {
  if (!cache.body || !cache.top || !cache.bottom || !cache.shoes) {
    return null;
  }

  const { body, top, bottom, shoes } = cache;
  const canvas = document.createElement('canvas');
  canvas.width = body.width || 354;
  canvas.height = body.height || 561;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Clear transparent canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Garment Colors from Selected Outfit
  const topHex = outfit?.pieces?.top?.primaryColor?.hex || '#4A6B5D';
  const bottomHex = outfit?.pieces?.bottom?.primaryColor?.hex || '#D4C4A8';
  const shoesHex = outfit?.pieces?.footwear?.primaryColor?.hex || '#8D5B36';

  // Helper to draw tinted garment layer while preserving natural fabric folds and shadows
  const drawTintedGarment = (template: HTMLImageElement, hex: string) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // 1. Draw greyscale template with shading
    tempCtx.drawImage(template, 0, 0);

    // 2. Tint with hex color using multiply (highlights & shadow contours remain)
    tempCtx.globalCompositeOperation = 'multiply';
    tempCtx.fillStyle = hex;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Mask out non-garment areas using original template's alpha channel
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(template, 0, 0);

    // 4. Draw onto main composite canvas
    ctx.drawImage(tempCanvas, 0, 0);
  };

  // 1. Draw Body (Head, Face, Neck, Hands)
  ctx.drawImage(body, 0, 0);

  // 2. Draw Preferable Top Garment
  drawTintedGarment(top, topHex);

  // 3. Draw Preferable Bottom Garment
  drawTintedGarment(bottom, bottomHex);

  // 4. Draw Preferable Footwear
  drawTintedGarment(shoes, shoesHex);

  return canvas;
}

/**
 * Creates or updates a Three.js CanvasTexture with the fitted clothes
 */
export async function createFittedThreeTexture(outfit: Outfit | null): Promise<THREE.Texture> {
  await preloadMannequinAssets();
  const canvas = generateFittedMannequinCanvas(outfit);

  if (canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  // Fallback to static base image if templates fail
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load('/images/male-mannequin-model.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    });
  });
}
