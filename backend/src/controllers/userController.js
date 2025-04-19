import { get, run } from '../db/database.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await get(
      'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    const result = await run(
      'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    
    const updatedUser = await get(
      'SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};
