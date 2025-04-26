import { query, get, run } from '../db/database.js';
import { generateUUID } from './authController.js';

// Get all subscriptions
export const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await query('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY due_date ASC', [userId]);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
};

// Get a specific subscription by ID
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const subscription = await get('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
};

// Create a new subscription
export const createSubscription = async (req, res) => {
  try {
    const { name, description, price, dueDate, status = 'active', category } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!name || !price || !dueDate) {
      return res.status(400).json({ message: 'Name, price, and due date are required' });
    }
    
    const id = generateUUID();
    
    console.log('Creating subscription with data:', { name, description, price, dueDate, status, category, userId });
    
    const result = await run(
      'INSERT INTO subscriptions (id, user_id, name, description, price, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, name, description, price, dueDate, status, category]
    );
    
    const newSubscription = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
};

// Update a subscription
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, price, dueDate, status, category } = req.body;
    
    // Check if subscription exists and belongs to user
    const subscription = await get('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    
    if (price !== undefined) {
      updateFields.push('price = ?');
      params.push(price);
    }
    
    if (dueDate !== undefined) {
      updateFields.push('due_date = ?');
      params.push(dueDate);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add ID and userId as the last parameters
    params.push(id);
    
    // Return if nothing to update
    if (updateFields.length === 1) { // Only the updated_at field
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    const result = await run(
      `UPDATE subscriptions SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      [...params, userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Subscription not found or no changes made' });
    }
    
    const updatedSubscription = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    
    res.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
};

// Delete a subscription
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if subscription exists and belongs to user
    const subscription = await get('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const result = await run('DELETE FROM subscriptions WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Failed to delete subscription' });
  }
};

// Get subscription statistics
const getSubscriptionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total monthly spending
    const subscriptions = await query('SELECT * FROM subscriptions WHERE userId = ? AND status = ?', [userId, 'active']);
    
    // Calculate monthly spending
    const monthlyTotal = subscriptions.reduce((total, sub) => {
      let monthlyAmount = 0;
      
      switch (sub.frequency) {
        case 'monthly':
          monthlyAmount = sub.amount;
          break;
        case 'quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
        default:
          monthlyAmount = sub.amount;
      }
      
      return total + monthlyAmount;
    }, 0);
    
    // Get spending by category
    const categories = {};
    subscriptions.forEach(sub => {
      if (!categories[sub.category]) {
        categories[sub.category] = 0;
      }
      
      let monthlyAmount = 0;
      switch (sub.frequency) {
        case 'monthly':
          monthlyAmount = sub.amount;
          break;
        case 'quarterly':
          monthlyAmount = sub.amount / 3;
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
        default:
          monthlyAmount = sub.amount;
      }
      
      categories[sub.category] += monthlyAmount;
    });
    
    // Get upcoming renewals
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    const upcomingRenewals = subscriptions
      .filter(sub => {
        const renewalDate = new Date(sub.due_date);
        return renewalDate >= today && renewalDate <= nextMonth;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    res.json({
      monthlyTotal,
      categories,
      upcomingRenewals,
      totalSubscriptions: subscriptions.length
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ message: 'Failed to fetch subscription statistics' });
  }
};
