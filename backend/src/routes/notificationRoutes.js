const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Apply authentication middleware to all notification routes except cron endpoint
router.use('/check-renewals', (req, res, next) => {
    // Skip authentication for cron job endpoint
    next();
});

router.use(authenticate);

// Get notification settings
router.get('/', notificationController.getNotificationSettings);

// Update notification settings
router.put('/', notificationController.updateNotificationSettings);

// Send test notification
router.post('/test', notificationController.sendTestNotification);

// Endpoint for cron job to check upcoming renewals
router.post('/check-renewals', notificationController.checkUpcomingRenewals);

module.exports = router;
