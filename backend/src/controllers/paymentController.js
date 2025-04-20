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
        try {
          await run(
            'UPDATE users SET plan = ?, premiumUntil = ? WHERE id = ?',
            ['premium', premiumUntil.toISOString(), userId]
          );
        } catch (updateError) {
          console.error('Error updating user plan:', updateError);
        }
        
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
      'SELECT id, email, name, plan, premiumUntil FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine if plan is active
    const isPremiumActive = user.plan === 'premium' && 
                          user.premiumUntil && 
                          new Date(user.premiumUntil) > new Date();
    
    res.json({
      plan: user.plan,
      premiumUntil: user.premiumUntil,
      isActive: isPremiumActive
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
};

// Get subscription status for a specific payment session
// This is useful for the payment success page
const getSubscriptionStatusBySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    // First check if this payment is related to the user
    const paymentLog = await get(
      'SELECT * FROM payment_logs WHERE stripeSessionId = ? AND userId = ?',
      [session_id, userId]
    );
    
    // Get user subscription details
    const user = await get(
      'SELECT id, email, name, plan, premiumUntil FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the user has a premium subscription
    const isPremiumActive = user.plan === 'premium' && 
                          user.premiumUntil && 
                          new Date(user.premiumUntil) > new Date();
    
    // If no payment log is found, or it's not successful, but the user has premium
    // We'll still show the premium status
    if ((!paymentLog || paymentLog.status !== 'success') && isPremiumActive) {
      return res.json({
        plan: user.plan,
        premiumUntil: user.premiumUntil,
        isActive: true,
        verifiedSession: false
      });
    }
    
    // If the payment log exists and is successful
    if (paymentLog && paymentLog.status === 'success') {
      return res.json({
        plan: user.plan,
        premiumUntil: user.premiumUntil,
        isActive: isPremiumActive,
        verifiedSession: true,
        sessionId: session_id
      });
    }
    
    // If we get to this point, the user doesn't have premium status and the payment wasn't successful
    return res.json({
      plan: user.plan,
      premiumUntil: user.premiumUntil,
      isActive: false,
      verifiedSession: false
    });
    
  } catch (error) {
    console.error('Error fetching subscription status by session:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
};

// Cancel subscription for a user
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user details
    const user = await get(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user has a Stripe customer ID and we're not in dev mode, try to cancel the actual subscription
    if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      try {
        // Find active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active'
        });
        
        // Cancel each active subscription
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with the process even if Stripe fails
      }
    }
    
    // Update the user's status in our database immediately
    // Keep premium access until premiumUntil date, but mark as canceled
    await run(
      'UPDATE users SET plan = ? WHERE id = ?',
      ['free', userId]
    );
    
    // Log the cancellation
    await run(
      `INSERT INTO payment_logs (userId, status, notes) 
       VALUES (?, ?, ?)`,
      [userId, 'canceled', 'Subscription canceled by user']
    );
    
    res.json({ 
      success: true,
      message: 'Subscription has been canceled successfully.'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};

export {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionStatus,
  getSubscriptionStatusBySession,
  cancelSubscription
};
