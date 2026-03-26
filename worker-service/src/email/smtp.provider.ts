import * as nodemailer from 'nodemailer';
import { getConfig, getLogger } from 'shared';
import { EmailProvider } from './provider.interface';

const logger = getLogger('smtp-provider');

/**
 * SMTP Email Provider using Nodemailer.
 * Supports any SMTP server (Gmail, Mailhog, SES SMTP, etc.)
 */
export class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  private transporter: nodemailer.Transporter;

  constructor() {
    const config = getConfig();

    this.transporter = nodemailer.createTransport({
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
      // Connection pool for performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Timeouts
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    logger.info(
      { host: config.email.smtp.host, port: config.email.smtp.port },
      'SMTP provider initialized'
    );
  }

  async send(to: string, subject: string, html: string, from?: string): Promise<void> {
    const config = getConfig();
    const senderAddress = from || config.email.from;

    logger.debug({ to, subject, senderAddress }, 'Initiating SMTP transmission via Nodemailer');

    const info = await this.transporter.sendMail({
      from: senderAddress,
      to,
      subject,
      html,
    });

    logger.info(
      { messageId: info.messageId, to, subject, response: info.response },
      'Email sent via SMTP'
    );
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (err) {
      logger.error({ err }, 'SMTP connection verification failed');
      return false;
    }
  }
}
