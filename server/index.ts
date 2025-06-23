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
    console.log('Fetching profile for ID:', id);
    
    const profile = await prisma.profile.findUnique({
      where: { id }
    });
    
    if (!profile) {
      console.log('Profile not found for ID:', id);
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    console.log('Profile found:', profile);
    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/profiles', async (req, res) => {
  try {
    const { id, email, full_name, role } = req.body;
    
    console.log('Creating profile with data:', { id, email, full_name, role });
    
    if (!id || !email) {
      return res.status(400).json({ error: 'ID and email are required' });
    }
    
    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id }
    });
    
    if (existingProfile) {
      console.log('Profile already exists, returning existing profile:', existingProfile);
      return res.status(200).json(existingProfile);
    }
    
    // Create new profile
    const profile = await prisma.profile.create({
      data: {
        id,
        email,
        full_name,
        role: role || 'USER'
      }
    });
    
    console.log('Profile created successfully:', profile);
    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error creating profile:', error);
    if (error.code === 'P2002') {
      // Unique constraint violation, likely email already exists
      return res.status(409).json({ error: 'A profile with this email already exists' });
    }
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

// Subscriber routes
app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(subscribers);
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/subscribers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
      include: {
        group_subscribers: {
          include: {
            group: true
          }
        }
      }
    });
    
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    
    res.json(subscriber);
  } catch (error: any) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/subscribers', async (req, res) => {
  try {
    const { email, phone, first_name, last_name, whatsapp_opt_in, status } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        phone,
        first_name,
        last_name,
        whatsapp_opt_in: whatsapp_opt_in || false,
        status: status || 'ACTIVE'
      }
    });
    
    res.status(201).json(subscriber);
  } catch (error: any) {
    console.error('Error creating subscriber:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/subscribers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: req.body
    });
    
    res.json(subscriber);
  } catch (error: any) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/subscribers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subscriber.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Group routes
app.get('/api/groups', async (req, res) => {
  try {
    console.log('Fetching groups...');
    const groups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            group_subscribers: true // Changed from 'subscribers' to 'group_subscribers'
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Map the response to match the expected format in the frontend
    const formattedGroups = groups.map(group => ({
      ...group,
      _count: {
        subscribers: group._count.group_subscribers // Rename for frontend compatibility
      }
    }));
    
    console.log('Successfully fetched groups:', formattedGroups.length);
    res.json(formattedGroups);
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await prisma.userGroup.findUnique({
      where: { id },
      include: {
        group_subscribers: { // Changed from 'subscribers' to 'group_subscribers'
          include: {
            subscriber: true
          }
        },
        _count: {
          select: {
            group_subscribers: true // Changed from 'subscribers' to 'group_subscribers'
          }
        }
      }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Format response to match frontend expectations
    const formattedGroup = {
      ...group,
      subscribers: group.group_subscribers, // Provide as 'subscribers' for frontend compatibility
      _count: {
        subscribers: group._count.group_subscribers // Rename for frontend compatibility
      }
    };
    
    res.json(formattedGroup);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, created_by } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (!created_by) {
      return res.status(400).json({ error: 'User ID (created_by) is required' });
    }
    
    // Check if the profile exists first
    const profile = await prisma.profile.findUnique({
      where: { id: created_by }
    });
    
    if (!profile) {
      console.error(`Profile with ID ${created_by} not found. Cannot create group.`);
      
      return res.status(404).json({ 
        error: `Profile with ID ${created_by} not found. Cannot create group. Please ensure your profile is created first.`,
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    console.log(`Creating group "${name}" for profile ${profile.id} (${profile.email})`);
    
    // Create the group with explicit creator relation
    const createData = {
      data: {
        name,
        description,
        creator: {
          connect: {
            id: created_by
          }
        }
      }
    };
    
    console.log('Creating group with data:', JSON.stringify(createData, null, 2));
    
    try {
      // First attempt with proper relational data
      const group = await prisma.userGroup.create(createData);
      console.log(`Group created successfully with ID: ${group.id}`);
      res.status(201).json(group);
    } catch (prismaError) {
      console.error('Prisma error details:', prismaError);
      
      // Second attempt with direct field assignment
      console.log('Trying alternative creation method...');
      const fallbackGroup = await prisma.$queryRaw`
        INSERT INTO user_groups (name, description, created_by, created_at, updated_at)
        VALUES (${name}, ${description}, ${created_by}, NOW(), NOW())
        RETURNING *;
      `;
      
      console.log(`Group created with fallback method:`, fallbackGroup);
      res.status(201).json(fallbackGroup);
    }
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await prisma.userGroup.update({
      where: { id },
      data: req.body
    });
    
    res.json(group);
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.userGroup.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/groups/:groupId/subscribers/:subscriberId', async (req, res) => {
  try {
    const { groupId, subscriberId } = req.params;
    
    await prisma.groupSubscriber.create({
      data: {
        group_id: groupId,
        subscriber_id: subscriberId
      }
    });
    
    res.status(201).send();
  } catch (error: any) {
    console.error('Error adding subscriber to group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/groups/:groupId/subscribers/:subscriberId', async (req, res) => {
  try {
    const { groupId, subscriberId } = req.params;
    
    await prisma.groupSubscriber.delete({
      where: {
        group_id_subscriber_id: {
          group_id: groupId,
          subscriber_id: subscriberId
        }
      }
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing subscriber from group:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
