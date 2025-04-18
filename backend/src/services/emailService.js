const sgMail = require('@sendgrid/mail');
const prisma = require('../utils/prisma');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send email notification
const sendEmail = async (to, subject, text, html) => {
    try {
        const msg = {
            to,
            from: process.env.EMAIL_FROM,
            subject,
            text,
            html
        };
      
        await sgMail.send(msg);
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        return false;
    }
};

// Send subscription renewal notification
const sendRenewalNotification = async (userId, subscriptionId) => {
    try {
        // Get user and subscription details
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                notificationSetting: true
            }
        });
      
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
      
        if (!user || !subscription) {
            console.error('User or subscription not found');
            return false;
        }
      
        // Check if email notifications are enabled
        if (!user.notificationSetting || !user.notificationSetting.emailEnabled) {
            console.log('Email notifications disabled for user');
            return false;
        }
      
        // Format renewal date
        const renewalDate = new Date(subscription.renewalDate);
        const formattedDate = renewalDate.toLocaleDateString('pt-BR');
        
        // Create email content
        const subject = `Lembrete de Renovação: ${subscription.name}`;
        const text = `Olá ${user.name || ''},\n\nSua assinatura de ${subscription.name} irá renovar em ${formattedDate}. O valor da renovação é de R$ ${subscription.amount.toFixed(2)}.\n\nAcesse sua conta para gerenciar esta assinatura.\n\nAtenciosamente,\nGestor Simples de Assinaturas`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Lembrete de Renovação</h2>
                <p>Olá ${user.name || ''},</p>
                <p>Sua assinatura de <strong>${subscription.name}</strong> irá renovar em <strong>${formattedDate}</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${subscription.amount.toFixed(2)}</p>
                    <p style="margin: 5px 0;"><strong>Categoria:</strong> ${subscription.category}</p>
                    <p style="margin: 5px 0;"><strong>Frequência:</strong> ${subscription.frequency}</p>
                </div>
                <p>Acesse sua conta para gerenciar esta assinatura.</p>
                <div style="margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL}/subscriptions/${subscription.id}" style="background-color: #4a5568; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Gerenciar Assinatura</a>
                </div>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Atenciosamente,<br>
                    Equipe Gestor Simples de Assinaturas
                </p>
            </div>
        `;
        
        // Send email
        const sent = await sendEmail(user.email, subject, text, html);
      
        if (sent) {
            // Update subscription with notification record
            const notificationsSent = subscription.notificationsSent || [];
            notificationsSent.push({
                type: 'email',
                sentAt: new Date(),
                renewalDate: subscription.renewalDate
            });
            
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { notificationsSent: notificationsSent }
            });
        }
        
        return sent;

    } catch (error) {
        console.error('Error sending renewal notification:', error);
        return false;
    }
};
  
// Check for upcoming renewals and send notifications
const checkUpcomingRenewals = async () => {
    try {
        // Get all active subscriptions with their users and notification settings
        const subscriptions = await prisma.subscription.findMany({
            where: { active: true },
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
            // Skip if user has no notification settings
            if (!subscription.user.notificationSetting) continue;
            
            const renewalDate = new Date(subscription.renewalDate);
            const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
            
            // Check if notification should be sent based on user settings
            if (daysUntilRenewal === subscription.user.notificationSetting.daysBeforeRenewal) {
                // Check if notification was already sent for this renewal
                const notificationHistory = subscription.notificationsSent || [];
                const alreadySent = notificationHistory.some(notification => {
                    const notificationRenewalDate = new Date(notification.renewalDate);
                    return notificationRenewalDate.toDateString() === renewalDate.toDateString();
                });
            
                if (!alreadySent) {
                    // Send notification
                    const sent = await sendRenewalNotification(subscription.user.id, subscription.id);
                    
                    if (sent) {
                        notificationsSent.push({
                            subscriptionId: subscription.id,
                            userId: subscription.user.id,
                            subscriptionName: subscription.name,
                            renewalDate: renewalDate
                        });
                    }
                }
            }
        }
        
        console.log(`Sent ${notificationsSent.length} renewal notifications`);
        return notificationsSent;

    } catch (error) {
        console.error('Error checking upcoming renewals:', error);
        return [];
    }
};

// Send test notification
const sendTestNotification = async (userId, type) => {
    try {
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            console.error('User not found');
            return false;
        }
        
        if (type === 'email') {
            // Send test email
            const subject = 'Teste de Notificação - Gestor de Assinaturas';
            const text = `Olá ${user.name || ''},\n\nEste é um teste de notificação por email do Gestor Simples de Assinaturas.\n\nSe você recebeu este email, suas notificações estão configuradas corretamente.\n\nAtenciosamente,\nGestor Simples de Assinaturas`;
            
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Teste de Notificação</h2>
                    <p>Olá ${user.name || ''},</p>
                    <p>Este é um teste de notificação por email do Gestor Simples de Assinaturas.</p>
                    <p>Se você recebeu este email, suas notificações estão configuradas corretamente.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Atenciosamente,<br>
                        Equipe Gestor Simples de Assinaturas
                    </p>
                </div>
            `;
            
            return await sendEmail(user.email, subject, text, html);
        }
        
        // For future implementation: SMS and push notifications
        return false;
    } catch (error) {
        console.error('Error sending test notification:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendRenewalNotification,
    checkUpcomingRenewals,
    sendTestNotification
};
  