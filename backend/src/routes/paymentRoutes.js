import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createCheckoutSession, getPaymentHistory, getSubscriptionStatus, getSubscriptionStatusBySession, cancelSubscription } from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes
router.get('/history', authMiddleware, getPaymentHistory);
router.post('/session', authMiddleware, createCheckoutSession);
router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/cancel-subscription', authMiddleware, cancelSubscription);

// Public route - accessible after Stripe redirect
router.get('/status/session', getSubscriptionStatusBySession);

export default router;