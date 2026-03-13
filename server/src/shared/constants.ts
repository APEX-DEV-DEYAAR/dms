export const DB_TYPES = {
  POSTGRES: 'postgres',
  ORACLE: 'oracle',
} as const;

export type DBType = (typeof DB_TYPES)[keyof typeof DB_TYPES];

export const STORAGE_TYPES = {
  LOCAL: 'local',
  SHAREPOINT: 'sharepoint',
} as const;

export type StorageType = (typeof STORAGE_TYPES)[keyof typeof STORAGE_TYPES];

export const USER_ROLES = {
  DEPARTMENT_USER: 'department_user',
  COMPLIANCE: 'compliance',
  CEO_OFFICE: 'ceo_office',
  ADMIN: 'admin',
} as const;

export type UserRoleConst = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_MIME_TYPES: ['application/pdf'] as string[],
  ALLOWED_EXTENSIONS: ['.pdf'] as string[],
} as const;
