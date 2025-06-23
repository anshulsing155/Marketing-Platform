import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Profile routes
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { id }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/profiles', async (req, res) => {
  try {
    const { id, email, full_name, role } = req.body;
    
    if (!id || !email) {
      return res.status(400).json({ error: 'ID and email are required' });
    }
    
    const profile = await prisma.profile.create({
      data: {
        id,
        email,
        full_name,
        role: role || 'USER'
      }
    });
    
    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.update({
      where: { id },
      data: req.body
    });
    
    res.json(profile);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
