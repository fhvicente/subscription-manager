const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Public routes
router.post('/webhook', userController.handleClerkWebhook);
router.post('/test-token', userController.getTestToken);
router.post('/create-with-clerk-id', userController.createUserWithClerkId);

// Protected routes
router.get('/profile', authenticate, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateUserProfile);

module.exports = router;
