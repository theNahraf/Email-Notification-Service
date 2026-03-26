import 'reflect-metadata';
import {
  getConfig,
  getLogger,
  initializeDatabase,
  closeDatabase,
  QueueConsumer,
  QueueProducer,
} from 'shared';
import { createEmailProvider } from './email/factory';
import { TemplateEngine } from './templates/engine';
import { EmailConsumer } from './consumers/email.consumer';

const logger = getLogger('worker-service');

async function bootstrap(): Promise<void> {
  const config = getConfig();

  logger.info({ env: config.nodeEnv }, '🔧 Starting Worker Service...');

  // --- Initialize Database ---
  await initializeDatabase();
  logger.info('Database connection established');

  // --- Initialize Email Provider ---
  const emailProvider = createEmailProvider();
  const isHealthy = await emailProvider.verify();
  if (!isHealthy) {
    logger.warn('Email provider verification failed — continuing anyway');
  }

  // --- Initialize Template Engine ---
  const templateEngine = new TemplateEngine();
  const templates = templateEngine.getAvailableTemplates();
  logger.info({ templates }, 'Available email templates');

  // --- Initialize Queue Producer (for DLQ) ---
  const queueProducer = new QueueProducer();

  // --- Initialize Email Consumer ---
  const emailConsumer = new EmailConsumer(emailProvider, templateEngine, queueProducer);

  // --- Start Queue Consumer ---
  const queueConsumer = new QueueConsumer();
  await queueConsumer.start(async (job) => {
    await emailConsumer.process(job);
  });

  logger.info(
    {
      concurrency: config.queue.concurrency,
      emailProvider: emailProvider.name,
      maxRetries: config.retry.maxAttempts,
    },
    '🚀 Worker Service started — consuming email jobs'
  );

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    try {
      await queueConsumer.close();
      await queueProducer.close();
      await closeDatabase();
      logger.info('All connections closed. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
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
  console.error('Failed to start Worker Service:', err);
  process.exit(1);
});
