const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../utils/prisma');

// Create a Stripe checkout session for subscription
const createCheckoutSession = async (userId, plan) => {
    try {
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
  
        if (!user) {
            throw new Error('User not found');
        }

        // Set price based on plan
        const priceId = plan === 'yearly' 
            ? process.env.STRIPE_YEARLY_PRICE_ID 
            : process.env.STRIPE_MONTHLY_PRICE_ID;

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: {
                    userId: user.id
                }
            });

            customerId = customer.id;

            // Update user with Stripe customer ID
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId }
            });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
            metadata: {
                userId: user.id,
                plan: plan
            }
        });

        return session;

    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

// Handle Stripe webhook events
const handleWebhookEvent = async (event) => {
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata.userId;
                const plan = session.metadata.plan;

                // Update user plan
                await prisma.user.update({
                    where: { id: userId },
                    data: { plan: 'premium' }
                });

                // Create payment log
                await prisma.paymentLog.create({
                    data: {
                        userId: userId,
                        amount: session.amount_total / 100, // Convert from cents
                        status: 'success',
                        stripeSessionId: session.id
                    }
                });

                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customerId = invoice.customer;
                
                // Find user by Stripe customer ID
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId }
                });

                if (user) {
                    // Create payment log
                    await prisma.paymentLog.create({
                        data: {
                            userId: user.id,
                            amount: invoice.amount_due / 100, // Convert from cents
                            status: 'failed',
                            stripeSessionId: invoice.id
                        }
                    });
                }
                  
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                
                // Find user by Stripe customer ID
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId }
                });
                
                if (user) {
                    // Downgrade user to free plan
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { plan: 'free' }
                    });
                }
                
                break;
            }
        }

        return { recived: true };

    } catch (error) {
        console.error('Error handling webhook event:', error);
        throw error;
    }
};

module.exports = {
    createCheckoutSession,
    handleWebhookEvent
};
