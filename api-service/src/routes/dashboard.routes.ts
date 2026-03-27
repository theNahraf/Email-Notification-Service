import { Router } from 'express';
import { jwtMiddleware } from '../middlewares/auth';
import {
  listApiKeys,
  createApiKey,
  createApiKeyValidation,
  revokeApiKey,
  getSmtpConfig,
  saveSmtpConfig,
  saveSmtpValidation,
  verifySmtpConfig,
  listEmails,
  getDashboardStats,
} from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require JWT auth
router.use(jwtMiddleware);

// Dashboard stats
router.get('/stats', getDashboardStats);

// API Keys management
router.get('/api-keys', listApiKeys);
router.post('/api-keys', createApiKeyValidation, createApiKey);
router.delete('/api-keys/:id', revokeApiKey);

// SMTP settings
router.get('/smtp', getSmtpConfig);
router.put('/smtp', saveSmtpValidation, saveSmtpConfig);
router.post('/smtp/verify', verifySmtpConfig);

// Email logs
router.get('/emails', listEmails);

export default router;
