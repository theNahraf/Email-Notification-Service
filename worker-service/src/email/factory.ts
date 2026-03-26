import { getConfig, getLogger } from 'shared';
import { EmailProvider } from './provider.interface';
import { SmtpProvider } from './smtp.provider';
import { ConsoleProvider } from './console.provider';

const logger = getLogger('email-factory');

/**
 * Factory for creating email providers based on configuration.
 * Supports: 'smtp' (Nodemailer), 'console' (dev/test).
 * Extensible: add 'ses', 'sendgrid', etc.
 */
export function createEmailProvider(): EmailProvider {
  const config = getConfig();
  const providerType = config.email.provider;

  let provider: EmailProvider;

  switch (providerType) {
    case 'smtp':
      provider = new SmtpProvider();
      break;
    case 'console':
      provider = new ConsoleProvider();
      break;
    default:
      logger.warn(
        { provider: providerType },
        'Unknown email provider — falling back to console'
      );
      provider = new ConsoleProvider();
  }

  logger.info({ provider: provider.name }, 'Email provider created');
  return provider;
}
