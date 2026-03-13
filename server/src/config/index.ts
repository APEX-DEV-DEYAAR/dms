import dotenv from 'dotenv';
import path from 'path';
import { DB_TYPES, STORAGE_TYPES } from '../shared/constants';
import type { DBType, StorageType } from '../shared/constants';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'change-this-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or uses the default value. Set a strong secret in .env');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  db: {
    type: (process.env.DB_TYPE || DB_TYPES.POSTGRES) as DBType,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'letterhead_control',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Oracle-specific (used only when DB_TYPE=oracle)
    oracle: {
      connectString: process.env.ORACLE_CONNECT_STRING || '',
    },
  },
  storage: {
    type: (process.env.STORAGE_TYPE || STORAGE_TYPES.LOCAL) as StorageType,
    root: process.env.STORAGE_ROOT || './uploads',
    sharepoint: {
      tenantId: process.env.SP_TENANT_ID || '',
      clientId: process.env.SP_CLIENT_ID || '',
      clientSecret: process.env.SP_CLIENT_SECRET || '',
      siteId: process.env.SP_SITE_ID || '',
      driveId: process.env.SP_DRIVE_ID || '',
      basePath: process.env.SP_BASE_PATH || '/DMS',
    },
  },
  jwt: {
    secret: jwtSecret || 'change-this-in-production',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    issuer: process.env.JWT_ISSUER || 'letterhead-control-system',
    audience: process.env.JWT_AUDIENCE || 'letterhead-control-client',
    algorithm: (process.env.JWT_ALGORITHM || 'HS256') as 'HS256' | 'RS256',
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
};
