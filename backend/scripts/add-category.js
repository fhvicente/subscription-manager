import db from '../src/db/database.js';

console.log('Starting database update to add category column...');

// Verificar se a coluna 'category' já existe na tabela subscriptions
db.all("PRAGMA table_info(subscriptions);", (err, rows) => {
  if (err) {
    console.error('Error checking table schema:', err);
    process.exit(1);
  }

  console.log('Current table schema:', rows);
  const hasCategory = rows && rows.some(row => row.name === 'category');
  
  if (hasCategory) {
    console.log('Column "category" already exists in subscriptions table. No changes needed.');
    process.exit(0);
  } else {
    console.log('Adding category column to subscriptions table...');
    
    // Adicionar a coluna 'category' se ela não existir
    db.run('ALTER TABLE subscriptions ADD COLUMN category TEXT;', (err) => {
      if (err) {
        console.error('Error adding category column:', err);
        process.exit(1);
      }

      console.log('Successfully added "category" column to subscriptions table.');
      process.exit(0);
    });
  }
}); 