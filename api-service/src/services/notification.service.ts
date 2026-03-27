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
  SmtpConfigData,
  REDIS_KEYS,
  DEFAULTS,
} from 'shared';
import { SmtpConfig } from 'shared';
import { decrypt } from '../utils/encryption';

const logger = getLogger('notification-service');

export interface CreateNotificationDTO {
  email: string;
  templateId: string;
  subject?: string;
  payload?: Record<string, any>;
  userId?: string;
  idempotencyKey?: string;
  ownerId?: string;
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
   */
  async createEmailNotification(dto: CreateNotificationDTO): Promise<NotificationResponse> {
    const config = getConfig();
    const repo = getDataSource().getRepository(Notification);

    // --- Idempotency Check ---
    if (dto.idempotencyKey) {
      logger.debug({ idempotencyKey: dto.idempotencyKey }, 'Performing idempotency check');
      const existing = await this.checkIdempotency(dto.idempotencyKey);
      if (existing) {
        return {
          id: existing.id,
          status: existing.status,
          message: 'Notification already exists (idempotent)',
        };
      }
    }

    // --- Get per-user SMTP config if available ---
    let smtpConfig: SmtpConfigData | undefined;
    if (dto.ownerId) {
      const smtpRepo = getDataSource().getRepository(SmtpConfig);
      const userSmtp = await smtpRepo.findOneBy({ userId: dto.ownerId });

      if (userSmtp) {
        const decryptedPass = decrypt(userSmtp.smtpPass);
        smtpConfig = {
          host: userSmtp.smtpHost,
          port: userSmtp.smtpPort,
          secure: userSmtp.smtpSecure,
          user: userSmtp.smtpUser,
          pass: decryptedPass,
          from: userSmtp.emailFrom,
        };
      } else {
        // Fallback: check daily rate limit
        const today = new Date().toISOString().split('T')[0];
        const rateLimitKey = `fallback:${dto.ownerId}:${today}`;
        const currentCount = parseInt(await this.redis.get(rateLimitKey) || '0', 10);

        if (currentCount >= config.fallback.dailyLimit) {
          logger.warn({ userId: dto.ownerId, currentCount }, 'Fallback daily limit exceeded');
          throw new Error(
            `Daily fallback limit (${config.fallback.dailyLimit} emails/day) exceeded. Please configure your own SMTP settings in the dashboard.`
          );
        }

        // Increment counter with 24h TTL
        await this.redis.multi().incr(rateLimitKey).expire(rateLimitKey, 86400).exec();
        logger.info({ userId: dto.ownerId, count: currentCount + 1, limit: config.fallback.dailyLimit }, 'Using fallback SMTP');
      }
    }

    // --- Create Notification Record ---
    const notification = repo.create({
      email: dto.email,
      templateId: dto.templateId,
      subject: dto.subject || null,
      payload: dto.payload || {},
      userId: dto.userId || null,
      ownerId: dto.ownerId || null,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.PENDING,
      idempotencyKey: dto.idempotencyKey || null,
      retryCount: 0,
      maxRetries: config.retry.maxAttempts,
    });

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
        ownerId: dto.ownerId || undefined,
        smtpConfig,
      };

      await this.queueProducer.enqueueEmail(jobData, {
        jobId: saved.id,
      });

      await repo.update(saved.id, { status: NotificationStatus.QUEUED });

      if (dto.idempotencyKey) {
        await this.cacheIdempotencyKey(dto.idempotencyKey, saved.id);
      }

      return {
        id: saved.id,
        status: NotificationStatus.QUEUED,
        message: 'Notification queued for delivery',
      };
    } catch (error) {
      await repo.update(saved.id, {
        status: NotificationStatus.FAILED,
        failureReason: 'Failed to enqueue: ' + (error as Error).message,
      });
      logger.error({ err: error, notificationId: saved.id }, 'Failed to enqueue notification');
      throw error;
    }
  }

  async getNotification(id: string): Promise<Notification | null> {
    const repo = getDataSource().getRepository(Notification);
    return repo.findOneBy({ id });
  }

  async getQueueStats() {
    const [emailStats, dlqStats] = await Promise.all([
      this.queueProducer.getEmailQueueStats(),
      this.queueProducer.getDLQStats(),
    ]);
    return { emailQueue: emailStats, dlq: dlqStats };
  }

  private async checkIdempotency(key: string): Promise<Notification | null> {
    try {
      const cachedId = await this.redis.get(`${REDIS_KEYS.IDEMPOTENCY}${key}`);
      if (cachedId) {
        return getDataSource().getRepository(Notification).findOneBy({ id: cachedId });
      }
    } catch (err) {
      logger.warn({ err }, 'Redis idempotency check failed');
    }
    return getDataSource().getRepository(Notification).findOneBy({ idempotencyKey: key });
  }

  private async cacheIdempotencyKey(key: string, notificationId: string): Promise<void> {
    try {
      await this.redis.set(`${REDIS_KEYS.IDEMPOTENCY}${key}`, notificationId, 'EX', DEFAULTS.IDEMPOTENCY_TTL_SECONDS);
    } catch (err) {
      logger.warn({ err }, 'Failed to cache idempotency key');
    }
  }

  async close(): Promise<void> {
    await Promise.all([this.queueProducer.close(), this.redis.quit()]);
  }
}
