import { SmtpConfigData } from 'shared';

/**
 * Email Provider Interface
 *
 * All email providers must implement this interface.
 * This enables plug-and-play switching between SMTP, SES, SendGrid, etc.
 */
export interface EmailProvider {
  /**
   * Send an email.
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param html - Rendered HTML body
   * @param from - Optional sender override
   * @param smtpConfig - Optional per-user SMTP credentials
   */
  send(to: string, subject: string, html: string, from?: string, smtpConfig?: SmtpConfigData): Promise<void>;

  /**
   * Verify the provider connection is healthy.
   */
  verify(): Promise<boolean>;

  /**
   * Provider name for logging.
   */
  readonly name: string;
}
