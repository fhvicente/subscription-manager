import express from 'express';

const router = express.Router();

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // TODO: Implement Stripe webhook handling
  
  res.status(200).json({ received: true });
});

export default router; 