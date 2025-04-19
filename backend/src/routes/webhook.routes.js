const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const bodyParser = require('body-parser');
const prisma = require('../lib/prisma');

// Webhook signing secret from Clerk Dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Use raw body for webhook verification
router.use(
  bodyParser.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const payload = req.body;
      const headers = req.headers;
      
      // Create a new Webhook instance with your secret
      const wh = new Webhook(WEBHOOK_SECRET);
      
      // Verify the webhook payload
      const evt = wh.verify(payload, headers);
      
      // Parse the raw body
      req.body = JSON.parse(payload);
      
      next();
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
  }
);

// Handle user creation webhook
router.post('/clerk', async (req, res) => {
  const { type, data } = req.body;
  
  try {
    switch (type) {
      case 'user.created':
        // Create user in your database
        await prisma.user.create({
          data: {
            id: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name} ${data.last_name}`.trim(),
            imageUrl: data.image_url,
          },
        });
        break;
        
      case 'user.updated':
        // Update user in your database
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data.email_addresses[0].email_address,
            name: `${data.first_name} ${data.last_name}`.trim(),
            imageUrl: data.image_url,
          },
        });
        break;
        
      case 'user.deleted':
        // Delete user from your database
        await prisma.user.delete({
          where: { id: data.id },
        });
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

module.exports = router; 