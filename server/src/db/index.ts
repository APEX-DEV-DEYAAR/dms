import { config } from '../config';
import { DB_TYPES } from '../shared/constants';
import { BaseDBAdapter } from './adapters/base.adapter';
import { PostgresAdapter } from './adapters/postgres.adapter';

export function createDBAdapter(): BaseDBAdapter {
  switch (config.db.type) {
    case DB_TYPES.POSTGRES:
      return new PostgresAdapter(config.db);

    case DB_TYPES.ORACLE: {
      // Lazy-import to avoid requiring oracledb when not in use
      const { OracleAdapter } = require('./adapters/oracle.adapter');
      return new OracleAdapter({
        user: config.db.user,
        password: config.db.password,
        connectString: config.db.oracle.connectString,
      });
    }

    default:
      throw new Error(`Unsupported DB_TYPE: "${config.db.type}". Supported: ${Object.values(DB_TYPES).join(', ')}`);
  }
}

export { BaseDBAdapter };
