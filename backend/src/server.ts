import http from 'http';
import { env } from './config/env';
import { pool } from './config/database';
import { redis } from './config/redis';
import { createApp } from './app';
import { createSocketServer } from './websocket/socket.server';

const bootstrap = async () => {
  // Verify DB and Redis are reachable before starting
  await pool.query('SELECT 1');
  await redis.connect();
  console.log('[DB] Connected to PostgreSQL');
  console.log('[Redis] Connected');

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[Server] Running on http://localhost:${env.port}`);
    console.log(`[Swagger] Docs at http://localhost:${env.port}/api/docs`);
  });

  // Graceful shutdown — close DB and Redis before exiting
  const shutdown = async () => {
    console.log('\n[Server] Shutting down...');
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
};

bootstrap().catch((err) => {
  console.error('[Fatal] Failed to start server:', err.message);
  process.exit(1);
});
