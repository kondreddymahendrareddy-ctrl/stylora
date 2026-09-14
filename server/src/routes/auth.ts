import { Router } from 'express';
import { userStore } from '../services/userStore.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, styleArchetype, gender, skinTone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, and password are required.'
      });
    }

    const { user, token } = await userStore.signup({
      name,
      email,
      password,
      styleArchetype,
      gender,
      skinTone
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully and stored in Supabase.',
      token,
      user
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create account.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const { user, token } = await userStore.login({ email, password });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: err.message || 'Invalid email or password.'
    });
  }
});

// GET /api/auth/me - Validate active session token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await userStore.getUserByToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session has expired or token is invalid.'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Session verification failed.'
    });
  }
});

// PATCH /api/auth/profile - Update user profile attributes (gender, skin tone, archetype)
router.patch('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await userStore.getUserByToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session has expired or token is invalid.'
      });
    }

    const { gender, skinTone, styleArchetype, name } = req.body;
    const updatedUser = await userStore.updateProfile(user.id, {
      gender,
      skinTone,
      styleArchetype,
      name
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to update profile.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      userStore.logout(token);
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
