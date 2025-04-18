const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../utils/prisma');

// Create a checkout session for subscription purchase
const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
    
    res.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
};

// Handle Stripe webhook events
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
  
  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract user ID from metadata
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;
        
        if (!userId) {
          console.error('No userId found in session metadata');
          break;
        }
        
        // Update user plan
        await prisma.user.update({
          where: { id: userId },
          data: { 
            plan: 'premium',
            premiumUntil: plan === 'yearly' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        // Create payment log
        await prisma.paymentLog.create({
          data: {
            userId: userId,
            amount: session.amount_total / 100, // Convert from cents
            status: 'success',
            stripeSessionId: session.id,
            plan: plan
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
            data: { 
              plan: 'free',
              premiumUntil: null
            }
          });
        }
        
        break;
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ message: 'Error handling webhook event' });
  }
};

// Get payment history for a user
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payments = await prisma.paymentLog.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

// Get subscription status for a user
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        premiumUntil: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      plan: user.plan,
      premiumUntil: user.premiumUntil,
      isActive: user.plan === 'premium' && new Date(user.premiumUntil) > new Date()
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionStatus
};
