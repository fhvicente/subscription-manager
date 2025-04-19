import express from 'express';
import { Webhook } from 'svix';
import bodyParser from 'body-parser';
import { get, run, query } from '../db/database.js';

const router = express.Router();

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
        await run(
          `INSERT INTO users (id, email, name, imageUrl) 
           VALUES (?, ?, ?, ?)`,
          [
            data.id,
            data.email_addresses[0].email_address,
            `${data.first_name} ${data.last_name}`.trim(),
            data.image_url
          ]
        );
        break;
        
      case 'user.updated':
        // Update user in your database
        await run(
          `UPDATE users 
           SET email = ?, name = ?, imageUrl = ? 
           WHERE id = ?`,
          [
            data.email_addresses[0].email_address,
            `${data.first_name} ${data.last_name}`.trim(),
            data.image_url,
            data.id
          ]
        );
        break;
        
      case 'user.deleted':
        // Delete user from your database
        await run(
          'DELETE FROM users WHERE id = ?',
          [data.id]
        );
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

export default router; 