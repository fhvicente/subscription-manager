import express from 'express';
import authMiddleware from '../middleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Protected routes
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);

export default router;
