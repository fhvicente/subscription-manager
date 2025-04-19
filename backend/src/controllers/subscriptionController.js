const prisma = require('../utils/prisma');

// Get all subscriptions for a user
const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        renewalDate: 'asc'
      }
    });
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
};

// Get a single subscription
const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: id,
        userId: userId
      }
    });
    
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
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, renewalDate, frequency, category, description } = req.body;
    
    // Validate required fields
    if (!name || !amount || !renewalDate || !frequency || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const subscription = await prisma.subscription.create({
      data: {
        name,
        amount: parseFloat(amount),
        renewalDate: new Date(renewalDate),
        frequency,
        category,
        description,
        userId
      }
    });
    
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
};

// Update a subscription
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, amount, renewalDate, frequency, category, description, active } = req.body;
    
    // Check if subscription exists and belongs to user
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: id
      }
    });
    
    if (!existingSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    if (existingSubscription.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this subscription' });
    }
    
    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: id
      },
      data: {
        name: name !== undefined ? name : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        renewalDate: renewalDate !== undefined ? new Date(renewalDate) : undefined,
        frequency: frequency !== undefined ? frequency : undefined,
        category: category !== undefined ? category : undefined,
        description: description !== undefined ? description : undefined,
        active: active !== undefined ? active : undefined
      }
    });
    
    res.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
};

// Delete a subscription
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if subscription exists and belongs to user
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        id: id
      }
    });
    
    if (!existingSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    if (existingSubscription.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this subscription' });
    }
    
    // Delete subscription
    await prisma.subscription.delete({
      where: {
        id: id
      }
    });
    
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
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        active: true
      }
    });
    
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
        const renewalDate = new Date(sub.renewalDate);
        return renewalDate >= today && renewalDate <= nextMonth;
      })
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
    
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

module.exports = {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionStats
};
