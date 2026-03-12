export abstract class BaseDBAdapter {
  abstract query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  abstract queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  abstract execute(sql: string, params?: any[]): Promise<{ rowCount: number }>;
  abstract transaction<T>(fn: (adapter: BaseDBAdapter) => Promise<T>): Promise<T>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract runMigrations(migrationsDir: string): Promise<void>;
}
