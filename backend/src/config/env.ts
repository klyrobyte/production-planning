import 'dotenv/config';

// Throws at startup if a required environment variable is missing
const requireEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  port:             parseInt(process.env.PORT || '3000', 10),
  nodeEnv:          process.env.NODE_ENV || 'development',
  isProd:           process.env.NODE_ENV === 'production',
  databaseUrl:      requireEnv('DATABASE_URL'),
  redisUrl:         requireEnv('REDIS_URL'),
  jwtSecret:        requireEnv('JWT_SECRET'),
  pinEncryptionKey: requireEnv('PIN_ENCRYPTION_KEY'),
  cookieName:       'sugity_session',
  cookieMaxAge:     60 * 60 * 24 * 30, // 30 days in seconds
  // Comma-separated list of allowed frontend origins, e.g.:
  // https://my-app.vercel.app,https://custom-domain.com
  frontendUrls:     (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
};
