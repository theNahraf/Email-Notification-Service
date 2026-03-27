import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { getConfig, getLogger, initializeDatabase, closeDatabase } from 'shared';
import {
  requestIdMiddleware,
  authMiddleware,
  rateLimiterMiddleware,
  errorHandler,
  closeRateLimiterRedis,
} from './middlewares';
import { closeNotificationService } from './controllers/notification.controller';
import notificationRoutes from './routes/notification.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { dashboardHTML } from './ui/dashboard.template';

const logger = getLogger('api-service');

async function bootstrap(): Promise<void> {
  const config = getConfig();
  const app = express();

  // --- Security & Compression ---
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline styles for web UI
  }));
  app.use(cors());
  app.use(compression());

  // --- Body Parsing ---
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // --- Custom Middlewares ---
  app.use(requestIdMiddleware);
  app.use(authMiddleware);
  app.use(rateLimiterMiddleware);

  // --- Request Logging ---
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        'Request completed'
      );
    });
    next();
  });

  // --- Health Check ---
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'api-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // --- Web UI ---
  app.get('/', (_req, res) => {
    res.send(dashboardHTML);
  });

  // --- Routes ---
  app.use('/auth', authRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/notifications', notificationRoutes);

  // --- 404 Handler ---
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    });
  });

  // --- Error Handler ---
  app.use(errorHandler);

  // --- Initialize Database ---
  await initializeDatabase();
  logger.info('Database initialized');

  // --- Start Server ---
  const server = app.listen(config.api.port, () => {
    logger.info(
      { port: config.api.port, env: config.nodeEnv },
      '🚀 API Service started'
    );
  });

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await closeNotificationService();
        await closeRateLimiterRedis();
        await closeDatabase();
        logger.info('All connections closed. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
}


bootstrap().catch((err) => {
  console.error('Failed to start API service:', err);
  process.exit(1);
});
