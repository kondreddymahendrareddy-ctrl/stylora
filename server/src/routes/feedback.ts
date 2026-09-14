import { Router } from 'express';
import { store } from '../services/preferenceStore.js';
import { getUserIdFromRequest } from '../middleware/auth.js';

const router = Router();

// POST record feedback on an outfit
router.post('/outfit', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const { outfitId, liked, worn, notes } = req.body;
    if (!outfitId) {
      return res.status(400).json({ success: false, error: 'outfitId is required' });
    }

    const updatedOutfit = store.recordFeedback(userId, outfitId, Boolean(liked), Boolean(worn), notes);
    if (!updatedOutfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }

    res.json({ success: true, outfit: updatedOutfit, profile: store.getStyleProfile(userId) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET user style profile
router.get('/profile', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const profile = store.getStyleProfile(userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH update style archetype
router.patch('/profile/archetype', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const { archetype } = req.body;
    if (!archetype) {
      return res.status(400).json({ success: false, error: 'archetype is required' });
    }
    store.updateArchetype(userId, archetype);
    res.json({ success: true, profile: store.getStyleProfile(userId) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
