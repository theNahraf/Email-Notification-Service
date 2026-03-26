import { Worker, Job, WorkerOptions } from 'bullmq';
import { getConfig } from '../config';
import { getLogger } from '../logger';
import { QUEUE_NAMES } from '../constants';
import { EmailJobData } from './types';

const logger = getLogger('queue-consumer');

export type EmailJobProcessor = (job: Job<EmailJobData>) => Promise<void>;

export class QueueConsumer {
  private worker: Worker<EmailJobData> | null = null;

  async start(processor: EmailJobProcessor): Promise<void> {
    const config = getConfig();

    const workerOptions: WorkerOptions = {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
      },
      concurrency: config.queue.concurrency,
      limiter: {
        max: 50,       // Max 50 jobs
        duration: 1000, // Per second — rate limiting at worker level
      },
    };

    this.worker = new Worker<EmailJobData>(
      QUEUE_NAMES.EMAIL_NOTIFICATIONS,
      processor,
      workerOptions
    );

    // Event listeners
    this.worker.on('completed', (job) => {
      logger.info(
        { jobId: job.id, notificationId: job.data.notificationId },
        'Job completed successfully'
      );
    });

    this.worker.on('failed', (job, err) => {
      logger.error(
        {
          jobId: job?.id,
          notificationId: job?.data.notificationId,
          attempt: job?.attemptsMade,
          err,
        },
        'Job failed'
      );
    });

    this.worker.on('error', (err) => {
      logger.error({ err }, 'Worker error');
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn({ jobId }, 'Job stalled');
    });

    logger.info(
      { concurrency: config.queue.concurrency },
      'Queue consumer started'
    );
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      logger.info('Queue consumer closed');
    }
  }

  isRunning(): boolean {
    return this.worker !== null && this.worker.isRunning();
  }
}
