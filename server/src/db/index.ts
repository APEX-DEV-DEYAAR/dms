import { config } from '../config';
import { BaseDBAdapter } from './adapters/base.adapter';
import { PostgresAdapter } from './adapters/postgres.adapter';

export function createDBAdapter(): BaseDBAdapter {
  return new PostgresAdapter(config.db);
}

export { BaseDBAdapter };
