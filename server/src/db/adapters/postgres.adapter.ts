import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { BaseDBAdapter } from './base.adapter';

export class PostgresAdapter extends BaseDBAdapter {
  private pool: Pool;
  private client?: PoolClient;

  constructor(config: { host: string; port: number; database: string; user: string; password: string }, client?: PoolClient) {
    super();
    this.pool = new Pool(config);
    this.client = client;
  }

  private get connection() {
    return this.client || this.pool;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.connection.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  async execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
    const result = await this.connection.query(sql, params);
    return { rowCount: result.rowCount || 0 };
  }

  async transaction<T>(fn: (adapter: BaseDBAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txAdapter = new PostgresAdapter(
        { host: '', port: 0, database: '', user: '', password: '' },
        client
      );
      txAdapter['pool'] = this.pool;
      txAdapter['client'] = client;
      const result = await fn(txAdapter);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async connect(): Promise<void> {
    await this.pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async runMigrations(migrationsDir: string): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename VARCHAR(500) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const existing = await this.queryOne(
        'SELECT id FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (!existing) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await this.execute(sql);
        await this.execute(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        console.log(`Migration applied: ${file}`);
      }
    }
  }
}
