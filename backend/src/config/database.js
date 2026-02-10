import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
};

if (!process.env.DATABASE_URL) {
  connectionConfig.host = process.env.DB_HOST;
  connectionConfig.port = process.env.DB_PORT;
  connectionConfig.database = process.env.DB_NAME;
  connectionConfig.user = process.env.DB_USER;
  connectionConfig.password = process.env.DB_PASSWORD;
  delete connectionConfig.connectionString;
}

const pool = new Pool(connectionConfig);

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
