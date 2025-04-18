const sendgrid = require('@sendgrid/mail');
const prisma = require('../utils/prisma');

// Initialize SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

// Send email notification
const sendEmailNotification = async (to, subject, text, html) => {
    try {
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
        // Get all active subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: {
                active: true
            },
            include: {
                user: {
                    include: {
                        notificationSetting: true
                    }
                }
            }
        });

        const today = new Date();
        const notificationsSent = [];

        for (const subscription of subscriptions) {
            const renewalDate = new Date(subscription.renewalDate);
            const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));

            // Check if notification should be sent based on user settings
            if (
                subscription.user.notificationSetting &&
                daysUntilRenewal === subscription.user.notificationSetting.daysBeforeRenewal
            ) {
                // Send email notification if enabled
                if (subscription.user.notificationSetting.emailEnabled) {
                    const emailSent = await sendEmailNotification(
                        subscription.user.email,
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

module.exports = {
    sendEmailNotification,
    checkUpcomingRenewals
};