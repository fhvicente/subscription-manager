import express from 'express';
import authMiddleware from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// Protected routes
router.get('/', authMiddleware, subscriptionController.getSubscriptions);
router.post('/', authMiddleware, subscriptionController.createSubscription);
router.get('/:id', authMiddleware, subscriptionController.getSubscriptionById);
router.put('/:id', authMiddleware, subscriptionController.updateSubscription);
router.delete('/:id', authMiddleware, subscriptionController.deleteSubscription);

export default router;