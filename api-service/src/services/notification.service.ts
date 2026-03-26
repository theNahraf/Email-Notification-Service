import Redis from 'ioredis';
import {
  getConfig,
  getLogger,
  getDataSource,
  Notification,
  NotificationStatus,
  NotificationChannel,
  QueueProducer,
  EmailJobData,
  REDIS_KEYS,
  DEFAULTS,
} from 'shared';

const logger = getLogger('notification-service');

export interface CreateNotificationDTO {
  email: string;
  templateId: string;
  subject?: string;
  payload?: Record<string, any>;
  userId?: string;
  idempotencyKey?: string;
}

export interface NotificationResponse {
  id: string;
  status: string;
  message: string;
}

export class NotificationService {
  private queueProducer: QueueProducer;
  private redis: Redis;

  constructor() {
    const config = getConfig();
    this.queueProducer = new QueueProducer();
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  /**
   * Create and enqueue an email notification.
   * Handles idempotency checks and stores the notification in DB.
   */
  async createEmailNotification(dto: CreateNotificationDTO): Promise<NotificationResponse> {
    const repo = getDataSource().getRepository(Notification);

    // --- Idempotency Check ---
    if (dto.idempotencyKey) {
      logger.debug({ idempotencyKey: dto.idempotencyKey }, 'Performing idempotency check');
      const existing = await this.checkIdempotency(dto.idempotencyKey);
      if (existing) {
        logger.info(
          { idempotencyKey: dto.idempotencyKey, existingId: existing.id },
          'Duplicate request detected — returning existing notification'
        );
        return {
          id: existing.id,
          status: existing.status,
          message: 'Notification already exists (idempotent)',
        };
      }
    }

    // --- Create Notification Record ---
    const notification = repo.create({
      email: dto.email,
      templateId: dto.templateId,
      subject: dto.subject || null,
      payload: dto.payload || {},
      userId: dto.userId || null,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.PENDING,
      idempotencyKey: dto.idempotencyKey || null,
      retryCount: 0,
      maxRetries: getConfig().retry.maxAttempts,
    });

    logger.debug({ email: dto.email, channel: NotificationChannel.EMAIL }, 'Saving notification record to database');
    const saved = await repo.save(notification);
    logger.info({ notificationId: saved.id, email: dto.email, status: saved.status }, 'Notification created in DB');

    // --- Enqueue to Worker ---
    try {
      const jobData: EmailJobData = {
        notificationId: saved.id,
        email: saved.email,
        templateId: saved.templateId,
        subject: saved.subject || undefined,
        payload: saved.payload,
        userId: saved.userId || undefined,
      };

      logger.debug({ notificationId: saved.id }, 'Enqueuing email job to BullMQ');
      await this.queueProducer.enqueueEmail(jobData, {
        jobId: saved.id, // Use notification ID as job ID for traceability
      });

      // Update status to QUEUED
      logger.debug({ notificationId: saved.id }, 'Updating notification status to QUEUED');
      await repo.update(saved.id, { status: NotificationStatus.QUEUED });

      // Cache idempotency key
      if (dto.idempotencyKey) {
        await this.cacheIdempotencyKey(dto.idempotencyKey, saved.id);
      }

      return {
        id: saved.id,
        status: NotificationStatus.QUEUED,
        message: 'Notification queued for delivery',
      };
    } catch (error) {
      // If queue fails, update status but don't lose the notification
      await repo.update(saved.id, {
        status: NotificationStatus.FAILED,
        failureReason: 'Failed to enqueue: ' + (error as Error).message,
      });

      logger.error({ err: error, notificationId: saved.id }, 'Failed to enqueue notification');
      throw error;
    }
  }

  /**
   * Get a notification by ID.
   */
  async getNotification(id: string): Promise<Notification | null> {
    const repo = getDataSource().getRepository(Notification);
    return repo.findOneBy({ id });
  }

  /**
   * Get queue statistics for monitoring.
   */
  async getQueueStats() {
    const [emailStats, dlqStats] = await Promise.all([
      this.queueProducer.getEmailQueueStats(),
      this.queueProducer.getDLQStats(),
    ]);

    return {
      emailQueue: emailStats,
      dlq: dlqStats,
    };
  }

  /**
   * Check if an idempotency key already exists.
   * Checks Redis first (fast path), then falls back to DB.
   */
  private async checkIdempotency(key: string): Promise<Notification | null> {
    // Fast path: check Redis cache
    try {
      const cachedId = await this.redis.get(`${REDIS_KEYS.IDEMPOTENCY}${key}`);
      if (cachedId) {
        const repo = getDataSource().getRepository(Notification);
        return repo.findOneBy({ id: cachedId });
      }
    } catch (err) {
      logger.warn({ err }, 'Redis idempotency check failed — falling back to DB');
    }

    // Slow path: check DB
    const repo = getDataSource().getRepository(Notification);
    return repo.findOneBy({ idempotencyKey: key });
  }

  /**
   * Cache idempotency key in Redis with TTL.
   */
  private async cacheIdempotencyKey(key: string, notificationId: string): Promise<void> {
    try {
      await this.redis.set(
        `${REDIS_KEYS.IDEMPOTENCY}${key}`,
        notificationId,
        'EX',
        DEFAULTS.IDEMPOTENCY_TTL_SECONDS
      );
    } catch (err) {
      // Non-critical — DB still has the unique constraint
      logger.warn({ err }, 'Failed to cache idempotency key in Redis');
    }
  }

  async close(): Promise<void> {
    await Promise.all([this.queueProducer.close(), this.redis.quit()]);
  }
}
