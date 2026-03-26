import { getLogger } from 'shared';
import { EmailProvider } from './provider.interface';

const logger = getLogger('console-provider');

/**
 * Console Email Provider — logs emails to stdout.
 * Use for local development and testing.
 */
export class ConsoleProvider implements EmailProvider {
  readonly name = 'console';

  async send(to: string, subject: string, html: string, from?: string): Promise<void> {
    const separator = '═'.repeat(60);

    logger.info(
      {
        from: from || 'default-sender',
        to,
        subject,
        htmlLength: html.length,
      },
      `\n${separator}\n📧 EMAIL SENT (Console Provider)\n${separator}\nTo: ${to}\nSubject: ${subject}\n${separator}\n${html}\n${separator}`
    );
  }

  async verify(): Promise<boolean> {
    logger.info('Console email provider ready (no-op verification)');
    return true;
  }
}
