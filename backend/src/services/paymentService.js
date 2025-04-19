import Stripe from 'stripe';
import { get, run, query } from '../db/database.js';

// Safely initialize Stripe if API key is available
let stripe;
try {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (apiKey && apiKey.startsWith('sk_')) {
    stripe = new Stripe(apiKey);
    console.log('Stripe API initialized successfully');
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
  console.error('Error initializing Stripe:', error);
  // Create a minimal mock object to prevent crashes
  stripe = { customers: {}, checkout: { sessions: {} }, webhooks: {} };
}

// Create a Stripe checkout session for subscription
const createCheckoutSession = async (userId, plan) => {
  try {
    // Get user
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);

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
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        
        if (!userId) {
          console.warn('No userId found in session metadata');
          break;
        }
        
        // Update user plan
        await run(
          'UPDATE users SET plan = ? WHERE id = ?',
          ['premium', userId]
        );
        
        // Create payment log
        await run(
          `INSERT INTO payment_logs (userId, amount, status, stripeSessionId) 
           VALUES (?, ?, ?, ?)`,
          [
            userId,
            session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
            'success',
            session.id
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
            'UPDATE users SET plan = ? WHERE id = ?',
            ['free', user.id]
          );
        }
        
        break;
      }
    }
    
    return { received: true };
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
};

export {
  createCheckoutSession,
  handleWebhookEvent
};
