import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { getLogger, getConfig, getDataSource, HTTP_STATUS } from 'shared';
import { User } from 'shared';
import { ApiKey } from 'shared';

const logger = getLogger('auth-controller');

export const registerValidation = [
  body('name').isString().notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

function generateApiKey(): string {
  return 'nk_' + crypto.randomBytes(24).toString('hex');
}

function signToken(userId: string, email: string): string {
  const config = getConfig();
  return jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { name, email, password } = req.body;
    const userRepo = getDataSource().getRepository(User);
    const keyRepo = getDataSource().getRepository(ApiKey);

    // Check if user exists
    const existing = await userRepo.findOneBy({ email });
    if (existing) {
      res.status(HTTP_STATUS.CONFLICT).json({ error: 'User already exists', message: 'An account with this email already exists' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = userRepo.create({ name, email, password: hashedPassword });
    const saved = await userRepo.save(user);

    // Auto-generate first API key
    const apiKey = keyRepo.create({
      userId: saved.id,
      keyName: 'Default',
      apiKey: generateApiKey(),
    });
    const savedKey = await keyRepo.save(apiKey);

    // Generate JWT
    const token = signToken(saved.id, saved.email);

    logger.info({ userId: saved.id, email }, 'New user registered');

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Account created successfully',
      user: { id: saved.id, name: saved.name, email: saved.email },
      apiKey: savedKey.apiKey,
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const userRepo = getDataSource().getRepository(User);

    const user = await userRepo.findOneBy({ email });
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
      return;
    }

    const token = signToken(user.id, user.email);

    logger.info({ userId: user.id }, 'User logged in');

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    next(error);
  }
}
