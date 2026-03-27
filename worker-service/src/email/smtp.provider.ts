import * as nodemailer from 'nodemailer';
import { getConfig, getLogger } from 'shared';
import { EmailProvider } from './provider.interface';
import { SmtpConfigData } from 'shared';

const logger = getLogger('smtp-provider');

/**
 * SMTP Email Provider using Nodemailer.
 * Supports per-user SMTP credentials and a global fallback.
 */
export class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  private globalTransporter: nodemailer.Transporter;

  constructor() {
    const config = getConfig();

    this.globalTransporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      ...(config.email.smtp.user && config.email.smtp.pass
        ? {
            auth: {
              user: config.email.smtp.user,
              pass: config.email.smtp.pass,
            },
          }
        : {}),
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    logger.info(
      { host: config.email.smtp.host, port: config.email.smtp.port },
      'SMTP provider initialized'
    );
  }

  /**
   * Create a one-off transporter for per-user SMTP credentials.
   */
  private createUserTransporter(smtp: SmtpConfigData): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  async send(to: string, subject: string, html: string, from?: string, smtpConfig?: SmtpConfigData): Promise<void> {
    const config = getConfig();

    let transporter: nodemailer.Transporter;
    let senderAddress: string;
    let isUserTransporter = false;

    if (smtpConfig) {
      transporter = this.createUserTransporter(smtpConfig);
      senderAddress = smtpConfig.from;
      isUserTransporter = true;
      logger.debug({ to, subject, smtpHost: smtpConfig.host }, 'Using per-user SMTP config');
    } else {
      transporter = this.globalTransporter;
      senderAddress = from || config.email.from;
      logger.debug({ to, subject, senderAddress }, 'Using global SMTP config (fallback)');
    }

    try {
      const info = await transporter.sendMail({ from: senderAddress, to, subject, html });
      logger.info(
        { messageId: info.messageId, to, subject, response: info.response },
        'Email sent via SMTP'
      );
    } finally {
      if (isUserTransporter) {
        transporter.close();
      }
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.globalTransporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (err) {
      logger.error({ err }, 'SMTP connection verification failed');
      return false;
    }
  }
}
