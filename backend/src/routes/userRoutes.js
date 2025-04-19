const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Public routes
router.post('/webhook', userController.handleClerkWebhook);

// Temporary route to create user manually
router.post('/create-temp', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ message: 'clerkId and email are required' });
    }

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim() || null,
        plan: 'free'
      }
    });
    
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

// Protected routes
router.get('/profile', authenticate, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateUserProfile);

module.exports = router;
