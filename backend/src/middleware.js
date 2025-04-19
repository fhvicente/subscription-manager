import jwt from 'jsonwebtoken';
import { get } from './db/database.js';

// This example protects all routes except a few specific public ones
// See comments for more details

export const authMiddleware = async (req, res, next) => {
  try {
    // Check for public routes that don't need authentication
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/webhook'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
      return next();
    }

    // Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await get('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

export default authMiddleware;

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};