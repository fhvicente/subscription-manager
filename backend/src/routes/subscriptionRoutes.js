const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Apply authentication middleware to all subscription routes
router.use(authenticate);

// Get all subscriptions
router.get('/', subscriptionController.getSubscriptions);

// Get subscription statistics
router.get('/stats', subscriptionController.getSubscriptionStats);

// Get a single subscription
router.get('/:id', subscriptionController.getSubscription);

// Create a new subscription
router.post('/', subscriptionController.createSubscription);

// Update a subscription
router.put('/:id', subscriptionController.updateSubscription);

// Delete a subscription
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;