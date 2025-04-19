const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

// Create or update user from Clerk webhook
const handleClerkWebhook = async (req, res) => {
  try {
    // In production, verify the webhook signature
    // const signature = req.headers['clerk-signature'];
    
    const { data, type } = req.body;
    
    // Handle user creation
    if (type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = data;
      
      // Get primary email
      const primaryEmail = email_addresses.find(email => email.primary)?.email_address;
      
      if (!primaryEmail) {
        return res.status(400).json({ message: 'User must have a primary email' });
      }
      
      // Create user in our database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          plan: 'free'
        }
      });
      
      return res.status(201).json({ success: true });
    }
    
    // Handle user update
    if (type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = data;
      
      // Get primary email
      const primaryEmail = email_addresses.find(email => email.primary)?.email_address;
      
      if (!primaryEmail) {
        return res.status(400).json({ message: 'User must have a primary email' });
      }
      
      // Find user by Clerk ID
      const existingUser = await prisma.user.findUnique({
        where: {
          clerkId: id
        }
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user
      await prisma.user.update({
        where: {
          clerkId: id
        },
        data: {
          email: primaryEmail,
          name: `${first_name || ''} ${last_name || ''}`.trim() || existingUser.name
        }
      });
      
      return res.status(200).json({ success: true });
    }
    
    // Handle user deletion
    if (type === 'user.deleted') {
      const { id } = data;
      
      // Find user by Clerk ID
      const existingUser = await prisma.user.findUnique({
        where: {
          clerkId: id
        }
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Delete user
      await prisma.user.delete({
        where: {
          clerkId: id
        }
      });
      
      return res.status(200).json({ success: true });
    }
    
    // Handle other webhook types
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Clerk webhook:', error);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
};

// Get JWT token for testing (in production, this would be handled by Clerk)
const getTestToken = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find or create a test user
    let user = await prisma.user.findUnique({
      where: {
        email
      }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: `test-${Date.now()}`,
          email,
          name: 'Test User',
          plan: 'free'
        }
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.CLERK_JWT_KEY,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    console.error('Error generating test token:', error);
    res.status(500).json({ message: 'Failed to generate test token' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  handleClerkWebhook,
  getTestToken
};
