import db from '../database.js';
import { query, run } from '../database.js';

console.log('Script de migração para adicionar stripeCustomerId iniciado');

/**
 * Migration to add stripeCustomerId column to users table
 */
async function runMigration() {
  try {
    console.log('Running migration: Adding stripeCustomerId column to users table');
    
    // Primeiro verifica se a coluna já existe
    const tableInfo = await query("PRAGMA table_info(users)");
    
    // Verifica se a coluna já existe
    const columnExists = tableInfo && tableInfo.some(col => col.name === 'stripeCustomerId');
    
    if (columnExists) {
      console.log('Column stripeCustomerId already exists in users table');
      return;
    }
    
    // Adiciona a coluna se não existir
    await run('ALTER TABLE users ADD COLUMN stripeCustomerId TEXT');
    console.log('Migration successful: stripeCustomerId column added to users table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Execute a migração
runMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

export default runMigration; 