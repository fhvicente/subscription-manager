import express from 'express';
import authMiddleware from '../middleware.js';
import { createCheckoutSession, handleWebhook, getPaymentHistory, getSubscriptionStatus, getSubscriptionStatusBySession, cancelSubscription } from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes
router.get('/history', authMiddleware, getPaymentHistory);
router.post('/session', authMiddleware, createCheckoutSession);
router.post('/webhook', handleWebhook);
router.get('/status', authMiddleware, getSubscriptionStatus);
router.get('/status/session', authMiddleware, getSubscriptionStatusBySession);
router.post('/cancel-subscription', authMiddleware, cancelSubscription);

export default router;