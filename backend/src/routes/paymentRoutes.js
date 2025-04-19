import express from 'express';
import authMiddleware from '../middleware.js';
import { createCheckoutSession, handleWebhook, getPaymentHistory, getSubscriptionStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes
router.get('/history', authMiddleware, getPaymentHistory);
router.post('/session', authMiddleware, createCheckoutSession);
router.post('/webhook', handleWebhook);
router.get('/status', authMiddleware, getSubscriptionStatus);

export default router;