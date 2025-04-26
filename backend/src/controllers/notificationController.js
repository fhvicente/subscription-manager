import { get, run, query } from '../db/database.js';
import * as emailService from '../services/emailService.js';
import { generateUUID } from './authController.js';

// Get notification settings for a user
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const settings = await get(
            'SELECT * FROM notification_settings WHERE user_id = ?',
            [userId]
        );

        if (!settings) {
            // Create default settings if none exist
            const result = await run(
                `INSERT INTO notification_settings 
                (id, user_id, email_enabled, sms_enabled, push_enabled, days_before_renewal) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [generateUUID(), userId, 1, 0, 0, 3]
            );
            
            const defaultSettings = {
                id: result.id,
                user_id: userId,
                email_enabled: 1,
                sms_enabled: 0,
                push_enabled: 0,
                days_before_renewal: 3,
                phone_number: null
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
        const { email_enabled, sms_enabled, push_enabled, days_before_renewal, phone_number } = req.body;

        // Find existing settings
        const existingSettings = await get(
            'SELECT * FROM notification_settings WHERE user_id = ?',
            [userId]
        );

        let settings;

        if (existingSettings) {
            // Update existing settings
            await run(
                `UPDATE notification_settings 
                SET email_enabled = ?, sms_enabled = ?, push_enabled = ?, 
                days_before_renewal = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?`,
                [
                    email_enabled !== undefined ? email_enabled : existingSettings.email_enabled,
                    sms_enabled !== undefined ? sms_enabled : existingSettings.sms_enabled,
                    push_enabled !== undefined ? push_enabled : existingSettings.push_enabled,
                    days_before_renewal !== undefined ? days_before_renewal : existingSettings.days_before_renewal,
                    phone_number !== undefined ? phone_number : existingSettings.phone_number,
                    userId
                ]
            );
            
            // Get updated settings
            settings = await get(
                'SELECT * FROM notification_settings WHERE user_id = ?',
                [userId]
            );
        } else {
            // Create new settings with UUID
            const newId = generateUUID();
            const result = await run(
                `INSERT INTO notification_settings 
                (id, user_id, email_enabled, sms_enabled, push_enabled, days_before_renewal, phone_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    newId,
                    userId,
                    email_enabled !== undefined ? email_enabled : 1,
                    sms_enabled !== undefined ? sms_enabled : 0,
                    push_enabled !== undefined ? push_enabled : 0,
                    days_before_renewal !== undefined ? days_before_renewal : 3,
                    phone_number
                ]
            );
            
            // Get new settings
            settings = await get(
                'SELECT * FROM notification_settings WHERE id = ?',
                [newId]
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
  