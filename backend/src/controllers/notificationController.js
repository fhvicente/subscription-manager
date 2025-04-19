import { get, run, query } from '../db/database.js';
import * as emailService from '../services/emailService.js';

// Get notification settings for a user
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const settings = await get(
            'SELECT * FROM notification_settings WHERE userId = ?',
            [userId]
        );

        if (!settings) {
            // Create default settings if none exist
            const result = await run(
                `INSERT INTO notification_settings 
                (userId, emailEnabled, smsEnabled, pushEnabled, daysBeforeRenewal) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, true, false, false, 3]
            );
            
            const defaultSettings = {
                id: result.id,
                userId,
                emailEnabled: true,
                smsEnabled: false,
                pushEnabled: false,
                daysBeforeRenewal: 3
            };
            
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
        const existingSettings = await get(
            'SELECT * FROM notification_settings WHERE userId = ?',
            [userId]
        );

        let settings;

        if (existingSettings) {
            // Update existing settings
            await run(
                `UPDATE notification_settings 
                SET emailEnabled = ?, smsEnabled = ?, pushEnabled = ?, 
                daysBeforeRenewal = ?, phoneNumber = ?
                WHERE userId = ?`,
                [
                    emailEnabled !== undefined ? emailEnabled : existingSettings.emailEnabled,
                    smsEnabled !== undefined ? smsEnabled : existingSettings.smsEnabled,
                    pushEnabled !== undefined ? pushEnabled : existingSettings.pushEnabled,
                    daysBeforeRenewal !== undefined ? daysBeforeRenewal : existingSettings.daysBeforeRenewal,
                    phoneNumber !== undefined ? phoneNumber : existingSettings.phoneNumber,
                    userId
                ]
            );
            
            // Get updated settings
            settings = await get(
                'SELECT * FROM notification_settings WHERE userId = ?',
                [userId]
            );
        } else {
            // Create new settings
            const result = await run(
                `INSERT INTO notification_settings 
                (userId, emailEnabled, smsEnabled, pushEnabled, daysBeforeRenewal, phoneNumber) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    emailEnabled !== undefined ? emailEnabled : true,
                    smsEnabled !== undefined ? smsEnabled : false,
                    pushEnabled !== undefined ? pushEnabled : false,
                    daysBeforeRenewal !== undefined ? daysBeforeRenewal : 3,
                    phoneNumber
                ]
            );
            
            // Get new settings
            settings = await get(
                'SELECT * FROM notification_settings WHERE userId = ?',
                [userId]
            );
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


export {
    getNotificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    checkUpcomingRenewals
};
  