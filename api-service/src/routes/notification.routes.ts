import { Router } from 'express';
import {
  createEmailNotification,
  createEmailValidation,
  getNotification,
  sendRawEmail,
  sendRawEmailValidation,
} from '../controllers/notification.controller';

const router = Router();

/**
 * POST /notifications/email
 * Trigger an email notification (template-based).
 */
router.post('/email', createEmailValidation, createEmailNotification);

/**
 * POST /notifications/send
 * Simple send: provide email, subject, body — done.
 */
router.post('/send', sendRawEmailValidation, sendRawEmail);

/**
 * GET /notifications/:id
 * Get notification status by ID.
 */
router.get('/:id', getNotification);

export default router;
