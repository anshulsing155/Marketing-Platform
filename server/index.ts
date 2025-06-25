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
    
    // Try using Prisma first
    try {
      const groups = await prisma.userGroup.findMany({
        include: {
          _count: {
            select: {
              group_subscribers: true
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
      
      console.log('Successfully fetched groups via Prisma:', formattedGroups.length);
      res.json(formattedGroups);
    } catch (prismaError) {
      console.error('Error fetching groups with Prisma, trying raw SQL:', prismaError);
      
      // Fallback to raw SQL if Prisma fails
      const rawGroups = await prisma.$queryRaw`
        SELECT ug.*, COUNT(gs.id) as subscriber_count
        FROM "user_groups" ug
        LEFT JOIN "group_subscribers" gs ON ug.id = gs.group_id
        GROUP BY ug.id
        ORDER BY ug.created_at DESC
      `;
      
      // Format the raw SQL results to match the expected frontend format
      const formattedGroups = Array.isArray(rawGroups) ? rawGroups.map(group => ({
        ...group,
        _count: {
          subscribers: parseInt(group.subscriber_count || '0', 10)
        }
      })) : [];
      
      console.log('Successfully fetched groups via SQL:', formattedGroups.length);
      res.json(formattedGroups);
    }
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
    
    console.log('Creating group with:', { name, description, created_by });
    
    // Skip the Prisma ORM entirely and use direct SQL
    try {
      // Using $executeRaw for a direct SQL insert
      const result = await prisma.$executeRaw`
        INSERT INTO "user_groups" ("id", "name", "description", "created_by", "created_at", "updated_at")
        VALUES (
          gen_random_uuid(), 
          ${name}, 
          ${description || null}, 
          ${created_by}::uuid, 
          NOW(), 
          NOW()
        )
      `;
      
      console.log('Group inserted via raw SQL, result:', result);
      
      // Fetch the newly created group
      const newGroups = await prisma.$queryRaw`
        SELECT * FROM "user_groups" 
        WHERE "name" = ${name} 
        AND "created_by" = ${created_by}::uuid
        ORDER BY "created_at" DESC 
        LIMIT 1
      `;
      
      const newGroup = Array.isArray(newGroups) && newGroups.length > 0 ? newGroups[0] : null;
      
      if (!newGroup) {
        throw new Error('Group was created but could not be retrieved');
      }
      
      console.log('Successfully created group:', newGroup);
      res.status(201).json(newGroup);
    } catch (sqlError) {
      console.error('SQL error:', sqlError);
      throw new Error(`Failed to create group: ${sqlError.message}`);
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

// Campaign routes
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const data = req.body;
    const campaign = await prisma.campaign.create({
      data
    });
    res.status(201).json(campaign);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: req.body
    });
    res.json(campaign);
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.campaign.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Email templates routes
app.get('/api/email_templates', async (req, res) => {
  try {
    const emailTemplates = await prisma.emailTemplate.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(emailTemplates);
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/email_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    if (!emailTemplate) {
      return res.status(404).json({ error: 'Email template not found' });
    }
    res.json(emailTemplate);
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/email_templates', async (req, res) => {
  try {
    const data = req.body;
    const emailTemplate = await prisma.emailTemplate.create({
      data
    });
    res.status(201).json(emailTemplate);
  } catch (error: any) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/email_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const emailTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: req.body
    });
    res.json(emailTemplate);
  } catch (error: any) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/email_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.emailTemplate.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});


// WhatsApp templates routes
app.get('/api/whatsapp_templates', async (req, res) => {
  try {
    const whatsappTemplates = await prisma.whatsAppTemplate.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(whatsappTemplates);
  } catch (error: any) {
    console.error('Error fetching whatsapp templates:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/whatsapp_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const whatsappTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id }
    });
    if (!whatsappTemplate) {
      return res.status(404).json({ error: 'WhatsApp template not found' });
    }
    res.json(whatsappTemplate);
  } catch (error: any) {
    console.error('Error fetching whatsapp template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/whatsapp_templates', async (req, res) => {
  try {
    const data = req.body;
    const whatsappTemplate = await prisma.whatsAppTemplate.create({
      data
    });
    res.status(201).json(whatsappTemplate);
  } catch (error: any) {
    console.error('Error creating whatsapp template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/whatsapp_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const whatsappTemplate = await prisma.whatsAppTemplate.update({
      where: { id },
      data: req.body
    });
    res.json(whatsappTemplate);
  } catch (error: any) {
    console.error('Error updating whatsapp template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/whatsapp_templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.whatsAppTemplate.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting whatsapp template:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
