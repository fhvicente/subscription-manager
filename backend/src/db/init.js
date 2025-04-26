import db from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateUUID } from '../controllers/authController.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the database directory exists
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQL para criar as tabelas -> SQL to create tables
const createTablesSql = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  premiumUntil TIMESTAMP,
  stripeCustomerId TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  price REAL NOT NULL,
  status TEXT DEFAULT 'active',
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  push_enabled INTEGER DEFAULT 0,
  days_before_renewal INTEGER DEFAULT 3,
  phone_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'stripe',
  stripeSessionId TEXT,
  plan TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
`;

// Async function to create tables and add admin user
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Execute queries in a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Create tables
      db.exec(createTablesSql, async (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        try {
          // Create admin user
          const adminId = generateUUID();
          const adminPassword = await bcrypt.hash('admin123', 10);
          
          db.run(
            'INSERT OR IGNORE INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'admin@example.com', 'Admin User', adminPassword, 'admin'],
            function(err) {
              if (err) {
                console.error('Error adding admin user:', err.message);
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              console.log('Admin user created or already exists');

              db.run('COMMIT', function(err) {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                console.log('Database initialized successfully!');
                console.log('\nAdmin account:');
                console.log('- Email: admin@example.com');
                console.log('- Password: admin123');
                resolve();
              });
            }
          );
        } catch (error) {
          console.error('Error in async operations:', error);
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  });
}

// Executar inicialização
initializeDatabase()
  .then(() => {
    console.log('Database initialization completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }); 