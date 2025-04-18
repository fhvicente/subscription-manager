const primsa = require('../utils/prisma');
const emailService = require('../services/emailService');

// Get notification settings for a user
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const settings = await prisma.notificationSetting.findUnique({
            where: {
                userId: userId
            }
        });

        if (!settings) {
            // Create default settings if none exist
            const defaultSettings = await prisma.notificationSetting.create({
                data: {
                    userId: userId,
                    emailEnabled: true,
                    smsEnabled: false,
                    pushEnabled: false,
                    daysBeforeRenewal: 3
                }
            });
            return res.json(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Failed to fetch notification settings' });
    }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { emailEnabled, smsEnabled, pushEnabled, daysBeforeRenewal, phoneNumber } = req.body;

        // Find existing settings
        const existingSettings = await prisma.notificationSetting.findUnique({
            where: {
                userId: userId
            }
        });

        let settings;

        if (existingSettings) {
            // Update existing settings
            settings = await prisma.notificationSetting.update({
                where: {
                    userId: userId
                },
                data: {
                    emailEnabled: emailEnabled !== undefined ? emailEnabled : existingSettings.emailEnabled,
                    smsEnabled: smsEnabled !== undefined ? smsEnabled : existingSettings.smsEnabled,
                    pushEnabled: pushEnabled !== undefined ? pushEnabled : existingSettings.pushEnabled,
                    daysBeforeRenewal: daysBeforeRenewal !== undefined ? daysBeforeRenewal : existingSettings.daysBeforeRenewal,
                    phoneNumber: phoneNumber !== undefined ? phoneNumber : existingSettings.phoneNumber
                }
            });
        } else {
            // Create new settings
            settings = await prisma.notificationSetting.create({
                data: {
                    userId: userId,
                    emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
                    smsEnabled: smsEnabled !== undefined ? smsEnabled : false,
                    pushEnabled: pushEnabled !== undefined ? pushEnabled : false,
                    daysBeforeRenewal: daysBeforeRenewal !== undefined ? daysBeforeRenewal : 3,
                    phoneNumber
                }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Failed to update notification settings' });
    }
};

// Send test notification
const sendTestNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.body; // email, sms, push
        
        if (!type || !['email', 'sms', 'push'].includes(type)) {
            return res.status(400).json({ message: 'Invalid notification type' });
        }
        
        // Send actual notification using the email service
        if (type === 'email') {
            const sent = await emailService.sendTestNotification(userId, 'email');
            
            if (sent) {
                return res.json({ 
                    success: true, 
                    message: `Test email notification sent successfully` 
                });
            } else {
            return res.status(500).json({ 
                success: false, 
                message: `Failed to send test email notification` 
            });
            }
        }

        // For future implementation: SMS and push notifications

        res.json({ 
            success: true, 
            message: `Test ${type} notification simulated successfully` 
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ message: 'Failed to send test notification' });
    }
};

// Check for upcoming renewals and send notifications (for cron job)
const checkUpcomingRenewals = async (req, res) => {
    try {
    // This endpoint would typically be called by a scheduled job
    // For security, I added a simple API key check
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const notificationsSent = await emailService.checkUpcomingRenewals();
    
    res.json({ 
        success: true, 
        notificationsSent: notificationsSent.length,
        details: notificationsSent
    });
    } catch (error) {
        console.error('Error checking upcoming renewals:', error);
        res.status(500).json({ message: 'Failed to check upcoming renewals' });
    }
};


module.exports = {
    getNotificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    checkUpcomingRenewals
};
  