import { Router } from 'express';
import { store } from '../services/preferenceStore.js';
import { analyzeGarmentImage } from '../services/gemini.js';
import { uploadGarmentPhotoToSupabase } from '../services/supabase.js';
import { getUserIdFromRequest } from '../middleware/auth.js';

const router = Router();

// GET all items in the logged-in user's personal closet
router.get('/', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const { category } = req.query;
    let items = await store.getWardrobe(userId);

    if (category && typeof category === 'string') {
      items = items.filter(item => item.category === category);
    }
    res.json({ success: true, count: items.length, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST analyze an uploaded image with Gemini Multimodal Vision
router.post('/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    const analyzedAttributes = await analyzeGarmentImage(imageBase64, mimeType || 'image/jpeg');
    res.json({ success: true, attributes: analyzedAttributes });
  } catch (error: any) {
    console.error('Error analyzing garment image:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze image' });
  }
});

// POST save confirmed item into the user's personal wardrobe
router.post('/', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const itemData = req.body;

    if (!itemData.name || !itemData.category || !itemData.primaryColor) {
      return res.status(400).json({ success: false, error: 'Name, category, and primaryColor are required.' });
    }

    // Automatically upload base64 image to Supabase Storage isolated under this user's directory
    if (itemData.imageUrl && itemData.imageUrl.startsWith('data:image/')) {
      const publicCdnUrl = await uploadGarmentPhotoToSupabase(itemData.imageUrl, itemData.category, userId);
      if (publicCdnUrl) {
        itemData.imageUrl = publicCdnUrl;
      }
    }

    const saved = await store.addWardrobeItem(userId, itemData);
    res.status(201).json({ success: true, item: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE item from the user's personal wardrobe
router.delete('/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = req.params;
    const deleted = await store.deleteWardrobeItem(userId, id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Garment not found' });
    }
    res.json({ success: true, message: 'Garment removed from personal wardrobe' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset current user's wardrobe and stats to empty/zero
router.post('/reset', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    await store.resetAll(userId);
    res.json({ success: true, count: 0, items: [], profile: store.getStyleProfile(userId) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST seed sample wardrobe for the current user
router.post('/seed', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const items = await store.loadSampleWardrobe(userId);
    res.json({ success: true, count: items.length, items, profile: store.getStyleProfile(userId) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
