import { Router } from 'express';
import { store } from '../services/preferenceStore.js';
import { generateOutfitRecommendations } from '../services/outfitEngine.js';
import { GenerateOutfitRequest } from '../types/fashion.js';
import { getUserIdFromRequest } from '../middleware/auth.js';
import { userStore } from '../services/userStore.js';

const router = Router();

// POST generate outfit recommendations from the user's isolated wardrobe
router.post('/generate', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const request: GenerateOutfitRequest = req.body;
    if (!request.occasion) {
      return res.status(400).json({ success: false, error: 'Occasion is required' });
    }

    // Resolve user's saved gender and skin tone preferences
    const user = await userStore.getUserById(userId);
    const effectiveGender = request.gender || user?.gender || 'unisex';
    const effectiveSkinTone = request.skinTone || user?.skinTone || 'medium_olive';

    const wardrobe = await store.getWardrobe(userId);
    const outfits = await generateOutfitRecommendations(wardrobe, {
      ...request,
      gender: effectiveGender,
      skinTone: effectiveSkinTone
    });

    // Save generated outfits into user's private history
    outfits.forEach(outfit => store.saveOutfit(userId, outfit));

    res.json({ success: true, count: outfits.length, outfits });
  } catch (error: any) {
    console.error('Error generating outfits:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate outfits' });
  }
});

// GET outfit history & analytics for current user
router.get('/history', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const filter = (req.query.filter as '7d' | '30d' | '3m' | 'all') || '30d';
    const analytics = store.getStyleHistory(userId, filter);
    res.json({ success: true, ...analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
