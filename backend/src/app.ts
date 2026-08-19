import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/swagger.config';
import { errorHandler } from './common/middlewares/error-handler.middleware';
import { auditLogMiddleware } from './common/middlewares/audit-log.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { rolesRoutes } from './modules/roles/roles.routes';
import { factoriesRoutes } from './modules/factories/factories.routes';
import { machinesRoutes } from './modules/machines/machines.routes';
import { leadersRoutes } from './modules/leaders/leaders.routes';
import { masterPartsRoutes } from './modules/master-parts/master-parts.routes';
import { orderConversionsRoutes } from './modules/order-conversions/order-conversions.routes';
import { labelCountersRoutes } from './modules/label-counters/label-counters.routes';
import { historyOrdersRoutes } from './modules/history-orders/history-orders.routes';
import { createProductionPlansRoutes } from './modules/production-plans/production-plans.routes';
import { globalLogsRoutes } from './modules/global-logs/global-logs.routes';
import { siteConfigRoutes } from './modules/site-config/site-config.routes';
import { btPrintersRoutes } from './modules/bt-printers/bt-printers.routes';
import { qrWebhookRouter, startQrWebhookPoller } from './modules/machines/qr-webhook.service';

// Creates and configures the Express app
export const createApp = () => {
  const app = express();

  // Trust proxy for secure cookies behind Railway/Vercel reverse proxies
  app.set('trust proxy', 1);

  // Jalankan background poller QR Webhook IoT
  startQrWebhookPoller(1000);

  // --- Global Middleware ---
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
      if (!origin) return callback(null, true);
      if (env.frontendUrls.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // --- Audit Log Middleware (must be before routes so res.on('finish') fires correctly) ---
  app.use(auditLogMiddleware);

  // --- Webhook & Mock Router (bisa diakses di /iot/... dan /api/webhook/...) ---
  app.use(qrWebhookRouter);

  // --- API Documentation ---
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Routes ---
  app.use('/api/auth',              authRoutes);
  app.use('/api/users',             usersRoutes);
  app.use('/api/roles',             rolesRoutes);
  app.use('/api/factories',         factoriesRoutes);
  app.use('/api/machines',          machinesRoutes);
  app.use('/api/leaders',           leadersRoutes);
  app.use('/api/parts',             masterPartsRoutes);
  app.use('/api/order-conversions', orderConversionsRoutes);
  app.use('/api/label-counters',    labelCountersRoutes);
  app.use('/api/history-orders',    historyOrdersRoutes);
  app.use('/api/production-plans',  createProductionPlansRoutes());
  app.use('/api/global-logs',       globalLogsRoutes);
  app.use('/api/site-config',       siteConfigRoutes);
  app.use('/api/bt-printers',       btPrintersRoutes);

  // Health check — useful for Docker and uptime monitors
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // --- Global Error Handler (must be last) ---
  app.use(errorHandler);

  return app;
};
