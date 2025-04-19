import Stripe from 'stripe';
import { get, run, query } from '../db/database.js';

// Safely initialize Stripe if API key is available
let stripe;
try {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (apiKey && apiKey.startsWith('sk_')) {
    stripe = new Stripe(apiKey);
    console.log('Stripe API initialized successfully in payment controller');
  } else {
    console.warn('Stripe API key not properly configured. Payment features will be simulated.');
    // Create a mock Stripe object for development
    stripe = {
      customers: {
        create: async () => ({ id: 'cus_mock_' + Date.now() })
      },
      checkout: {
        sessions: {
          create: async () => ({ 
            id: 'cs_mock_' + Date.now(),
            url: process.env.FRONTEND_URL + '/mock-checkout'
          })
        }
      },
      webhooks: {
        constructEvent: () => ({ type: 'mock.event', data: { object: {} } })
      }
    };
  }
} catch (error) {
  console.error('Error initializing Stripe in payment controller:', error);
  // Create a minimal mock object to prevent crashes
  stripe = { customers: {}, checkout: { sessions: {} }, webhooks: {} };
}

// Create a checkout session for subscription purchase
const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    
    // Get user
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    
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
      await run(
        'UPDATE users SET stripeCustomerId = ? WHERE id = ?',
        [customerId, userId]
      );
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
  try {
    let event;
    
    // If we have a valid Stripe API key, attempt to verify the webhook
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'];
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
    } else {
      // For development without a webhook secret, just parse the body
      console.warn('STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
      event = req.body;
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract user ID from metadata
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        
        if (!userId) {
          console.error('No userId found in session metadata');
          break;
        }
        
        // Calculate premium until date
        const premiumUntil = plan === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        // Update user plan
        await run(
          'UPDATE users SET plan = ?, premiumUntil = ? WHERE id = ?',
          ['premium', premiumUntil.toISOString(), userId]
        );
        
        // Create payment log
        await run(
          `INSERT INTO payment_logs (userId, amount, status, stripeSessionId, plan) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
            'success',
            session.id,
            plan
          ]
        );
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Find user by Stripe customer ID
        const user = await get(
          'SELECT * FROM users WHERE stripeCustomerId = ?',
          [customerId]
        );
        
        if (user) {
          // Create payment log
          await run(
            `INSERT INTO payment_logs (userId, amount, status, stripeSessionId) 
             VALUES (?, ?, ?, ?)`,
            [
              user.id,
              invoice.amount_due ? invoice.amount_due / 100 : 0, // Convert from cents
              'failed',
              invoice.id
            ]
          );
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const user = await get(
          'SELECT * FROM users WHERE stripeCustomerId = ?',
          [customerId]
        );
        
        if (user) {
          // Downgrade user to free plan
          await run(
            'UPDATE users SET plan = ?, premiumUntil = ? WHERE id = ?',
            ['free', null, user.id]
          );
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
    
    const payments = await query(
      'SELECT * FROM payment_logs WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
    
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
    
    const user = await get(
      'SELECT plan, premiumUntil FROM users WHERE id = ?',
      [userId]
    );
    
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

export {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionStatus
};
