import { createClerkClient } from '@clerk/express';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Clerk client
const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware to verify JWT token from Clerk
export const verifyClerkJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Clerk
        const { sub, sid } = await clerk.verifyToken(token);
        
        if (!sub) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Find primary email
        const primaryEmail = user.emailAddresses.find(
            email => email.id === user.primaryEmailAddressId
        )?.emailAddress;
        
        if (!primaryEmail) {
            return res.status(401).json({ message: 'User email not found' });
        }

        // Add user info to request
        req.user = {
            clerkId: user.id,
            email: primaryEmail,
            firstName: user.firstName,
            lastName: user.lastName
        };
            
        next();
        
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};