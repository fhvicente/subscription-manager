import jwt from 'jsonwebtoken';
import { get } from './db/database.js';

// JWT Secret configuration with fallback
const JWT_SECRET = process.env.JWT_SECRET || '8c534066dc27202464aa9b1798e8548a3dce9f8375ef48cb507af64519ea9272';

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
      console.log(`Auth error: No token provided for route ${req.path}`);
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'undefined' || token === 'null') {
      console.log(`Auth error: Invalid token format for route ${req.path}`);
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      console.log(`Auth error: Token payload invalid for route ${req.path}`);
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    // Check if user exists
    const user = await get('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      console.log(`Auth error: User not found for ID ${decoded.id}`);
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.log(`Auth error: ${error.name} - ${error.message} for route ${req.path}`);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: error.message
      });
    }
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
};

export default authMiddleware;

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};