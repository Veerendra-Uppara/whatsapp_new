// Quick check to see which database will be used
const DATABASE_URL = process.env.DATABASE_URL;

console.log('\n=== Database Configuration Check ===\n');

if (DATABASE_URL) {
  console.log('✅ DATABASE_URL is SET');
  console.log('Database: PostgreSQL (Supabase)');
  console.log('Connection String:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  // Test the connection
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  pool.connect()
    .then(client => {
      console.log('\n✅ Connection Test: SUCCESS');
      console.log('Status: Ready to use Supabase PostgreSQL');
      client.release();
      pool.end();
      process.exit(0);
    })
    .catch(err => {
      console.log('\n❌ Connection Test: FAILED');
      console.log('Error:', err.message);
      pool.end();
      process.exit(1);
    });
} else {
  console.log('❌ DATABASE_URL is NOT SET');
  console.log('Database: SQLite (local dev - fallback)');
  console.log('\nTo use Supabase, set DATABASE_URL environment variable');
  console.log('Example: $env:DATABASE_URL = "postgresql://postgres:PASSWORD@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"');
  process.exit(1);
}

