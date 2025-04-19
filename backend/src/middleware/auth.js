const { createClerkClient } = require('@clerk/clerk-sdk-node');
const prisma = require('../lib/prisma');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Update the auth middleware to use Clerk and Prisma
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Clerk
    const { sub } = await clerk.verifyToken(token);
    
    if (!sub) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Find user in our database by Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: sub
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found in database' });
    }
    
    // Add user info to request
    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      plan: user.plan
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
