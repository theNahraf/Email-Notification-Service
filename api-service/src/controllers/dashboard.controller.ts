import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { getLogger, getConfig, getDataSource, HTTP_STATUS } from 'shared';
import { ApiKey } from 'shared';
import { SmtpConfig } from 'shared';
import { Notification } from 'shared';
import { encrypt, decrypt } from '../utils/encryption';

const logger = getLogger('dashboard-controller');

function generateApiKey(): string {
  return 'nk_' + crypto.randomBytes(24).toString('hex');
}

// --- API Keys ---

export async function listApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(ApiKey);
    const keys = await repo.find({
      where: { userId: req.userId! },
      order: { createdAt: 'DESC' },
    });

    res.json({
      keys: keys.map(k => ({
        id: k.id,
        keyName: k.keyName,
        apiKey: k.apiKey.slice(0, 10) + '...' + k.apiKey.slice(-4),
        fullKey: k.apiKey,
        isActive: k.isActive,
        lastUsed: k.lastUsed,
        createdAt: k.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export const createApiKeyValidation = [
  body('name').optional().isString().isLength({ max: 255 }),
];

export async function createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(ApiKey);
    const keyCount = await repo.count({ where: { userId: req.userId! } });
    if (keyCount >= 10) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Limit reached', message: 'Maximum 10 API keys per user' });
      return;
    }

    const apiKey = repo.create({
      userId: req.userId!,
      keyName: req.body.name || `Key ${keyCount + 1}`,
      apiKey: generateApiKey(),
    });
    const saved = await repo.save(apiKey);

    logger.info({ userId: req.userId, keyId: saved.id }, 'API key created');

    res.status(HTTP_STATUS.CREATED).json({
      id: saved.id,
      keyName: saved.keyName,
      apiKey: saved.apiKey,
      message: 'API key created. Copy it now — it will be partially hidden next time.',
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(ApiKey);
    const key = await repo.findOneBy({ id: req.params.id, userId: req.userId! });
    if (!key) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Not found' });
      return;
    }

    await repo.remove(key);
    logger.info({ userId: req.userId, keyId: req.params.id }, 'API key revoked');

    res.json({ message: 'API key revoked' });
  } catch (error) {
    next(error);
  }
}

// --- SMTP Settings ---

export async function getSmtpConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(SmtpConfig);
    const config = await repo.findOneBy({ userId: req.userId! });

    if (!config) {
      res.json({ configured: false, smtp: null });
      return;
    }

    res.json({
      configured: true,
      smtp: {
        id: config.id,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser,
        emailFrom: config.emailFrom,
        isVerified: config.isVerified,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const saveSmtpValidation = [
  body('smtpHost').isString().notEmpty().withMessage('SMTP host is required'),
  body('smtpPort').isInt({ min: 1, max: 65535 }).withMessage('Valid port is required'),
  body('smtpSecure').optional().isBoolean(),
  body('smtpUser').isString().notEmpty().withMessage('SMTP username is required'),
  body('smtpPass').isString().notEmpty().withMessage('SMTP password is required'),
  body('emailFrom').isEmail().withMessage('Valid from email is required'),
];

export async function saveSmtpConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, emailFrom } = req.body;
    const repo = getDataSource().getRepository(SmtpConfig);

    let config = await repo.findOneBy({ userId: req.userId! });
    const encryptedPass = encrypt(smtpPass);

    if (config) {
      config.smtpHost = smtpHost;
      config.smtpPort = smtpPort;
      config.smtpSecure = smtpSecure || false;
      config.smtpUser = smtpUser;
      config.smtpPass = encryptedPass;
      config.emailFrom = emailFrom;
      config.isVerified = false;
      await repo.save(config);
    } else {
      config = repo.create({
        userId: req.userId!,
        smtpHost,
        smtpPort,
        smtpSecure: smtpSecure || false,
        smtpUser,
        smtpPass: encryptedPass,
        emailFrom,
      });
      await repo.save(config);
    }

    logger.info({ userId: req.userId }, 'SMTP config saved');

    res.json({ message: 'SMTP settings saved', isVerified: false });
  } catch (error) {
    next(error);
  }
}

export async function verifySmtpConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(SmtpConfig);
    const config = await repo.findOneBy({ userId: req.userId! });

    if (!config) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'No SMTP configuration found' });
      return;
    }

    const decryptedPass = decrypt(config.smtpPass);

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: decryptedPass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });

    try {
      await transporter.verify();
      config.isVerified = true;
      await repo.save(config);
      logger.info({ userId: req.userId }, 'SMTP verified successfully');
      res.json({ verified: true, message: 'SMTP connection verified successfully' });
    } catch (smtpErr: any) {
      config.isVerified = false;
      await repo.save(config);
      logger.warn({ userId: req.userId, err: smtpErr }, 'SMTP verification failed');
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        verified: false,
        message: 'SMTP verification failed: ' + smtpErr.message,
      });
    } finally {
      transporter.close();
    }
  } catch (error) {
    next(error);
  }
}

// --- Email Logs ---

export async function listEmails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repo = getDataSource().getRepository(Notification);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const [emails, total] = await repo.findAndCount({
      where: { ownerId: req.userId! },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    res.json({
      emails: emails.map(e => ({
        id: e.id,
        email: e.email,
        subject: e.subject,
        templateId: e.templateId,
        status: e.status,
        retryCount: e.retryCount,
        failureReason: e.failureReason,
        sentAt: e.sentAt,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// --- Dashboard Stats ---

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifRepo = getDataSource().getRepository(Notification);
    const keyRepo = getDataSource().getRepository(ApiKey);
    const smtpRepo = getDataSource().getRepository(SmtpConfig);

    const [totalEmails, sentEmails, failedEmails, apiKeyCount, smtpConfig] = await Promise.all([
      notifRepo.count({ where: { ownerId: req.userId! } }),
      notifRepo.count({ where: { ownerId: req.userId!, status: 'sent' as any } }),
      notifRepo.count({ where: { ownerId: req.userId!, status: 'failed' as any } }),
      keyRepo.count({ where: { userId: req.userId! } }),
      smtpRepo.findOneBy({ userId: req.userId! }),
    ]);

    res.json({
      totalEmails,
      sentEmails,
      failedEmails,
      queuedEmails: totalEmails - sentEmails - failedEmails,
      apiKeyCount,
      smtpConfigured: !!smtpConfig,
      smtpVerified: smtpConfig?.isVerified || false,
    });
  } catch (error) {
    next(error);
  }
}
