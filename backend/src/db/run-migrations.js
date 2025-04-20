/**
 * Run all migrations in sequence
 * 
 * Este arquivo mantém o histórico de migrações e pode ser usado
 * para adicionar futuras migrações conforme necessário.
 */
async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Add future migrations in order here
    // Exemplo: await newMigration();
    
    console.log('All migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('Failed to run migrations:', error);
    return false;
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === import.meta.main) {
  runAllMigrations()
    .then(success => {
      console.log(`Migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    });
}

export default runAllMigrations; 