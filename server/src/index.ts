import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import wardrobeRoutes from './routes/wardrobe.js';
import outfitRoutes from './routes/outfits.js';
import feedbackRoutes from './routes/feedback.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// Body parsing with 25MB limit for photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'STYLORA Personal Stylist API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✨ [STYLORA] Server running on http://localhost:${PORT}`);
});
