import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';
import { getLogger, HTTP_STATUS } from 'shared';
import { NotificationService } from '../services/notification.service';
import { createError } from '../middlewares/errorHandler';

const logger = getLogger('notification-controller');

let notificationService: NotificationService | null = null;

function getService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}

/**
 * Validation rules for POST /notifications/email
 */
export const createEmailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('template_id')
    .isString()
    .notEmpty()
    .withMessage('template_id is required')
    .isLength({ max: 255 })
    .withMessage('template_id must be 255 characters or less'),
  body('subject')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('subject must be 500 characters or less'),
  body('payload')
    .optional()
    .isObject()
    .withMessage('payload must be a JSON object'),
  body('user_id')
    .optional()
    .isString()
    .isLength({ max: 255 }),
  body('idempotency_key')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('idempotency_key must be 255 characters or less'),
];

/**
 * POST /notifications/email
 * Creates and enqueues an email notification.
 */
export async function createEmailNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { email, template_id, subject, payload, user_id, idempotency_key } = req.body;

    logger.info(
      { requestId: req.requestId, email, templateId: template_id },
      'Creating email notification'
    );

    const result = await getService().createEmailNotification({
      email,
      templateId: template_id,
      subject,
      payload,
      userId: user_id,
      idempotencyKey: idempotency_key,
    });

    const statusCode =
      result.status === 'queued' ? HTTP_STATUS.ACCEPTED : HTTP_STATUS.OK;

    res.status(statusCode).json({
      id: result.id,
      status: result.status,
      message: result.message,
    });
  } catch (error: any) {
    // Handle unique constraint violation (idempotency race condition)
    if (error?.code === '23505') {
      res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Duplicate notification',
        message: 'A notification with this idempotency key already exists',
      });
      return;
    }
    next(error);
  }
}

/**
 * GET /notifications/:id
 * Retrieves a notification by ID.
 */
export async function getNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid ID format',
        message: 'ID must be a valid UUID',
      });
      return;
    }

    const notification = await getService().getNotification(id);

    if (!notification) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Not found',
        message: `Notification ${id} not found`,
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      id: notification.id,
      email: notification.email,
      channel: notification.channel,
      template_id: notification.templateId,
      status: notification.status,
      retry_count: notification.retryCount,
      failure_reason: notification.failureReason,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
      sent_at: notification.sentAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validation rules for POST /notifications/send (simple raw send)
 */
export const sendRawEmailValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid recipient email is required')
    .normalizeEmail(),
  body('subject')
    .isString()
    .notEmpty()
    .withMessage('subject is required')
    .isLength({ max: 500 }),
  body('body')
    .isString()
    .notEmpty()
    .withMessage('body is required'),
];

/**
 * POST /notifications/send
 * Simple endpoint: just provide email, subject, and body — it sends.
 */
export async function sendRawEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { email, subject, body: emailBody } = req.body;

    logger.info(
      { requestId: req.requestId, email, subject },
      'Sending raw email'
    );

    const result = await getService().createEmailNotification({
      email,
      templateId: 'custom_email',
      subject,
      payload: { subject, body: emailBody },
    });

    res.status(HTTP_STATUS.ACCEPTED).json({
      id: result.id,
      status: result.status,
      message: result.message,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Duplicate notification',
        message: 'A notification with this idempotency key already exists',
      });
      return;
    }
    next(error);
  }
}

export async function closeNotificationService(): Promise<void> {
  if (notificationService) {
    await notificationService.close();
    notificationService = null;
  }
}
