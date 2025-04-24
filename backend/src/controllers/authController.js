import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get, run } from '../db/database.js';

// Função para gerar um UUID simples
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configurar JWT Secret com fallback
const JWT_SECRET = process.env.JWT_SECRET || '8c534066dc27202464aa9b1798e8548a3dce9f8375ef48cb507af64519ea9272';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

console.log('JWT_SECRET status:', JWT_SECRET ? 'Defined' : 'Undefined');

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for user
    const userId = generateUUID();

    // Create user
    const result = await run(
      'INSERT INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
      [userId, email, name, hashedPassword, 'free']
    );

    // Get the created user
    const user = await get('SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?', [userId]);

    // Create token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user from database
    const user = await get(
      'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?', 
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 