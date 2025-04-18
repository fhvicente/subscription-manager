const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Apply authentication middleware to all routes except webhook
router.use('/webhook', express.raw({ type: 'application/json' }));

// Webhook doesn't need authentication
router.post('/webhook', paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

// Create checkout session
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

// Get subscription status
router.get('/subscription-status', paymentController.getSubscriptionStatus);

module.exports = router;

