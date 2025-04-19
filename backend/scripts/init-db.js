#!/usr/bin/env node

/**
 * Script to initialize SQLite database with sample data
 */

import { get, run, query } from '../src/db/database.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

async function main() {
  console.log('Initializing database with sample data...');

  try {
    // Create tables if they don't exist
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        plan TEXT DEFAULT 'free',
        stripeCustomerId TEXT,
        premiumUntil TEXT,
        imageUrl TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        description TEXT,
        frequency TEXT,
        renewalDate TEXT,
        active INTEGER DEFAULT 1,
        notificationsSent TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        emailEnabled INTEGER DEFAULT 1,
        smsEnabled INTEGER DEFAULT 0,
        pushEnabled INTEGER DEFAULT 0,
        daysBeforeRenewal INTEGER DEFAULT 3,
        phoneNumber TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        stripeSessionId TEXT,
        plan TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create a default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminId = randomUUID();
    
    // Check if admin exists
    const existingAdmin = await get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    
    if (!existingAdmin) {
      await run(
        'INSERT INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'admin@example.com', 'Admin User', hashedPassword, 'admin']
      );
      console.log('Created admin user: admin@example.com');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create a test user
    const testUserPassword = await bcrypt.hash('test123', 10);
    const testUserId = randomUUID();
    
    // Check if test user exists
    const existingTestUser = await get('SELECT * FROM users WHERE email = ?', ['user@example.com']);
    
    if (!existingTestUser) {
      await run(
        'INSERT INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
        [testUserId, 'user@example.com', 'Test User', testUserPassword, 'free']
      );
      console.log('Created test user: user@example.com');
    } else {
      console.log('Test user already exists');
    }
    
    // Get the user id if we didn't just create it
    const userId = existingTestUser ? existingTestUser.id : testUserId;
    
    // Create sample subscriptions
    const sub1Id = randomUUID();
    await run(
      `INSERT INTO subscriptions 
      (id, userId, name, description, amount, renewalDate, active, category, frequency) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sub1Id,
        userId,
        'Netflix',
        'Streaming service',
        15.99,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        1,
        'Entertainment',
        'Monthly'
      ]
    );
    
    const sub2Id = randomUUID();
    await run(
      `INSERT INTO subscriptions 
      (id, userId, name, description, amount, renewalDate, active, category, frequency) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sub2Id,
        userId,
        'Spotify',
        'Music streaming',
        9.99,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        1,
        'Entertainment',
        'Monthly'
      ]
    );
    
    console.log('Created sample subscriptions');
    
    // Create sample notification settings for the test user
    const notifId = randomUUID();
    
    // Check if notification settings exist
    const existingSettings = await get('SELECT * FROM notification_settings WHERE userId = ?', [userId]);
    
    if (!existingSettings) {
      await run(
        `INSERT INTO notification_settings 
         (id, userId, emailEnabled, smsEnabled, pushEnabled, daysBeforeRenewal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [notifId, userId, 1, 0, 0, 3]
      );
      console.log('Created notification settings for test user');
    } else {
      console.log('Notification settings already exist for test user');
    }
    
    console.log('Database initialized successfully!');
    console.log('\nTest accounts:');
    console.log('- Admin: admin@example.com / admin123');
    console.log('- User: user@example.com / test123');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main(); 