import sendgrid from '@sendgrid/mail';
import { get, run, query } from '../db/database.js';

// Initialize SendGrid if API key is available
const apiKey = process.env.SENDGRID_API_KEY;
try {
  if (apiKey && apiKey.startsWith('SG.')) {
    sendgrid.setApiKey(apiKey);
    console.log('SendGrid API initialized successfully in notificationService');
  } else {
    console.warn('SendGrid API key not properly configured. Email notifications will be simulated.');
  }
} catch (error) {
  console.error('Error initializing SendGrid in notificationService:', error);
}

// Send email notification
const sendEmailNotification = async (to, subject, text, html) => {
    try {
        // Check if SendGrid is properly configured
        if (!apiKey || !apiKey.startsWith('SG.')) {
            console.log(`[EMAIL SIMULATION] To: ${to}, Subject: ${subject}`);
            console.log(`[EMAIL SIMULATION] Text: ${text.substring(0, 100)}...`);
            return true; // Simulate success for development
        }

        const msg = {
            to,
            from: process.env.EMAIL_FROM,
            subject,
            text,
            html
        };

        await sendgrid.send(msg);
        return true;

    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Check for upcoming subscription renewals and send notifications
const checkUpcomingRenewals = async () => {
    try {
        // Get all active subscriptions with user and notification settings
        const subscriptions = await query(
            `SELECT s.*, u.email, u.id as userId, 
                   ns.emailEnabled, ns.smsEnabled, ns.pushEnabled, ns.daysBeforeRenewal
            FROM subscriptions s
            JOIN users u ON s.userId = u.id
            LEFT JOIN notification_settings ns ON u.id = ns.userId
            WHERE s.active = 1`
        );

        const today = new Date();
        const notificationsSent = [];

        for (const subscription of subscriptions) {
            const renewalDate = new Date(subscription.renewalDate);
            const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));

            // Check if notification should be sent based on user settings
            if (
                subscription.daysBeforeRenewal &&
                daysUntilRenewal === subscription.daysBeforeRenewal
            ) {
                // Send email notification if enabled
                if (subscription.emailEnabled) {
                    const emailSent = await sendEmailNotification(
                        subscription.email,
                        `Renewal Reminder: ${subscription.name}`,
                        `Your subscription for ${subscription.name} will renew in ${daysUntilRenewal} days. The amount is ${subscription.amount} and it will renew on ${renewalDate.toLocaleDateString()}.`,
                        `<h2>Renewal Reminder</h2>
                        <p>Your subscription for <strong>${subscription.name}</strong> will renew in <strong>${daysUntilRenewal} days</strong>.</p>
                        <p>Amount: ${subscription.amount}</p>
                        <p>Renewal Date: ${renewalDate.toLocaleDateString()}</p>
                        <p>Category: ${subscription.category}</p>
                        <p>Login to your account to manage this subscription.</p>`
                    );

                    if (emailSent) {
                        notificationsSent.push({
                            subscriptionId: subscription.id,
                            userId: subscription.userId,
                            type: 'email',
                            sentAt: new Date()
                        });
                    }
                }

                // TODO: Implement SMS and push notifications
            }
        }

        // Log notifications sent
        console.log(`Sent ${notificationsSent.length} renewal notifications`);

        return notificationsSent;

    } catch (error) {
        console.error('Error checking upcoming renewals:', error);
        return [];
    }
};

export {
    sendEmailNotification,
    checkUpcomingRenewals
};