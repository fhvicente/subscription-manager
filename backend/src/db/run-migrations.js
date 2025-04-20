import addStripeCustomerId from './migrations/add_stripe_customer_id.js';

/**
 * Run all migrations in sequence
 */
async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Add migrations in order here
    await addStripeCustomerId();
    
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