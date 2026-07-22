import { Pool } from 'pg';
import { env } from './env';

// Singleton connection pool — shared across all repositories
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});
