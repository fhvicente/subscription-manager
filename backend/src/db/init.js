import db from './database.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQL para criar as tabelas
const createTablesSql = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  plan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  price REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  stripe_session_id TEXT,
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

// Função para gerar um UUID simples
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função assíncrona para criar as tabelas e adicionar dados iniciais
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Execute as queries em uma transação
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Criar tabelas
      db.exec(createTablesSql, (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        // Função para adicionar usuários de teste
        const addUsers = async () => {
          // Criar usuário admin
          const adminId = generateUUID();
          const adminPassword = await bcrypt.hash('admin123', 10);
          db.run(
            'INSERT OR IGNORE INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
            [adminId, 'admin@example.com', 'Admin User', adminPassword, 'admin'],
            function(err) {
              if (err) {
                console.error('Error adding admin user:', err.message);
                return;
              }
              console.log('Admin user created or already exists');

              // Criar usuário de teste
              const testUserId = generateUUID();
              bcrypt.hash('test123', 10, (err, hash) => {
                if (err) {
                  console.error('Error hashing password:', err.message);
                  return;
                }

                db.run(
                  'INSERT OR IGNORE INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)',
                  [testUserId, 'user@example.com', 'Test User', hash, 'free'],
                  function(err) {
                    if (err) {
                      console.error('Error adding test user:', err.message);
                      return;
                    }
                    console.log('Test user created or already exists');

                    // Adicionar assinaturas de exemplo
                    const netflixId = generateUUID();
                    const spotifyId = generateUUID();
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    const fourteenDaysFromNow = new Date();
                    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

                    db.run(
                      'INSERT OR IGNORE INTO subscriptions (id, name, description, due_date, price, status) VALUES (?, ?, ?, ?, ?, ?)',
                      [netflixId, 'Netflix', 'Streaming service', thirtyDaysFromNow.toISOString(), 15.99, 'active'],
                      function(err) {
                        if (err) {
                          console.error('Error adding Netflix subscription:', err.message);
                          return;
                        }
                        console.log('Netflix subscription created or already exists');

                        db.run(
                          'INSERT OR IGNORE INTO subscriptions (id, name, description, due_date, price, status) VALUES (?, ?, ?, ?, ?, ?)',
                          [spotifyId, 'Spotify', 'Music streaming', fourteenDaysFromNow.toISOString(), 9.99, 'active'],
                          function(err) {
                            if (err) {
                              console.error('Error adding Spotify subscription:', err.message);
                              return;
                            }
                            console.log('Spotify subscription created or already exists');

                            // Adicionar configurações de notificação para o usuário de teste
                            const notificationId = generateUUID();
                            db.run(
                              'INSERT OR IGNORE INTO notification_settings (id, user_id, email_enabled, sms_enabled, push_enabled, days_before_renewal) VALUES (?, ?, ?, ?, ?, ?)',
                              [notificationId, testUserId, 1, 0, 0, 3],
                              function(err) {
                                if (err) {
                                  console.error('Error adding notification settings:', err.message);
                                  return;
                                }
                                console.log('Notification settings created or already exists');

                                db.run('COMMIT', function(err) {
                                  if (err) {
                                    console.error('Error committing transaction:', err.message);
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                  }
                                  console.log('Database initialized successfully!');
                                  console.log('\nTest accounts:');
                                  console.log('- Admin: admin@example.com / admin123');
                                  console.log('- User: user@example.com / test123');
                                  resolve();
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              });
            }
          );
        };

        // Iniciar adição de usuários
        addUsers().catch(err => {
          console.error('Error in async operations:', err);
          db.run('ROLLBACK');
          reject(err);
        });
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