import { Job } from 'bullmq';
import {
  getLogger,
  getDataSource,
  Notification,
  NotificationStatus,
  QueueProducer,
  EmailJobData,
  DLQJobData,
  QUEUE_NAMES,
} from 'shared';
import { EmailProvider } from '../email/provider.interface';
import { TemplateEngine } from '../templates/engine';
import { evaluateRetry } from '../retry/strategy';

const logger = getLogger('email-consumer');

/**
 * Email Consumer — processes email jobs from the queue.
 *
 * Responsibilities:
 * 1. Load notification from DB
 * 2. Render email template
 * 3. Send email via provider
 * 4. Update notification status
 * 5. Handle failures (retry or DLQ)
 */
export class EmailConsumer {
  private emailProvider: EmailProvider;
  private templateEngine: TemplateEngine;
  private queueProducer: QueueProducer;

  constructor(
    emailProvider: EmailProvider,
    templateEngine: TemplateEngine,
    queueProducer: QueueProducer
  ) {
    this.emailProvider = emailProvider;
    this.templateEngine = templateEngine;
    this.queueProducer = queueProducer;
  }

  /**
   * Process a single email job.
   * This is the function passed to the BullMQ Worker.
   */
  async process(job: Job<EmailJobData>): Promise<void> {
    const { notificationId, email, templateId, subject, payload } = job.data;
    const attempt = job.attemptsMade + 1;

    logger.info(
      { jobId: job.id, notificationId, email, templateId, attempt },
      'Processing email job'
    );

    const repo = getDataSource().getRepository(Notification);

    // --- Update status to PROCESSING ---
    await repo.update(notificationId, {
      status: NotificationStatus.PROCESSING,
      retryCount: attempt - 1,
    });

    try {
      // --- Validate template exists ---
      if (!this.templateEngine.hasTemplate(templateId)) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // --- Render template ---
      const html = this.templateEngine.render(templateId, payload);
      const emailSubject = subject || this.getDefaultSubject(templateId);

      // --- Send email ---
      await this.emailProvider.send(email, emailSubject, html);

      // --- Mark as SENT ---
      await repo.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        retryCount: attempt - 1,
      });

      logger.info(
        { notificationId, email, templateId, attempt },
        '✅ Email sent successfully'
      );
    } catch (error) {
      const err = error as Error;

      logger.error(
        { notificationId, email, attempt, err },
        'Email sending failed'
      );

      // --- Evaluate retry strategy ---
      const decision = evaluateRetry(attempt, err);

      if (decision.moveToDLQ) {
        // Move to DLQ
        await this.moveToDLQ(job, err, decision.reason);
        await repo.update(notificationId, {
          status: NotificationStatus.DLQ,
          failureReason: decision.reason,
          retryCount: attempt,
        });
      } else {
        // Let BullMQ handle the retry (it's configured with backoff)
        await repo.update(notificationId, {
          status: NotificationStatus.FAILED,
          failureReason: err.message,
          retryCount: attempt,
        });
      }

      // Re-throw so BullMQ knows the job failed
      // BullMQ will auto-retry based on job options if retries remain
      throw error;
    }
  }

  /**
   * Move a permanently failed job to the Dead Letter Queue.
   */
  private async moveToDLQ(
    job: Job<EmailJobData>,
    error: Error,
    reason: string
  ): Promise<void> {
    const dlqData: DLQJobData = {
      ...job.data,
      failureReason: reason,
      originalQueue: QUEUE_NAMES.EMAIL_NOTIFICATIONS,
      failedAt: new Date().toISOString(),
      totalAttempts: job.attemptsMade + 1,
    };

    await this.queueProducer.enqueueDLQ(dlqData);

    logger.warn(
      {
        notificationId: job.data.notificationId,
        totalAttempts: dlqData.totalAttempts,
        reason,
      },
      '💀 Job moved to Dead Letter Queue'
    );
  }

  /**
   * Default subjects per template when not provided.
   */
  private getDefaultSubject(templateId: string): string {
    const subjects: Record<string, string> = {
      welcome_email: 'Welcome to our platform!',
      password_reset: 'Reset your password',
    };
    return subjects[templateId] || 'Notification';
  }
}
