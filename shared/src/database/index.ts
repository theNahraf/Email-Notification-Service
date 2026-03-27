import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Notification } from '../models/notification';
import { User } from '../models/user';
import { ApiKey } from '../models/api-key';
import { SmtpConfig } from '../models/smtp-config';
import { getConfig } from '../config';
import { getLogger } from '../logger';

const logger = getLogger('database');

let _dataSource: DataSource | null = null;

export function createDataSourceOptions(): DataSourceOptions {
  const config = getConfig();
  return {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [Notification, User, ApiKey, SmtpConfig],
    synchronize: false, // Never in production — use migrations or init.sql
    logging: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    poolSize: 20,
    extra: {
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  };
}

export async function initializeDatabase(): Promise<DataSource> {
  if (_dataSource && _dataSource.isInitialized) {
    return _dataSource;
  }

  const options = createDataSourceOptions();
  _dataSource = new DataSource(options);

  try {
    await _dataSource.initialize();
    logger.info('Database connection established');
    return _dataSource;
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to database');
    throw error;
  }
}

export function getDataSource(): DataSource {
  if (!_dataSource || !_dataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _dataSource;
}

export async function closeDatabase(): Promise<void> {
  if (_dataSource && _dataSource.isInitialized) {
    await _dataSource.destroy();
    logger.info('Database connection closed');
    _dataSource = null;
  }
}
