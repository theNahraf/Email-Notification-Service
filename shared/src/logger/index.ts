import pino from 'pino';
import { getConfig } from '../config';

let _logger: pino.Logger | null = null;

export function getLogger(name?: string): pino.Logger {
  if (!_logger) {
    const config = getConfig();
    _logger = pino({
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      base: {
        service: 'notification-service',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    });
  }

  return name ? _logger.child({ component: name }) : _logger;
}

export type Logger = pino.Logger;
