import { Queue, QueueOptions } from 'bullmq';
import { getConfig } from '../config';
import { getLogger } from '../logger';
import { QUEUE_NAMES } from '../constants';
import { EmailJobData, DLQJobData, QueueJobOptions } from './types';

const logger = getLogger('queue-producer');

export class QueueProducer {
  private emailQueue: Queue<EmailJobData>;
  private dlqQueue: Queue<DLQJobData>;

  constructor() {
    const config = getConfig();
    const connection: QueueOptions['connection'] = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
    };

    this.emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL_NOTIFICATIONS, {
      connection,
      defaultJobOptions: {
        attempts: config.retry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: config.retry.baseDelayMs,
        },
        removeOnComplete: { count: 1000 }, // Keep last 1000 completed
        removeOnFail: { count: 5000 },     // Keep last 5000 failed
      },
    });

    this.dlqQueue = new Queue<DLQJobData>(QUEUE_NAMES.EMAIL_DLQ, {
      connection,
      defaultJobOptions: {
        removeOnComplete: false, // Never auto-remove DLQ jobs
        removeOnFail: false,
      },
    });

    logger.info('Queue producer initialized');
  }

  async enqueueEmail(data: EmailJobData, options?: QueueJobOptions): Promise<string> {
    const job = await this.emailQueue.add('send-email', data, {
      jobId: options?.jobId,
      delay: options?.delay,
      priority: options?.priority,
      ...(options?.attempts && { attempts: options.attempts }),
      ...(options?.backoff && { backoff: options.backoff }),
    });

    logger.info(
      { jobId: job.id, notificationId: data.notificationId, email: data.email },
      'Email job enqueued'
    );

    return job.id!;
  }

  async enqueueDLQ(data: DLQJobData): Promise<string> {
    const job = await this.dlqQueue.add('dlq-email', data);

    logger.warn(
      {
        jobId: job.id,
        notificationId: data.notificationId,
        failureReason: data.failureReason,
      },
      'Job moved to DLQ'
    );

    return job.id!;
  }

  async getEmailQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async getDLQStats() {
    const [waiting, active] = await Promise.all([
      this.dlqQueue.getWaitingCount(),
      this.dlqQueue.getActiveCount(),
    ]);

    return { waiting, active };
  }

  async close(): Promise<void> {
    await Promise.all([this.emailQueue.close(), this.dlqQueue.close()]);
    logger.info('Queue producer closed');
  }
}
