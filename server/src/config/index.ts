import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'change-this-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or uses the default value. Set a strong secret in .env');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'letterhead_control',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    root: process.env.STORAGE_ROOT || './uploads',
  },
  jwt: {
    secret: jwtSecret || 'change-this-in-production',
    expiresIn: '8h',
    issuer: process.env.JWT_ISSUER || 'letterhead-control-system',
    audience: process.env.JWT_AUDIENCE || 'letterhead-control-client',
    algorithm: 'HS256' as const,
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
};
